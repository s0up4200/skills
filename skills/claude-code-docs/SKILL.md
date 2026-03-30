---
name: claude-code-docs
description: "Search and reference official Claude Code documentation locally. Use whenever the user asks about Claude Code features, configuration, hooks, MCP, settings, permissions, CLI flags, IDE integrations, plugins, skills, agent teams, scheduled tasks, or any other Claude Code capability. Also use when you need to look something up yourself mid-task — checking hook schemas, CLI flags, environment variables, settings format, etc. Prefer this over web fetching for Claude Code docs. If the QMD collection isn't set up yet, this skill includes setup instructions."
---

# Claude Code Docs

Fast local search over the official Claude Code documentation. Uses [QMD](https://github.com/tobi/qmd) to index all English doc pages from [code.claude.com/docs](https://code.claude.com/docs) as individual markdown files.

## How to search

Use the QMD CLI via Bash to search the `claude-code-docs` collection:

```bash
# Search (auto-expands query, reranks results)
qmd query "hooks PreToolUse" -c claude-code-docs -n 5

# Read a full doc
qmd get qmd://claude-code-docs/hooks.md --full

# List all available docs
qmd ls claude-code-docs
```

For quick keyword lookups (CLI flags, env var names, setting keys), a simple search is enough. For conceptual questions ("how does X work"), `qmd query` automatically expands and reranks.

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

The docs mirror has an `update.sh` script that:
1. Downloads the latest `llms-full.txt` from code.claude.com
2. Splits it into individual markdown files in `docs/`
3. Re-indexes and re-embeds the QMD collection

Run `./update.sh` from the docs mirror repo, or trigger it via `qmd update --pull` (it's registered as the collection's update command).

## Doc coverage

The collection mirrors all English pages from the sitemap (~70 pages), covering:

- Getting started (overview, quickstart, setup)
- Core features (hooks, MCP, memory, permissions, settings, commands, skills, plugins)
- IDE integrations (VS Code, JetBrains, Desktop)
- CI/CD (GitHub Actions, GitLab CI/CD)
- Cloud providers (Amazon Bedrock, Google Vertex AI, Microsoft Foundry)
- Advanced (agent teams, sub-agents, headless mode, scheduled tasks, channels)
- Reference (CLI, tools, env vars, keybindings)
- Operations (costs, monitoring, analytics, network config, sandboxing)
