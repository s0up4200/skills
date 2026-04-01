# Adding a Postgres MCP Server for Claude Code

This guide walks you through setting up a PostgreSQL MCP (Model Context Protocol) server so Claude Code can query your database directly during conversations.

## Overview

MCP servers act as bridges between Claude Code and external services. A Postgres MCP server exposes tools that let Claude run SQL queries, inspect schemas, and interact with your database without you having to copy-paste query results.

## Option 1: Using the Official `@modelcontextprotocol/server-postgres` Package

This is the most straightforward community MCP server for Postgres.

### Prerequisites

- Node.js (v18+) installed
- A running PostgreSQL database
- Your Postgres connection string (e.g., `postgresql://user:password@localhost:5432/mydb`)

### Configuration

Add the server to your Claude Code MCP configuration. You can do this at the project level or user level.

**Project-level** (`.mcp.json` in your project root):

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:password@localhost:5432/mydb"
      ]
    }
  }
}
```

**User-level** (`~/.claude.json` or via the Claude Code settings):

Same structure, but placed in your user-level config so it applies across all projects.

### Using the Claude Code CLI to Add It

You can also add it interactively:

```bash
claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres "postgresql://user:password@localhost:5432/mydb"
```

This registers the server in your configuration automatically.

### Security: Use Environment Variables for Credentials

**Do not hardcode your database password in configuration files that get committed to git.** Instead, use environment variables:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "${POSTGRES_CONNECTION_STRING}"
      ],
      "env": {
        "POSTGRES_CONNECTION_STRING": ""
      }
    }
  }
}
```

Then set `POSTGRES_CONNECTION_STRING` in your shell environment before launching Claude Code:

```bash
export POSTGRES_CONNECTION_STRING="postgresql://user:password@localhost:5432/mydb"
```

Alternatively, some configurations support an `env` block where you can reference environment variables directly.

## Option 2: Using a Docker-based Postgres MCP Server

If you prefer running the MCP server in a container:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "mcp/postgres",
        "postgresql://user:password@host.docker.internal:5432/mydb"
      ]
    }
  }
}
```

Note: Use `host.docker.internal` instead of `localhost` when connecting from inside a Docker container to a database running on your host machine.

## What Tools Become Available

Once configured, the Postgres MCP server typically exposes tools like:

- **`query`** - Execute a read-only SQL query against the database and return results
- **`list_tables`** or schema inspection - List all tables in the database
- **`describe_table`** - Get column names, types, and constraints for a specific table

The exact tool names depend on the MCP server implementation. Claude will automatically discover and use them.

## Verifying the Connection

After adding the configuration:

1. Restart Claude Code (or start a new session)
2. Ask Claude something like: "List all tables in my database" or "Describe the users table"
3. Claude should invoke the MCP tools and return results directly

You can also check that the MCP server is recognized:

```bash
claude mcp list
```

This shows all configured MCP servers and their status.

## Troubleshooting

### "Server not found" or tools not appearing

- Make sure `npx` is available in your PATH
- Verify the connection string is correct by testing it with `psql` first
- Check that the MCP server package name is spelled correctly

### Connection refused

- Ensure PostgreSQL is running and accepting connections
- Check that the host, port, username, and password are correct
- If using Docker, remember to use `host.docker.internal` instead of `localhost`

### Permission errors

- The database user in your connection string needs appropriate permissions
- For read-only access (recommended), create a dedicated user:

```sql
CREATE USER claude_reader WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mydb TO claude_reader;
GRANT USAGE ON SCHEMA public TO claude_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO claude_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO claude_reader;
```

### Timeout issues

- If you have a large database, initial schema introspection may take a moment
- Ensure your database is not behind a VPN or firewall that blocks the connection

## Best Practices

1. **Use a read-only database user** - Limit the MCP server to SELECT queries to prevent accidental data modification
2. **Never commit credentials** - Use environment variables or keep `.mcp.json` in `.gitignore` if it contains sensitive connection strings
3. **Use a local/dev database** - Avoid pointing Claude directly at production databases
4. **Review queries before approval** - Claude Code will show you the SQL it wants to run; review it before allowing execution

## Scope Options

You can configure the MCP server at different scopes:

| Scope | Config Location | Use Case |
|-------|----------------|----------|
| Project | `.mcp.json` in project root | Shared with team (no secrets!) |
| User | `~/.claude.json` | Personal databases across projects |
| Command line | `claude mcp add --scope user` | Quick setup via CLI |

## Summary

1. Install/configure the `@modelcontextprotocol/server-postgres` MCP server
2. Provide your Postgres connection string (via environment variables for security)
3. Restart Claude Code
4. Start asking Claude to query your database directly

Claude will then have direct access to run queries, inspect schemas, and help you work with your PostgreSQL data interactively.
