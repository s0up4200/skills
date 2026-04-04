---
name: claude-code-docs
description: "Search and reference official Claude Code documentation locally. Use whenever the user asks about Claude Code features, configuration, hooks, MCP, settings, permissions, CLI flags, IDE integrations, plugins, skills, agent teams, scheduled tasks, sub-agents, custom agents, worktrees, session management, Desktop app features, or any other Claude Code capability. Also use when you need to look something up yourself mid-task — checking hook schemas, CLI flags, environment variables, settings format, etc. Prefer this over web fetching for Claude Code docs. Claude Code evolves fast — features like custom agents (.claude/agents/), session forking (/branch), /batch, live app preview, and worktree support are newer and not reliably in model training data, so always check the docs rather than guessing."
---

# Claude Code Docs

Local search over the official Claude Code documentation. All ~74 English doc pages from [code.claude.com/docs](https://code.claude.com/docs) are stored as individual markdown files with descriptive filenames.

## How to search

The docs live in a local directory. Find it by checking common locations:

```bash
# Check if there's a known docs path
ls ~/github/*/claude-docs/claude-code/docs/*.md 2>/dev/null || ls ~/.claude/claude-code-docs/docs/*.md 2>/dev/null
```

### Search strategy

1. **Start with Grep** using 2-3 keywords from the user's question across all `*.md` files in the docs directory. This quickly identifies which docs are relevant.
2. **Read the most relevant doc in full** using Read. The real answer lives in the full document — grep snippets alone are not enough context.
3. **Check related docs when the question spans multiple features.** Many Claude Code features have both a CLI flag and an in-session command (e.g., `--add-dir` and `/add-dir`, `--worktree` and `/branch`). If your answer involves a Desktop feature, also check if there's a CLI equivalent, and vice versa. A second grep with different keywords often surfaces the complementary doc.
4. **Stop searching once you have the answer.** Two or three doc reads should be enough for most questions. Don't keep searching for confirmation — synthesize what you found and respond.

### Tips

- File names are descriptive: `hooks.md`, `mcp.md`, `cli-reference.md`, `settings.md`, `permissions.md`, etc.
- Use Glob with `**/*.md` to list all available docs if you need to browse
- When you know the topic, go straight to the file (see the mapping table below) instead of searching

## Setup

The docs are mirrored from Mintlify's `llms-full.txt` endpoint and split into per-page markdown files.

1. Clone the docs mirror repo (contains `update.sh` and `docs/`)
2. Run `./update.sh` to download and split docs into `docs/*.md`

To update to the latest docs, re-run `./update.sh` in the repo.

## Doc coverage

The docs directory contains all English pages from the sitemap (~74 docs), covering:

- Getting started (overview, quickstart, setup)
- Core features (hooks, MCP, memory, permissions, settings, commands, skills, plugins)
- IDE integrations (VS Code, JetBrains, Desktop)
- CI/CD (GitHub Actions, GitLab CI/CD)
- Cloud providers (Amazon Bedrock, Google Vertex AI, Microsoft Foundry)
- Advanced (agent teams, sub-agents, headless mode, scheduled tasks, channels)
- Reference (CLI, tools, env vars, keybindings)
- Operations (costs, monitoring, analytics, network config, sandboxing)

## Common doc mapping

When you know roughly what topic you need, go straight to the doc instead of searching:

| Topic | Doc file |
|---|---|
| Hooks (PreToolUse, PostToolUse, Stop) | `hooks.md`, `hooks-guide.md` |
| MCP servers | `mcp.md` |
| CLI flags and headless mode | `cli-reference.md`, `headless.md` |
| Custom agents / sub-agents | `sub-agents.md` |
| Settings and permissions | `settings.md`, `permissions.md` |
| Desktop app (preview, browser) | `desktop.md` |
| GitHub Actions / CI | `github-actions.md`, `gitlab-ci-cd.md` |
| Environment variables | `env-vars.md` |
| Plugins and skills | `plugins.md`, `skills.md` |
| Session management, forking | `interactive-mode.md` |
| Worktrees and parallel work | `common-workflows.md` |
| Chrome DevTools / browser testing | `chrome.md` |
