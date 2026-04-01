# Forking a Claude Code Session

You can fork your current session using the `--fork-session` flag combined with `--continue` or `--resume`. This creates a new session that starts with a copy of your full conversation history up to that point, while leaving the original session untouched. Each fork gets its own session ID, so changes in one do not affect the other.

## How to fork

From a separate terminal, run:

```bash
# Fork the most recent session in the current directory
claude --continue --fork-session

# Or fork a specific session by name or ID
claude --resume my-session --fork-session
```

This gives you a second session that shares the same conversation history as the original up to the point of forking. You can then take each session in a different direction to try two different approaches.

## Step-by-step for trying two approaches

1. In your current Claude Code session, get to the point where you want to branch off (for example, after discussing the problem and before starting implementation).
2. Open a second terminal window.
3. Run `claude --continue --fork-session` to create the fork. You now have the full conversation context in this new session.
4. Go back to your original terminal and continue with approach A.
5. In the second terminal, tell Claude to try approach B.

Both sessions run independently from that point forward. The original session is unaffected by whatever happens in the fork.

## Key details

- **Conversation history is preserved.** The forked session contains everything from the original session up to the fork point.
- **Session-scoped permissions are not inherited.** You will need to re-approve any session-scoped permissions (like allowing specific shell commands) in the forked session, just as you would when resuming.
- **Each fork gets a new session ID.** The original session ID remains unchanged, so you can continue or resume either session later.
- **For true parallel execution**, consider combining forking with [git worktrees](https://code.claude.com/docs/en/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees) (`claude -w branch-name`) so each session also works in its own isolated copy of the codebase. Without worktrees, both sessions share the same files on disk, which means file edits from one session will be visible to the other.
