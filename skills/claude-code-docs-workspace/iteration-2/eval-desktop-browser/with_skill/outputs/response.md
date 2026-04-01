# Using the Desktop App to Start a Dev Server and Test in a Browser

Yes, the Claude Code Desktop app has a built-in **live app preview** feature that does exactly this. Claude can start your dev server, open an embedded browser inside the Desktop app, and visually verify that things work -- all without you switching to a separate browser window.

## How It Works

When you give Claude a task that involves a web app, the workflow looks like this:

1. **Claude starts your dev server automatically.** After editing your project files, Claude typically launches the dev server on its own. You can also ask it to start the server at any time, or use the **Preview** dropdown in the session toolbar to start/stop servers manually.

2. **An embedded browser opens inside Desktop.** The preview panel shows your running app right next to the conversation. You can interact with it directly -- click around, fill in forms, navigate pages.

3. **Claude verifies its own changes.** With the **auto-verify** feature (on by default), Claude automatically takes screenshots of the running app after every edit, inspects the DOM, clicks elements, fills forms, and checks for errors. If it finds issues, it fixes them and re-checks.

This works for both frontend web apps and backend servers. Claude can test API endpoints, read server logs, and iterate on problems it discovers.

## What You Can Do From the Preview Panel

- Interact with the running app directly in the embedded browser
- Watch Claude auto-verify changes (screenshots, DOM inspection, clicking, form filling)
- Start or stop servers from the **Preview** dropdown
- Enable **Persist sessions** to keep cookies and local storage across server restarts (so you don't have to re-login during development)
- Edit the server configuration or stop all servers at once

## Configuring Your Dev Server

Claude auto-detects your project's dev server setup and stores the configuration in `.claude/launch.json` at the project root. If your app uses a custom dev command (e.g., `yarn dev` instead of `npm run dev`, or a non-standard port), you can edit this file manually or click **Edit configuration** in the Preview dropdown.

Here is an example `launch.json`:

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

You can define multiple configurations for projects with separate frontend and backend servers:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "apps/web",
      "port": 3000,
      "autoPort": true
    },
    {
      "name": "api",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start"],
      "cwd": "server",
      "port": 8080,
      "autoPort": false
    }
  ]
}
```

Key configuration fields include `runtimeExecutable`, `runtimeArgs`, `port`, `cwd` (working directory relative to project root), `env` (environment variables), and `autoPort` (whether to auto-pick a free port on conflict).

## Auto-Verify

Auto-verify is on by default. After every file edit, Claude automatically checks the running app to confirm the change works. To disable it per-project, add `"autoVerify": false` to your `launch.json`, or toggle it from the Preview dropdown menu.

## What About Chrome Integration?

The Desktop preview feature is separate from the Chrome browser integration. If you need Claude to test in an actual Chrome browser (e.g., to access authenticated sites, test with real browser extensions, or debug with Chrome DevTools), that is a different feature:

- Install the [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) (v1.0.36+)
- Launch Claude Code with `--chrome` or run `/chrome` in a session
- Claude can then open tabs in your real Chrome browser, interact with pages, read console logs, and more

The Desktop embedded preview is the simpler, zero-setup option for testing your own local dev server. Chrome integration is for when you need a real browser environment or want to interact with external sites.
