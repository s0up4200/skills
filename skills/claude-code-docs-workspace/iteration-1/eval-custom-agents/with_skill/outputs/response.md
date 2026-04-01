# Setting Up a Custom Code Reviewer Agent in Claude Code

Claude Code supports **custom subagents** -- specialized AI assistants that run in their own context window with a custom system prompt, specific tool access, and independent permissions. This is exactly what you need to create a code reviewer with specific guidelines.

## Quick Overview

Custom agents (called "subagents") are defined as Markdown files with YAML frontmatter. You place them in specific directories depending on their scope, and Claude automatically delegates tasks to them based on their description.

## Creating a Code Reviewer Agent

### Option 1: Interactive Setup with `/agents`

The easiest way is to use the built-in `/agents` command:

1. Run `/agents` in Claude Code
2. Select **Create new agent**
3. Choose the scope:
   - **Personal** (`~/.claude/agents/`) -- available in all your projects
   - **Project** (`.claude/agents/`) -- specific to the current project, can be version-controlled
4. Either **Generate with Claude** (describe your agent and Claude builds it) or write it manually
5. Select tools -- for a code reviewer, choose **Read-only tools** to prevent modifications
6. Choose a model (e.g., Sonnet for a good balance of speed and capability)
7. Optionally enable **persistent memory** so the reviewer learns patterns over time
8. Save

### Option 2: Write the Agent File Manually

Create a Markdown file in one of these locations:

| Location | Scope |
|---|---|
| `.claude/agents/code-reviewer.md` | Current project only |
| `~/.claude/agents/code-reviewer.md` | All your projects |

Here is a complete example of a code reviewer agent with custom guidelines:

```markdown
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: sonnet
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

### Option 3: Define Inline via CLI (Temporary)

For one-off sessions, pass the agent definition as JSON:

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

This agent exists only for that session and is not saved to disk.

## Agent File Structure

The YAML frontmatter supports these fields:

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Unique identifier (lowercase letters and hyphens) |
| `description` | Yes | When Claude should delegate to this agent |
| `tools` | No | Tools the agent can use (inherits all if omitted) |
| `disallowedTools` | No | Tools to deny from the inherited set |
| `model` | No | `sonnet`, `opus`, `haiku`, a full model ID, or `inherit` (default) |
| `permissionMode` | No | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, or `plan` |
| `maxTurns` | No | Maximum agentic turns before the agent stops |
| `skills` | No | Skills to preload into the agent's context |
| `mcpServers` | No | MCP servers available to this agent |
| `hooks` | No | Lifecycle hooks scoped to this agent |
| `memory` | No | Persistent memory scope: `user`, `project`, or `local` |
| `background` | No | Set to `true` to always run as a background task |
| `effort` | No | Override effort level: `low`, `medium`, `high`, `max` |

The Markdown body (everything after the frontmatter `---`) becomes the agent's **system prompt**.

## Customizing Your Code Reviewer's Guidelines

To encode your specific review guidelines, write them directly in the system prompt (the Markdown body). Here are patterns to consider:

### Restrict to Read-Only

For a reviewer that only reads code and never modifies it:

```yaml
tools: Read, Grep, Glob, Bash
```

This prevents the agent from using Write or Edit tools.

### Add Hooks for Validation

You can add `PreToolUse` hooks to validate commands before they run. For example, to ensure the reviewer only runs safe Bash commands:

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-safe-command.sh"
```

### Enable Persistent Memory

Let your reviewer accumulate knowledge about your codebase over time:

```yaml
memory: project
```

With memory enabled, the agent stores learnings in `.claude/agent-memory/code-reviewer/`. You can instruct it in the system prompt to update its memory with patterns and recurring issues it discovers.

### Preload Skills

If you have skill files with coding conventions or patterns:

```yaml
skills:
  - api-conventions
  - error-handling-patterns
```

## Using Your Code Reviewer

Once created, there are three ways to invoke it:

### 1. Natural Language (Claude Decides)

```
Use the code-reviewer to look at my recent changes
```

### 2. @-Mention (Guaranteed Invocation)

```
@"code-reviewer (agent)" review the auth module changes
```

### 3. Run Entire Session as the Agent

```bash
claude --agent code-reviewer
```

This replaces the default Claude Code system prompt with your agent's prompt for the entire session. To make it the default for a project, add to `.claude/settings.json`:

```json
{
  "agent": "code-reviewer"
}
```

## Tips for Effective Code Review Agents

- **Write a clear `description`** -- Claude uses this to decide when to delegate. Include phrases like "use proactively" if you want Claude to reach for it automatically.
- **Limit tool access** -- A reviewer typically needs only `Read`, `Grep`, `Glob`, and `Bash`. Omit `Write` and `Edit` to enforce read-only behavior.
- **Be specific in the system prompt** -- List your exact review criteria, severity levels, and expected output format.
- **Use persistent memory** (`memory: project`) -- The agent builds institutional knowledge about your codebase patterns over time.
- **Check agent files into version control** -- Put project-scoped agents in `.claude/agents/` so your whole team benefits.
- **Subagents cannot spawn other subagents** -- If you need nested delegation, chain agents from the main conversation or use skills.
