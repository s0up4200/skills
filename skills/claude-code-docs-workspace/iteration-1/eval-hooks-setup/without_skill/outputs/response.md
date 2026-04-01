# Running ESLint Automatically Before Claude Code Commits

Claude Code supports **hooks** -- custom commands that run automatically at specific points in Claude's workflow. You can use a pre-commit hook to run ESLint before Claude creates any git commit.

## How Claude Code Hooks Work

Hooks are configured in your Claude Code settings file (`.claude/settings.json` at the project level, or `~/.claude/settings.json` globally). They fire on specific events like `PreToolUse`, `PostToolUse`, and `Stop`.

To run ESLint before a commit, you want a **PreToolUse** hook that triggers when Claude is about to use the `Bash` tool with a `git commit` command.

## Setup

Add the following to your project's `.claude/settings.json` (create it if it doesn't exist):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'git commit'; then npx eslint . --max-warnings 0; fi"
          }
        ]
      }
    ]
  }
}
```

## How It Works

1. **`PreToolUse`** -- This event fires before Claude executes any tool call.
2. **`"matcher": "Bash"`** -- This restricts the hook to only fire when Claude is about to run a Bash command.
3. **`CLAUDE_TOOL_INPUT`** -- An environment variable that Claude Code sets containing the JSON input to the tool. For Bash calls, this includes the command string.
4. **The `if` guard** -- The hook checks whether the command contains `git commit`. If it does, ESLint runs. If ESLint fails (non-zero exit code), the hook fails, and Claude's commit is blocked.

## Alternative: Using a Standard Git Pre-Commit Hook

You can also (or instead) use a regular git pre-commit hook, which will block commits from Claude Code just as it blocks manual commits:

```bash
# Create the hooks directory if needed
mkdir -p .git/hooks

# Create the pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "Running ESLint..."
npx eslint . --max-warnings 0
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

Claude Code respects git hooks by default -- it does not use `--no-verify` when committing. So a standard git pre-commit hook will also prevent Claude from committing code that fails ESLint.

## Which Approach to Choose

| Approach | Pros | Cons |
|---|---|---|
| **Claude Code hook** (`settings.json`) | Runs only for Claude, can inspect tool input, provides Claude-specific feedback | Only affects Claude Code sessions |
| **Git pre-commit hook** (`.git/hooks/`) | Applies to all commits (manual and Claude), standard git mechanism | Applies to everyone, not Claude-specific |
| **Both** | Maximum coverage | Slightly redundant |

## Tips

- **Lint only staged files** for faster feedback: replace `npx eslint .` with `npx eslint $(git diff --cached --name-only --diff-filter=d | grep -E '\.(js|ts|jsx|tsx)$')` to only lint files being committed.
- **Use `--max-warnings 0`** to treat warnings as errors, ensuring Claude fixes them before committing.
- For monorepos or projects using a different ESLint config path, adjust the command accordingly.
- If you use a tool like `lint-staged` with `husky`, that works too -- Claude Code will respect those git hooks automatically.
