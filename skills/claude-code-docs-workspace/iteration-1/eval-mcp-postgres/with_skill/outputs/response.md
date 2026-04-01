# Adding a PostgreSQL MCP Server to Claude Code

You can connect Claude Code to your PostgreSQL database using an MCP (Model Context Protocol) server so that Claude can query it directly using natural language. The recommended approach uses **@bytebase/dbhub**, a stdio-based MCP server that supports PostgreSQL.

## Quick Setup

Run this single command in your terminal (outside of Claude Code):

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://user:password@host:5432/dbname"
```

Replace the DSN with your actual PostgreSQL connection string:

- `user` -- your database username
- `password` -- your database password
- `host` -- your database host (e.g., `localhost`, `prod.db.example.com`)
- `5432` -- your database port (5432 is the PostgreSQL default)
- `dbname` -- the name of the database you want to query

**Example with a local dev database:**

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://postgres:postgres@localhost:5432/myapp_development"
```

**Example with a production read-only user:**

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:secretpass@prod.db.example.com:5432/analytics"
```

## Verify It Works

Once added, start or restart Claude Code and check the server status:

```
/mcp
```

This shows all connected MCP servers and their status. Your `db` server should appear as connected.

## Start Querying

With the MCP server connected, you can ask Claude natural language questions about your database:

- "What's our total revenue this month?"
- "Show me the schema for the orders table"
- "Find customers who haven't made a purchase in 90 days"
- "How many users signed up last week, broken down by day?"

Claude will use the MCP tools to inspect your schema and run SQL queries to answer your questions.

## Choosing the Right Scope

By default, the server is added at **local scope** (private to you, only in the current project). You can change this:

| Scope | Flag | Use case |
|-------|------|----------|
| Local (default) | `--scope local` | Personal use in one project. Credentials stay private. |
| Project | `--scope project` | Shared with your team via `.mcp.json` in the repo. |
| User | `--scope user` | Available to you across all projects. |

For database connections with credentials, **local scope** (the default) is usually the right choice since it keeps your connection string private.

## Using Environment Variables for Credentials

If you do not want to hardcode your password in the command, you can use environment variables. Pass them with the `--env` flag:

```bash
claude mcp add --transport stdio --env DATABASE_URL=postgresql://readonly:pass@host:5432/db db \
  -- npx -y @bytebase/dbhub --dsn "$DATABASE_URL"
```

For team-shared setups using project scope with `.mcp.json`, you can use variable expansion so each developer supplies their own credentials:

```json
{
  "mcpServers": {
    "db": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "${DATABASE_URL}"],
      "env": {}
    }
  }
}
```

Each team member sets `DATABASE_URL` in their shell environment, and the `.mcp.json` file can be safely committed to version control without exposing secrets.

## Using JSON Configuration Directly

You can also add the server using a JSON configuration:

```bash
claude mcp add-json db '{"type":"stdio","command":"npx","args":["-y","@bytebase/dbhub","--dsn","postgresql://user:pass@host:5432/dbname"]}'
```

## Security Recommendations

- **Use a read-only database user** whenever possible. This prevents Claude from accidentally modifying data.
- **Never commit credentials** to version control. Use environment variable expansion in `.mcp.json` if sharing with a team.
- **Prefer local scope** for servers that contain sensitive connection strings.
- Consider connecting to a **read replica** rather than your primary database to avoid any performance impact on production.

## Managing the Server

```bash
# List all configured MCP servers
claude mcp list

# View details for your database server
claude mcp get db

# Remove the server
claude mcp remove db
```

## Troubleshooting

- **Server not connecting**: Make sure `npx` is available in your PATH and that Node.js is installed.
- **Connection timeout**: You can increase the MCP startup timeout by launching Claude Code with `MCP_TIMEOUT=10000 claude` (value is in milliseconds).
- **Large query results**: If query output is being truncated, set `MAX_MCP_OUTPUT_TOKENS=50000` as an environment variable when starting Claude Code.
- **Check status**: Run `/mcp` inside Claude Code to see the connection status and any error messages.
