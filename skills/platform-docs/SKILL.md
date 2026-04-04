---
name: platform-docs
description: "Search and reference official Anthropic platform documentation locally. Use whenever the user asks about the Claude API, Anthropic SDKs (Python, TypeScript), REST API endpoints, models, pricing, tool use, computer use, MCP server protocol, prompt engineering, extended thinking, prompt caching, vision, batch processing, Agent SDK, embeddings, streaming, structured outputs, citations, context windows, token counting, files API, PDF support, multilingual support, model deprecations, rate limits, error codes, or any other Anthropic platform capability. Also use when you need to look up API details yourself mid-task — checking request/response schemas, SDK method signatures, authentication, or endpoint parameters. Prefer this over web fetching for Anthropic API and platform docs. NOT for Claude Code (the CLI tool) — use claude-code-docs for that."
---

# Anthropic Platform Docs

Local search over the official Anthropic platform documentation. All ~488 English doc pages from [platform.claude.com/docs](https://platform.claude.com/docs) are stored as individual markdown files with directory structure preserved.

## How to search

The docs live in a local directory. Find it by checking common locations:

```bash
ls ~/github/*/claude-docs/platform/docs/**/*.md 2>/dev/null
```

### Search strategy

The platform docs are larger (~488 pages) than Claude Code docs, organized into category directories. Narrow by category first, then search within.

1. **Identify the category** from the table below. Most questions map to one or two directories.
2. **Grep within that directory** using 2-3 keywords. This quickly narrows to the right doc.
3. **Read the most relevant doc in full** using Read. Grep snippets alone lack context — the full doc has examples, edge cases, and related parameters.
4. **Check related docs when the question spans features.** For example, tool use touches both `agents-and-tools/` and `api/` (for the request schema). A second grep often surfaces the complementary doc.
5. **Stop searching once you have the answer.** Two or three doc reads should be enough. Don't keep searching for confirmation.

### Category directory mapping

| Category | Directory | Pages | What's inside |
|---|---|---|---|
| API Reference | `api/` | 314 | REST endpoints, request/response schemas, all parameters |
| Build with Claude | `build-with-claude/` | 40 | Features: vision, caching, streaming, thinking, structured output, etc. |
| Resources | `resources/` | 65 | Guides, cookbooks, migration guides, examples |
| Agent SDK | `agent-sdk/` | 25 | Agent SDK for Python and TypeScript |
| Agents & Tools | `agents-and-tools/` | 18 | Tool use, MCP, computer use, prompt chaining |
| About Claude | `about-claude/` | 12 | Models overview, pricing, deprecations, what's new |
| Test & Evaluate | `test-and-evaluate/` | 10 | Evals, benchmarks, testing strategies |
| Release Notes | `release-notes/` | 2 | API changelog |

Two root-level docs: `get-started.md` and `intro.md`.

### Common lookups

| Looking for... | Start here |
|---|---|
| API request/response format | `api/messages/` |
| Model names, context windows, pricing | `about-claude/models/` and `about-claude/pricing.md` |
| Tool use (function calling) | `agents-and-tools/tool-use/` |
| Prompt caching | `build-with-claude/prompt-caching.md` |
| Extended thinking | `build-with-claude/extended-thinking.md` |
| Vision / image input | `build-with-claude/vision.md` |
| Streaming | `build-with-claude/streaming.md` |
| Structured output (JSON) | `build-with-claude/structured-outputs.md` |
| Batch API | `build-with-claude/batch-processing.md` |
| Agent SDK | `agent-sdk/` |
| Computer use | `agents-and-tools/tool-use/computer-use/` |
| MCP (Model Context Protocol) | `agents-and-tools/mcp/` |
| Prompt engineering tips | `build-with-claude/prompt-engineering/` |
| Error codes and rate limits | `api/errors/` or grep for "rate limit" |
| SDK setup (Python/TypeScript) | `resources/quickstarts/` |

### Tips

- Directory names match the platform.claude.com URL structure, so if you know the URL slug you know the file path
- API reference pages (`api/`) are very granular — one page per endpoint or schema component
- Use Glob with `**/*.md` to list all docs or browse a category
- The `resources/` directory has practical cookbooks and migration guides — check there for "how do I..." questions
