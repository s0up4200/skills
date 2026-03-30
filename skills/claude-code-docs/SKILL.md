---
name: claude-code-docs
description: "Search and reference official Claude Code documentation locally. Use whenever the user asks about Claude Code features, configuration, hooks, MCP, settings, permissions, CLI flags, IDE integrations, plugins, skills, agent teams, scheduled tasks, sub-agents, custom agents, worktrees, session management, Desktop app features, or any other Claude Code capability. Also use when you need to look something up yourself mid-task — checking hook schemas, CLI flags, environment variables, settings format, etc. Prefer this over web fetching for Claude Code docs. Claude Code evolves fast — features like custom agents (.claude/agents/), session forking (/branch), /batch, live app preview, and worktree support are newer and not reliably in model training data, so always check the docs rather than guessing."
---

# Claude Code Docs

Fast local search over the official Claude Code documentation. Uses [QMD](https://github.com/tobi/qmd) to index all English doc pages from [code.claude.com/docs](https://code.claude.com/docs) as individual markdown files.

## How to search

Use the QMD CLI via Bash to search the `claude-code-docs` collection:

```bash
# Search (auto-expands query, reranks results)
qmd query "hooks PreToolUse" -c claude-code-docs -n 3

# Read a full doc when you know which one you need
qmd get qmd://claude-code-docs/hooks.md --full

# List all available docs
qmd ls claude-code-docs
```

### Search strategy

1. **Start with `qmd query`** using 2-3 keywords from the user's question. Request only 3 results (`-n 3`) — the top hits are almost always sufficient.
2. **Read the most relevant doc in full** with `qmd get ... --full`. This is where the real answer lives. Skimming search snippets is not enough.
3. **Check related docs when the question spans multiple features.** Many Claude Code features have both a CLI flag and an in-session command (e.g., `--add-dir` and `/add-dir`, `--worktree` and `/branch`). If your answer involves a Desktop feature, also check if there's a CLI equivalent, and vice versa. A second `qmd query` with different keywords often surfaces the complementary doc.
4. **Stop searching once you have the answer.** Two or three doc reads should be enough for most questions. Don't keep searching for confirmation — synthesize what you found and respond.

## When the collection doesn't exist

If searching returns an error about the collection not existing, the user needs to set it up. The docs are mirrored from Mintlify's `llms-full.txt` endpoint and split into per-page markdown files.

### Prerequisites

- [QMD](https://github.com/tobi/qmd) installed and running (`npm install -g @tobilu/qmd`)
- The docs mirror repo cloned (contains `update.sh` and `docs/`)

### Setup

1. Clone or create the docs mirror repo
2. Run `./update.sh` to download and split docs into `docs/*.md`
3. Register with QMD:
   ```bash
   qmd collection add <path-to-docs-dir> --name claude-code-docs
   qmd context add "qmd://claude-code-docs/" "Official Claude Code documentation"
   qmd embed
   ```

## Updating docs

To update to the latest docs, find the collection path and run the update script:

```bash
# Easiest — triggers the registered update command
qmd update claude-code-docs

# Or manually: find the repo and run the script
DOCS_PATH="$(qmd collection show claude-code-docs 2>/dev/null | awk '/Path:/{print $2}')"
cd "$(dirname "$DOCS_PATH")" && ./update.sh
```

## Doc coverage

The collection mirrors all English pages from the sitemap (~50 docs), covering:

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
