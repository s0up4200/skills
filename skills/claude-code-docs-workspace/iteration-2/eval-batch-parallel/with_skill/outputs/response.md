# Fanning Out Migrations Across Multiple Agents in Parallel

Yes, Claude Code has several ways to parallelize work across files. For a 200-file migration, the best approach depends on how much coordination the files need.

## Option 1: Fan out with `claude -p` in a shell loop (recommended for migrations)

This is the officially recommended pattern for large, file-by-file migrations. You write a shell script that loops over your file list and invokes `claude -p` (non-interactive mode) once per file, running many invocations in parallel:

```bash
# Step 1: Generate the list of files to migrate
claude -p "List all files that need the X-to-Y migration" --output-format json \
  | jq -r '.result' > files.txt

# Step 2: Fan out with parallel invocations
for file in $(cat files.txt); do
  claude -p "Migrate $file from X to Y. Return OK or FAIL." \
    --allowedTools "Edit,Read,Bash(git diff *),Bash(git commit *)" &
done
wait
```

Key tips for this approach:

- **Test on 2-3 files first.** Refine your prompt based on what goes wrong, then run on the full set.
- **Use `--allowedTools` to scope permissions.** Since these run unattended, restrict what Claude can do. The flag uses permission rule syntax with prefix matching (e.g., `Bash(git commit *)` allows any command starting with `git commit`).
- **Use `--permission-mode auto`** for uninterrupted execution with a safety classifier that blocks scope escalation.
- **Use `--bare`** to skip loading hooks, plugins, MCP servers, and CLAUDE.md, which speeds up startup and gives consistent results across machines.
- **Control concurrency** with tools like `xargs -P` or GNU `parallel` instead of bare `&`:

```bash
cat files.txt | xargs -P 10 -I {} \
  claude -p "Migrate {} from framework X to framework Y. Return OK or FAIL." \
    --allowedTools "Edit,Read" \
    --permission-mode auto
```

This scales well to hundreds of files because each invocation is independent, has its own context window, and only touches one file.

## Option 2: Agent teams (for coordinated parallel work)

If your migration requires coordination between files -- for example, files depend on shared types that also need updating, or you want agents to discuss edge cases with each other -- agent teams are a better fit.

Agent teams let multiple Claude Code instances work in parallel with a shared task list and inter-agent messaging. One session acts as the team lead, coordinating work and synthesizing results.

To enable (they are experimental and off by default):

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Then in an interactive session:

```
I have 200 files that need migrating from X to Y. Create an agent team
with 4 teammates. Split the files evenly and have each teammate handle
their batch. Use git worktrees so they don't conflict.
```

Agent teams add coordination overhead and use significantly more tokens than Option 1, so they are best when teammates genuinely need to communicate. For independent file-by-file migrations, the shell loop approach is more cost-effective.

## Option 3: Subagents within a single session

If you want to stay in one interactive session, you can ask Claude to use subagents to process files in parallel:

```
Use subagents to migrate these 200 files from X to Y. Process them in parallel batches.
```

Subagents run in their own context windows and report results back to the main session. This keeps your main context clean but is limited to what one session can coordinate. For 200 files, the shell loop (Option 1) will generally be faster and more reliable.

## Comparison

| Approach | Best for | Coordination | Token cost | Setup |
|---|---|---|---|---|
| `claude -p` loop | Independent file-by-file work | None (each invocation is isolated) | Lowest per file | Shell script |
| Agent teams | Work requiring inter-agent discussion | Shared task list + messaging | Highest | Enable experimental flag |
| Subagents | Small parallel batches within a session | Results report back to main agent | Medium | None (built-in) |

## Recommendation

For 200 files needing the same migration applied independently, **use the `claude -p` shell loop** (Option 1). It is the most efficient, easiest to debug (you can inspect each file's result), and scales linearly. Start with a small test batch, refine your prompt, then run the full set with `xargs -P` or GNU `parallel` to control concurrency.
