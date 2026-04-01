# How to Fork a Claude Code Session

You have three ways to fork (branch) your current session so you can try two different approaches while preserving the original conversation.

## Option 1: Use `/branch` During a Session (Easiest)

While inside your active session, run:

```
/branch approach-a
```

This creates a new session that copies your entire conversation history up to that point. The original session stays untouched. You can then continue working in the branched session. To try the second approach, go back to the original session (via `/resume`) and branch again:

```
/branch approach-b
```

Now you have two independent branches from the same starting point, each free to diverge. `/fork` works as an alias for `/branch`.

## Option 2: Use `--fork-session` from the CLI

Exit or open a new terminal, then resume your session with the fork flag:

```bash
claude --continue --fork-session
```

This creates a new session ID while preserving the full conversation history from the continued session. The original session remains unchanged. Run the command twice (in two terminals) to get two independent forks from the same point.

## Option 3: Use `/rewind` to Fork from a Specific Point

If you want to fork from an earlier point in the conversation (not just the current end), press `Esc` twice or run `/rewind`. This opens a scrollable list of your prompts. Select the point you want to branch from, and the rewind menu includes options that effectively create a fork.

## Finding Forked Sessions Later

Forked sessions are grouped together under their root (parent) session in the session picker. To browse them:

- Run `claude --resume` or `/resume` from inside a session
- Use arrow keys to expand grouped sessions
- Press `P` to preview a session before resuming it

## Key Details

- **Conversation history is preserved** in the fork, but **session-scoped permissions are not** -- you will need to re-approve those.
- Forking only branches the conversation. If you also want isolated file changes, combine forking with **git worktrees** (`claude --worktree feature-name`) so each fork operates on its own copy of the codebase.
- The original session is never modified by a fork.
