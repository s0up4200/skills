# Using the Desktop App to Start a Dev Server and Test in a Browser

Yes, the Claude Code Desktop app has a built-in **live app preview** feature that does exactly this. Claude can start your dev server, open an embedded browser inside the Desktop app, and visually verify its own changes -- all without you leaving the app.

## How it works

When you give Claude a task that involves a web app (frontend or backend), here is the typical flow:

1. **Claude edits your project files** based on your instructions.
2. **Claude starts your dev server automatically.** In most cases it detects your project setup and launches the server after making edits. You can also ask Claude to preview at any time.
3. **An embedded browser opens inside the Desktop app** showing your running application.
4. **Claude auto-verifies its changes.** By default, after every edit Claude takes screenshots of the running app, inspects the DOM, clicks elements, fills forms, and checks for errors. If it finds issues, it iterates and fixes them automatically.

You can also interact with the running app yourself directly in the embedded browser panel.

## What you can do from the preview panel

- Interact with your running app directly in the embedded browser
- Watch Claude verify its own changes automatically (screenshots, DOM inspection, clicking, form filling)
- Start or stop servers from the **Preview** dropdown in the session toolbar
- **Persist cookies and local storage** across server restarts by selecting "Persist sessions" in the dropdown (so you do not have to re-login during development)
- Edit the server configuration or stop all servers at once

## Server configuration

Claude automatically detects your dev server setup and stores the configuration in `.claude/launch.json` at the root of your project folder. If your app uses a custom dev command, you can edit this file to match your setup.

Here is a basic example:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "my-app",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

### Configuration fields

| Field               | Type     | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `name`              | string   | A unique identifier for this server                                         |
| `runtimeExecutable` | string   | The command to run (`npm`, `yarn`, `node`, etc.)                            |
| `runtimeArgs`       | string[] | Arguments passed to the executable (e.g., `["run", "dev"]`)                 |
| `port`              | number   | The port your server listens on (defaults to 3000)                          |
| `cwd`               | string   | Working directory relative to project root                                  |
| `env`               | object   | Additional environment variables as key-value pairs                         |
| `autoPort`          | boolean  | How to handle port conflicts (true = find a free port, false = fail)        |
| `program`           | string   | A script to run with `node` directly (alternative to `runtimeExecutable`)   |
| `args`              | string[] | Arguments passed to `program`                                               |

You can also define **multiple configurations** to run different servers simultaneously (e.g., a frontend and an API server).

## Auto-verify

Auto-verify is on by default. After every edit, Claude:

1. Takes screenshots of the running app
2. Checks for errors
3. Confirms changes work before completing its response

If you want to disable this, add `"autoVerify": false` to your `.claude/launch.json`, or toggle it from the **Preview** dropdown menu.

## Quick summary

The Desktop app gives you an integrated development loop: you describe what you want, Claude writes the code, starts the server, opens the app in an embedded browser, and visually checks that everything works. If something is broken, it fixes it and checks again. No need to switch between windows or manually refresh a browser.

This feature works for both frontend web apps and backend servers (Claude can test API endpoints and view server logs through the preview as well).
