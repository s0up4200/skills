# Using Claude Desktop App to Start a Dev Server and Test in a Browser

## Short Answer

Yes, you can use Claude (via Claude Code, Anthropic's CLI tool) to start your dev server and interact with a browser -- but the exact workflow depends on which tools and integrations you have set up. Here is how it works in practice.

## How It Works

### 1. Starting a Dev Server

Claude Code can run shell commands on your behalf using its Bash tool. This means you can ask Claude to start a dev server just like you would in a terminal:

- "Start my Next.js dev server"
- "Run `npm run dev` in the background"

Claude will execute the command (e.g., `npm run dev`, `python manage.py runserver`, `vite`, etc.) and can run it in the background so the conversation continues while the server is up.

### 2. Testing in a Browser

This is where it gets more interesting. Claude Code itself does not have a built-in browser, but it can interact with a browser through **MCP (Model Context Protocol) servers** -- specifically a Chrome DevTools MCP server. If you have one configured (such as `chrome-devtools`), Claude can:

- **Open new browser pages** and navigate to your local dev server (e.g., `http://localhost:3000`)
- **Take screenshots** of the page to visually inspect what is rendered
- **Click elements**, **fill forms**, **type text**, and **press keys** to interact with the UI
- **Read console messages** and **network requests** for debugging
- **Evaluate JavaScript** directly in the browser's context
- **Run Lighthouse audits** for performance and accessibility checks

### 3. Typical Workflow

Here is what a typical session looks like:

1. **You ask Claude to start the dev server.** Claude runs the command in the background (e.g., `npm run dev`).
2. **You ask Claude to open the page in a browser.** Claude uses the Chrome DevTools MCP to navigate to `localhost:3000` (or whatever port).
3. **You ask Claude to check if it looks right.** Claude takes a screenshot and shows it to you, or inspects the DOM/console for errors.
4. **You iterate.** You can ask Claude to click buttons, fill out forms, check for errors, and then make code changes -- all in the same conversation.

### 4. Setup Requirements

For the browser interaction part to work, you need:

- **Claude Code** (the CLI tool, `claude`) installed and running
- A **Chrome DevTools MCP server** configured in your MCP settings (typically in `.mcp.json` at your project root or in your global Claude config). This MCP server connects to a Chrome/Chromium instance via the Chrome DevTools Protocol.
- **Chrome or Chromium** installed on your machine

A typical `.mcp.json` entry for Chrome DevTools might look like:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["@anthropic-ai/chrome-devtools-mcp"]
    }
  }
}
```

(The exact package name and configuration may vary -- check the latest documentation for the specific MCP server you are using.)

### 5. What About the Claude Desktop App Specifically?

The **Claude Desktop app** (the Electron-based GUI at claude.ai/download) supports MCP servers as well, configured through its settings. If you have a Chrome DevTools MCP server configured there, you can get similar browser interaction capabilities. However, the Desktop app does not have the same Bash/shell execution capabilities as Claude Code (the CLI). So:

- **Claude Code (CLI):** Can start dev servers (via Bash) AND interact with browsers (via MCP). This is the most complete workflow.
- **Claude Desktop App:** Can interact with browsers (via MCP) but cannot directly run shell commands to start your dev server. You would need to start the server yourself in a separate terminal, then ask Claude to navigate to it and test.

### 6. Limitations to Be Aware Of

- The browser interaction is **not real-time video** -- Claude takes snapshots (screenshots) and reads DOM state at specific moments. It does not "watch" the page continuously.
- Background processes (like a dev server) persist only for the duration of the Claude Code session.
- The Chrome DevTools MCP needs a running Chrome instance with remote debugging enabled, or it launches one for you (depending on the MCP server implementation).
- Complex multi-step UI testing can be done but may require patience and explicit instructions for each step.

## Summary

| Capability | Claude Code (CLI) | Claude Desktop App |
|---|---|---|
| Start dev server | Yes (via Bash) | No (manual) |
| Navigate browser | Yes (via MCP) | Yes (via MCP) |
| Take screenshots | Yes (via MCP) | Yes (via MCP) |
| Click/type/interact | Yes (via MCP) | Yes (via MCP) |
| Read console/network | Yes (via MCP) | Yes (via MCP) |
| Run Lighthouse audits | Yes (via MCP) | Yes (via MCP) |

The most seamless experience is with **Claude Code (CLI)** where you can do everything -- start the server, open the browser, test, debug, and fix code -- all in one conversation.
