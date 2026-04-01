# Running ESLint Automatically Before Claude Commits Code

Claude Code hooks let you run shell commands at specific points in Claude's lifecycle. To run ESLint before every commit, you have two good options depending on how strict you want to be.

## Option 1: Block `git commit` Until ESLint Passes (PreToolUse Hook)

Use a `PreToolUse` hook on the `Bash` tool with an `if` condition that matches `git commit` commands. This intercepts the commit *before* it runs and blocks it if ESLint fails.

Add this to your project's `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git commit*)",
            "command": "npx eslint . --max-warnings=0 >&2 || { echo 'ESLint failed. Fix lint errors before committing.' >&2; exit 2; }",
            "timeout": 120,
            "statusMessage": "Running ESLint before commit..."
          }
        ]
      }
    ]
  }
}
```

**How it works:**

- The `matcher: "Bash"` narrows this hook to Bash tool calls only.
- The `if: "Bash(git commit*)"` condition further narrows it so the hook only fires when Claude runs a command starting with `git commit`. This avoids running ESLint on every single shell command.
- If ESLint finds errors, the script exits with code 2, which tells Claude Code to **block the tool call**. Claude sees the error message and can fix the lint issues before retrying.
- If ESLint passes (exit 0), the commit proceeds normally.

## Option 2: Use a Hook Script for More Control

For more complex logic (e.g., only linting staged files, or running ESLint with specific config), create a script and reference it from the hook.

### 1. Create the hook script

Save this as `.claude/hooks/pre-commit-lint.sh` in your project:

```bash
#!/bin/bash
# .claude/hooks/pre-commit-lint.sh
# Runs ESLint on staged JS/TS files before allowing a commit

# Get the list of staged files (Claude may have staged files before committing)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx)$')

if [ -z "$STAGED_FILES" ]; then
  exit 0  # No JS/TS files staged, allow the commit
fi

# Run ESLint on staged files only
echo "$STAGED_FILES" | xargs npx eslint --max-warnings=0 2>&1

if [ $? -ne 0 ]; then
  echo "ESLint found errors in staged files. Fix them before committing." >&2
  exit 2  # Block the commit
fi

exit 0  # ESLint passed, allow the commit
```

Make it executable:

```bash
chmod +x .claude/hooks/pre-commit-lint.sh
```

### 2. Add the hook to settings

In `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git commit*)",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/pre-commit-lint.sh",
            "timeout": 120,
            "statusMessage": "Running ESLint on staged files..."
          }
        ]
      }
    ]
  }
}
```

The `$CLAUDE_PROJECT_DIR` variable ensures the script is found regardless of the current working directory when the hook runs.

## Where to Put the Hook

| Location | Scope | Shareable |
|---|---|---|
| `~/.claude/settings.json` | All your projects | No (local to your machine) |
| `.claude/settings.json` | This project only | Yes (commit it to the repo) |
| `.claude/settings.local.json` | This project only | No (gitignored) |

For a project-specific lint rule, `.claude/settings.json` is the best choice since you can commit it so the whole team gets the same behavior. If you already have other hooks defined in that file, merge the `PreToolUse` entry into the existing `hooks` object rather than replacing it.

## Verifying Your Hook

After adding the configuration:

1. Type `/hooks` in Claude Code to open the hooks browser.
2. Select `PreToolUse` -- you should see your new hook listed with its matcher and command.
3. Ask Claude to make a change and commit it. You should see the "Running ESLint..." status message, and if there are lint errors, the commit will be blocked with feedback to Claude.

## Key Details

- **Exit code 2** is what blocks the action. Any other non-zero exit code is treated as a non-blocking error and the commit would still proceed.
- **stderr** is what Claude sees as the error message when a hook blocks. Direct your error output to stderr (`>&2`).
- **The `if` field** uses permission rule syntax. `Bash(git commit*)` matches any Bash command starting with `git commit`, including `git commit -m "..."`, `git commit --amend`, etc.
- **Timeout** defaults to 600 seconds for command hooks, but setting a shorter timeout (like 120s) prevents ESLint from hanging indefinitely on large codebases.
