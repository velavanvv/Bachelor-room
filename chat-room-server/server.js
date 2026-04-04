import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, ".env");

if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of envLines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
const apiBaseUrl = (
  process.env.BACHELOR_ROOM_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const connections = new Map();
const roomConnections = new Map();

function isOriginAllowed(origin) {
  if (!origin || allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

async function apiRequest(requestPath, options = {}) {
  const response = await fetch(`${apiBaseUrl}${requestPath}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? data.message || JSON.stringify(data)
        : String(data);

    throw new Error(`API ${response.status}: ${message}`);
  }

  return data;
}

async function authenticate(token) {
  if (!token) {
    throw new Error("Missing auth token.");
  }

  const data = await apiRequest("/check-auth", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.user;
}

async function persistMessage(token, payload) {
  const data = await apiRequest("/chat-room/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });

  return data.data;
}

function getRoomSet(room) {
  if (!roomConnections.has(room)) {
    roomConnections.set(room, new Set());
  }

  return roomConnections.get(room);
}

function frameTextPayload(payload) {
  const payloadBuffer = Buffer.from(payload);
  const payloadLength = payloadBuffer.length;

  if (payloadLength < 126) {
    return Buffer.concat([Buffer.from([0x81, payloadLength]), payloadBuffer]);
  }

  if (payloadLength < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
    return Buffer.concat([header, payloadBuffer]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payloadLength), 2);
  return Buffer.concat([header, payloadBuffer]);
}

function send(socket, payload) {
  if (socket.destroyed) {
    return;
  }

  socket.write(frameTextPayload(JSON.stringify(payload)));
}

function broadcast(room, payload) {
  const sockets = roomConnections.get(room);

  if (!sockets) {
    return;
  }

  for (const socket of sockets) {
    send(socket, payload);
  }
}

function detachSocket(socket) {
  const connection = connections.get(socket);

  if (!connection) {
    return;
  }

  const sockets = roomConnections.get(connection.room);

  if (sockets) {
    sockets.delete(socket);

    if (sockets.size === 0) {
      roomConnections.delete(connection.room);
    }
  }

  connections.delete(socket);
}

function parseFrames(socket, chunk) {
  const existingBuffer = connections.get(socket)?.buffer || Buffer.alloc(0);
  let buffer = Buffer.concat([existingBuffer, chunk]);

  while (buffer.length >= 2) {
    const firstByte = buffer[0];
    const secondByte = buffer[1];
    const opcode = firstByte & 0x0f;
    const isMasked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
      if (buffer.length < offset + 2) {
        break;
      }

      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      if (buffer.length < offset + 8) {
        break;
      }

      const bigLength = buffer.readBigUInt64BE(offset);
      payloadLength = Number(bigLength);
      offset += 8;
    }

    const maskLength = isMasked ? 4 : 0;
    const frameLength = offset + maskLength + payloadLength;

    if (buffer.length < frameLength) {
      break;
    }

    if (opcode === 0x8) {
      socket.end();
      detachSocket(socket);
      return;
    }

    if (opcode === 0x9) {
      socket.write(Buffer.from([0x8a, 0x00]));
      buffer = buffer.slice(frameLength);
      continue;
    }

    if (opcode !== 0x1) {
      buffer = buffer.slice(frameLength);
      continue;
    }

    let payload = buffer.slice(offset + maskLength, frameLength);

    if (isMasked) {
      const mask = buffer.slice(offset, offset + 4);
      const decoded = Buffer.alloc(payload.length);

      for (let index = 0; index < payload.length; index += 1) {
        decoded[index] = payload[index] ^ mask[index % 4];
      }

      payload = decoded;
    }

    handleSocketMessage(socket, payload.toString("utf8"));
    buffer = buffer.slice(frameLength);
  }

  const connection = connections.get(socket);

  if (connection) {
    connection.buffer = buffer;
  }
}

async function handleSocketMessage(socket, rawMessage) {
  const connection = connections.get(socket);

  if (!connection) {
    return;
  }

  let parsed;

  try {
    parsed = JSON.parse(rawMessage);
  } catch {
    send(socket, { type: "error", message: "Invalid message payload." });
    return;
  }

  if (parsed.type === "ping") {
    send(socket, { type: "pong", timestamp: new Date().toISOString() });
    return;
  }

  if (parsed.type !== "chat-message") {
    send(socket, { type: "error", message: "Unsupported message type." });
    return;
  }

  const content = String(parsed.content || "").trim();

  if (!content) {
    send(socket, { type: "error", message: "Message cannot be empty." });
    return;
  }

  try {
    const message = await persistMessage(connection.token, {
      room: connection.room,
      content,
    });

    broadcast(connection.room, {
      type: "chat-message",
      message,
    });
  } catch (error) {
    send(socket, {
      type: "error",
      message: error.message || "Failed to save chat message.",
    });
  }
}

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        ok: true,
        connections: connections.size,
        rooms: roomConnections.size,
      })
    );
    return;
  }

  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Bachelor Room chat server is running.");
});

server.on("upgrade", async (request, socket) => {
  try {
    if (request.headers.upgrade?.toLowerCase() !== "websocket") {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }

    if (!isOriginAllowed(request.headers.origin)) {
      socket.end("HTTP/1.1 403 Forbidden\r\n\r\n");
      return;
    }

    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const token = url.searchParams.get("token") || "";
    const room = url.searchParams.get("room") || "main-room";
    const user = await authenticate(token);
    const socketKey = request.headers["sec-websocket-key"];

    if (!socketKey) {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }

    const acceptKey = crypto
      .createHash("sha1")
      .update(`${socketKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest("base64");

    socket.write(
      [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${acceptKey}`,
        "\r\n",
      ].join("\r\n")
    );

    connections.set(socket, {
      token,
      room,
      user,
      buffer: Buffer.alloc(0),
    });
    getRoomSet(room).add(socket);

    send(socket, {
      type: "connected",
      room,
      user,
    });

    socket.on("data", (chunk) => parseFrames(socket, chunk));
    socket.on("close", () => detachSocket(socket));
    socket.on("end", () => detachSocket(socket));
    socket.on("error", () => detachSocket(socket));
  } catch (error) {
    socket.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
  }
});

server.listen(port, host, () => {
  console.log(
    `Bachelor Room chat server listening on http://${host}:${port} using API ${apiBaseUrl}`
  );
});
