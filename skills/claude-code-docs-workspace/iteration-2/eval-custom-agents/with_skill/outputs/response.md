# Setting Up Custom Agents (Subagents) in Claude Code

Custom agents in Claude Code are called **subagents**. They are specialized AI assistants that run in their own context window with a custom system prompt, specific tool access, and independent permissions. Here is how to set up a custom code reviewer agent.

## What Subagents Give You

- **Preserve context** -- the subagent's work stays out of your main conversation
- **Enforce constraints** -- limit which tools the subagent can use (e.g., read-only for a reviewer)
- **Specialize behavior** -- focused system prompts for specific domains
- **Control costs** -- route to faster, cheaper models like Haiku when appropriate
- **Reuse across projects** -- user-level subagents are available everywhere

## Creating a Code Reviewer Subagent

There are three ways to create a subagent: the interactive `/agents` command, writing a markdown file manually, or passing JSON via the CLI.

### Option 1: Interactive Creation with `/agents`

1. Run `/agents` inside Claude Code
2. Select **Create new agent**
3. Choose a scope:
   - **Personal** (`~/.claude/agents/`) -- available in all your projects
   - **Project** (`.claude/agents/`) -- specific to this codebase, can be checked into version control
4. Select **Generate with Claude** and describe your agent, e.g.: "A code reviewer that checks for quality, security, and best practices. It should be read-only."
5. Select tools -- for a reviewer, pick **Read-only tools** (Read, Grep, Glob, Bash)
6. Choose a model (e.g., Sonnet for a good balance of speed and capability)
7. Optionally pick a color and configure persistent memory
8. Save

### Option 2: Write a Markdown File Manually

Create a `.md` file in either `~/.claude/agents/` (user-level) or `.claude/agents/` (project-level). The file uses YAML frontmatter for configuration and the body becomes the system prompt.

Here is a complete code reviewer example:

```markdown
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:
- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented
- Good test coverage
- Performance considerations addressed

Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)

Include specific examples of how to fix issues.
```

Save this as `~/.claude/agents/code-reviewer.md` (user-level) or `.claude/agents/code-reviewer.md` (project-level).

**Note:** Subagents are loaded at session start. If you create the file manually, restart your session or use `/agents` to load it immediately.

### Option 3: CLI Flag (Session-Only)

Pass the agent definition as JSON when launching Claude Code. This is useful for quick testing:

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices. Review checklist: readability, naming, duplication, error handling, secrets, input validation, test coverage, performance.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

This agent exists only for that session and is not saved to disk.

## Frontmatter Configuration Reference

Only `name` and `description` are required. Key optional fields:

| Field | Description |
|---|---|
| `name` | Unique identifier, lowercase letters and hyphens |
| `description` | When Claude should delegate to this subagent |
| `tools` | Allowlist of tools the subagent can use (inherits all if omitted) |
| `disallowedTools` | Tools to deny, removed from the inherited or specified list |
| `model` | `sonnet`, `opus`, `haiku`, a full model ID, or `inherit` (default) |
| `permissionMode` | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, or `plan` |
| `maxTurns` | Maximum agentic turns before the subagent stops |
| `skills` | Skills to preload into the subagent's context |
| `mcpServers` | MCP servers available to this subagent |
| `hooks` | Lifecycle hooks scoped to this subagent |
| `memory` | Persistent memory scope: `user`, `project`, or `local` |
| `background` | Set to `true` to always run as a background task |
| `effort` | Effort level: `low`, `medium`, `high`, `max` |
| `isolation` | Set to `worktree` for an isolated git worktree |

## Adding Custom Guidelines to Your Reviewer

To embed specific review guidelines, put them directly in the system prompt (the markdown body). For example, to enforce your team's conventions:

```markdown
---
name: code-reviewer
description: Reviews code against team coding standards. Use after any code change.
tools: Read, Grep, Glob, Bash
model: sonnet
memory: project
---

You are a code reviewer enforcing our team's coding standards.

## Our Guidelines
- All functions must have docstrings
- No magic numbers -- use named constants
- Maximum function length: 50 lines
- All public APIs must have error handling
- Use early returns instead of nested conditionals
- Database queries must use parameterized statements
- No console.log in production code

When reviewing:
1. Run git diff to identify changed files
2. Read each changed file
3. Check against the guidelines above
4. Report violations grouped by file

Format each finding as:
**[SEVERITY]** file:line - description
  - What: what the issue is
  - Why: why it matters
  - Fix: how to fix it

Update your agent memory with patterns and recurring issues you discover.
```

## Using Your Custom Agent

Once created, there are several ways to invoke it:

**Natural language** -- just mention it by name:
```
Use the code-reviewer subagent to review my recent changes
```

**@-mention** -- guarantees the subagent runs:
```
@"code-reviewer (agent)" look at the auth changes
```

**Run the whole session as the agent:**
```bash
claude --agent code-reviewer
```

**Make it the default for a project** by adding to `.claude/settings.json`:
```json
{
  "agent": "code-reviewer"
}
```

## Persistent Memory

Enable persistent memory so your reviewer accumulates knowledge over time:

```yaml
memory: project
```

Memory scopes:
- `user` (`~/.claude/agent-memory/<name>/`) -- learnings across all projects
- `project` (`.claude/agent-memory/<name>/`) -- project-specific, shareable via version control
- `local` (`.claude/agent-memory-local/<name>/`) -- project-specific, not version controlled

Ask the agent to consult and update its memory: "Review this PR, and check your memory for patterns you've seen before. Save what you learn."

## Adding Hooks for Validation

You can add lifecycle hooks to your subagent. For example, to automatically run a linter after any file edits:

```yaml
hooks:
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
```

## Scoping MCP Servers

Give your reviewer access to specific MCP servers:

```yaml
mcpServers:
  - github
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
```

Inline definitions are scoped only to the subagent and do not consume context in the main conversation.

## Managing Subagents

- **List all agents from the CLI:** `claude agents`
- **Interactive management:** `/agents` inside a session
- **Disable a subagent** via `settings.json`:
  ```json
  {
    "permissions": {
      "deny": ["Agent(code-reviewer)"]
    }
  }
  ```
- **Priority order** when names collide: CLI flag > project `.claude/agents/` > user `~/.claude/agents/` > plugin agents
