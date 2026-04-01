# Forking a Claude Code Session

Claude Code does not have a built-in "fork session" command, but there are practical ways to achieve the same effect -- running two different approaches from the same starting point.

## Option 1: Use Multiple Terminal Windows (Simplest)

1. Open a second terminal tab or window.
2. Navigate to the same project directory.
3. Run `claude` in each terminal.
4. In each session, describe the approach you want to try.

Since each `claude` invocation starts a fresh, independent session, you effectively have two parallel explorations. The downside is that neither session has the prior conversation context.

## Option 2: Use `--resume` and `--continue` with Separate Sessions

Claude Code persists conversation history. You can:

1. Note your current session ID (visible in the session or via `claude sessions list`).
2. Open a new terminal and run `claude --resume` to pick a prior session, or `claude --continue` to continue the most recent one.
3. In the original terminal, keep going with approach A.
4. In the new terminal, once resumed/continued, pivot to approach B.

**Important caveat:** Both sessions share the same underlying conversation history up to the fork point. After that, they diverge independently since each terminal runs its own instance.

## Option 3: Use Git Worktrees for Code Isolation

If your two approaches will modify files differently, combine session forking with git worktrees so each approach has its own working directory:

```bash
# Create a worktree for approach B
git worktree add ../my-project-approach-b -b approach-b

# Terminal 1: stay in the original directory, work on approach A
claude

# Terminal 2: cd into the worktree, work on approach B
cd ../my-project-approach-b
claude
```

This gives you full file-level isolation -- each Claude session modifies a separate copy of the codebase on a separate branch.

## Option 4: Use `--print` for Quick One-Shot Comparisons

If the fork is about getting two different answers (not two different coding sessions), you can run:

```bash
# Approach A
claude --print "Implement feature X using approach A: ..."

# Approach B
claude --print "Implement feature X using approach B: ..."
```

Each `--print` invocation is stateless and independent.

## Summary

| Method | Context Preserved | File Isolation | Best For |
|---|---|---|---|
| Two terminals | No (fresh sessions) | No (same dir) | Quick exploration |
| `--continue` / `--resume` | Yes (shared history) | No (same dir) | Branching a conversation |
| Git worktrees | No (fresh sessions) | Yes (separate dirs) | Divergent code changes |
| `--print` | No | No | One-shot comparisons |

The most common workflow is to open two terminals in the same directory (or use git worktrees if you need file isolation) and run separate `claude` sessions in each. There is no single command that clones an active session into two live forks.
