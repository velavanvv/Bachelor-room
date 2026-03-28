# Bachelor Room MCP Server

This is a standalone MCP server for the Bachelor Room product. It connects to the existing Laravel backend over HTTP and exposes room-management tools through MCP.

## What it can do

- authenticate with the backend
- fetch dashboard stats and recent activities
- list users
- list contributions by month
- list expenses
- get wallet data
- create expenses
- record monthly contributions

## Requirements

- Node.js 18 or newer
- access to the Bachelor Room backend API

Default backend URL:

`https://bachelor-room.onrender.com/api`

## Install

```bash
cd /Users/velavan/bachelor/Bachelor-room/mcp-server
npm install
```

## Run

```bash
cd /Users/velavan/bachelor/Bachelor-room/mcp-server
npm start
```

Optional environment variables:

- `BACHELOR_ROOM_API_URL`
- `BACHELOR_ROOM_TOKEN`

Example:

```bash
BACHELOR_ROOM_API_URL=https://bachelor-room.onrender.com/api npm start
```

## Connect from an MCP client

Example MCP client config using stdio:

```json
{
  "mcpServers": {
    "bachelor-room": {
      "command": "node",
      "args": [
        "/Users/velavan/bachelor/Bachelor-room/mcp-server/src/index.js"
      ],
      "env": {
        "BACHELOR_ROOM_API_URL": "https://bachelor-room.onrender.com/api"
      }
    }
  }
}
```

## Recommended first use

1. Run `server_info`
2. Run `login`
3. Run `check_auth`
4. Use the room tools

## Notes

- The server keeps the login token in memory for the current process.
- If you already have a backend token, set `BACHELOR_ROOM_TOKEN` and skip `login`.
- Admin-only backend routes still require an admin account.
