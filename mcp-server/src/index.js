#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

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

const apiBaseUrl = (
  process.env.BACHELOR_ROOM_API_URL ||
  "https://bachelor-room.onrender.com/api"
).replace(/\/+$/, "");
const sambaNovaApiKey = process.env.SAMBANOVA_API_KEY || "";
const sambaNovaModel = process.env.SAMBANOVA_MODEL || "DeepSeek-R1-0528";

const session = {
  token: process.env.BACHELOR_ROOM_TOKEN || null,
  user: null,
};

function asText(value) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

async function apiRequest(path, options = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();
  let data;

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

function requireLogin() {
  if (!session.token) {
    throw new Error(
      "Not authenticated. Run the login tool first or set BACHELOR_ROOM_TOKEN."
    );
  }
}

function sanitizeReply(reply) {
  const withoutThinking = reply.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "");
  const cleaned = withoutThinking.replace(/^\s*#+\s*/gm, "").trim();
  return cleaned || "I could not format that response cleanly. Please ask again.";
}

async function sambaNovaRequest(prompt, history = []) {
  if (!sambaNovaApiKey) {
    throw new Error(
      "SambaNova API key not configured. Set SAMBANOVA_API_KEY in mcp-server/.env or process env."
    );
  }

  const sanitizedHistory = history
    .filter((message) => message && message.role && message.content)
    .slice(-8)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  const response = await fetch(
    "https://api.sambanova.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sambaNovaApiKey}`,
      },
      body: JSON.stringify({
        model: sambaNovaModel,
        messages: [
          {
            role: "system",
            content:
              "You are the Bachelor Room assistant. Help with expenses, contributions, wallet balance, room rules, admin/member flows, and general product guidance. Keep replies practical and concise. Never reveal chain-of-thought, hidden reasoning, or <think> blocks. Return only the final user-facing answer.",
          },
          ...sanitizedHistory.map((message) => ({
            role: message.role === "model" ? "assistant" : "user",
            content: message.parts?.[0]?.text || "",
          })),
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "SambaNova request failed."
    );
  }

  const text = sanitizeReply(
    data?.choices?.[0]?.message?.content?.trim() ||
    "No response received from SambaNova."
  );

  return text;
}

const server = new McpServer({
  name: "bachelor-room-mcp",
  version: "1.0.0",
});

server.tool(
  "server_info",
  {},
  async () =>
    asText({
      apiBaseUrl,
      authenticated: Boolean(session.token),
      user: session.user,
      tools: [
        "login",
        "logout",
        "check_auth",
        "get_dashboard_stats",
        "get_recent_activities",
        "list_users",
        "list_contributions_by_month",
        "list_expenses",
        "get_wallet",
        "create_expense",
        "pay_contribution",
        "chat_with_room_assistant",
      ],
    })
);

server.tool(
  "login",
  {
    email: z.string().email(),
    password: z.string().min(1),
  },
  async ({ email, password }) => {
    const data = await apiRequest("/login", {
      method: "POST",
      body: { email, password },
    });

    session.token = data.token;
    session.user = data.user;

    return asText({
      message: "Authenticated successfully.",
      user: data.user,
    });
  }
);

server.tool("logout", {}, async () => {
  requireLogin();
  await apiRequest("/logout", { method: "POST" });
  session.token = null;
  session.user = null;
  return asText("Logged out.");
});

server.tool("check_auth", {}, async () => {
  requireLogin();
  const data = await apiRequest("/check-auth");
  session.user = data.user || session.user;
  return asText(data);
});

server.tool("get_dashboard_stats", {}, async () => {
  requireLogin();
  return asText(await apiRequest("/dashboard/stats"));
});

server.tool("get_recent_activities", {}, async () => {
  requireLogin();
  return asText(await apiRequest("/dashboard/activities"));
});

server.tool(
  "list_users",
  {
    adminView: z.boolean().optional(),
  },
  async ({ adminView = false }) => {
    requireLogin();
    const path = adminView ? "/admin/users" : "/users";
    return asText(await apiRequest(path));
  }
);

server.tool(
  "list_contributions_by_month",
  {
    month: z.string().regex(/^\d{4}-\d{2}$/),
  },
  async ({ month }) => {
    requireLogin();
    return asText(await apiRequest(`/contributions/month/${month}`));
  }
);

server.tool(
  "list_expenses",
  {
    mode: z.enum(["all", "recent", "month"]).default("all"),
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  },
  async ({ mode, month }) => {
    requireLogin();

    if (mode === "recent") {
      return asText(await apiRequest("/expenses/recent"));
    }

    if (mode === "month") {
      if (!month) {
        throw new Error("month is required when mode is 'month'.");
      }

      return asText(await apiRequest(`/expenses/month/${month}`));
    }

    return asText(await apiRequest("/expenses"));
  }
);

server.tool(
  "get_wallet",
  {
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  },
  async ({ month }) => {
    requireLogin();
    const path = month ? `/wallet/${month}` : "/wallet/current";
    return asText(await apiRequest(path));
  }
);

server.tool(
  "create_expense",
  {
    expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: z.string().min(1),
    amount: z.number().int().positive(),
    created_by: z.number().int().positive(),
  },
  async (input) => {
    requireLogin();
    return asText(
      await apiRequest("/expenses", {
        method: "POST",
        body: input,
      })
    );
  }
);

server.tool(
  "chat_with_room_assistant",
  {
    prompt: z.string().min(1),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1),
        })
      )
      .optional(),
  },
  async ({ prompt, history = [] }) => {
    const reply = await sambaNovaRequest(prompt, history);
    return asText({
      model: sambaNovaModel,
      reply,
    });
  }
);

server.tool(
  "pay_contribution",
  {
    user_id: z.number().int().positive(),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    amount: z.number().int().positive(),
  },
  async (input) => {
    requireLogin();
    return asText(
      await apiRequest("/contributions/pay", {
        method: "POST",
        body: input,
      })
    );
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
