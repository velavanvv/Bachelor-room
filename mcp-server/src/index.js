#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const apiBaseUrl = (
  process.env.BACHELOR_ROOM_API_URL ||
  "https://bachelor-room.onrender.com/api"
).replace(/\/+$/, "");

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
