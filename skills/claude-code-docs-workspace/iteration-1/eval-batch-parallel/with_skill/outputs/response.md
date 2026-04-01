# Fanning Out a Migration Across 200 Files in Parallel

Yes, Claude Code has several ways to parallelize work across many files. The right approach depends on how much coordination the migration needs.

## Option 1: Fan out with `claude -p` in a shell loop (recommended for migrations)

This is the officially recommended pattern for large batch migrations. You run many independent `claude -p` invocations in parallel, each handling one file.

### Step-by-step

1. **Generate a file list.** Ask Claude to identify all files that need migrating and write them to a text file:

   ```
   list all files that need the X migration and write them to files.txt
   ```

2. **Test on a few files first.** Run your migration prompt against 2-3 files to refine the prompt before scaling up:

   ```bash
   claude -p "Migrate src/components/Button.tsx from [old pattern] to [new pattern]. Return OK or FAIL." \
     --allowedTools "Read,Edit"
   ```

3. **Run the full batch in parallel.** Use `xargs -P` or GNU `parallel` to fan out:

   ```bash
   # Using xargs with 10 parallel workers
   cat files.txt | xargs -P 10 -I {} \
     claude -p "Migrate {} from [old pattern] to [new pattern]. Return OK or FAIL." \
       --allowedTools "Read,Edit"

   # Or using GNU parallel
   parallel -j 10 \
     claude -p "Migrate {} from [old pattern] to [new pattern]. Return OK or FAIL." \
       --allowedTools "Read,Edit" \
     :::: files.txt
   ```

4. **Scope permissions tightly.** Since these run unattended, use `--allowedTools` to restrict what Claude can do. For a migration that only needs to read and edit files:

   ```bash
   --allowedTools "Read,Edit"
   ```

   If the migration also needs to commit each file:

   ```bash
   --allowedTools "Read,Edit,Bash(git commit *)"
   ```

### Tips for the `claude -p` approach

- Add `--bare` to skip loading hooks, plugins, MCP servers, and CLAUDE.md. This reduces startup time and ensures consistent behavior across all invocations. You will need to set `ANTHROPIC_API_KEY` in your environment since bare mode skips keychain reads.
- Use `--output-format json` to get structured results you can parse programmatically.
- Use `--append-system-prompt` to inject migration-specific instructions without a CLAUDE.md file.
- Pipe results into a log file or processing script: `claude -p "..." --output-format json | your_command`
- Use `--verbose` during testing, then turn it off for the full run.

## Option 2: Subagents (within a single session)

If you are already in an interactive Claude Code session, you can ask Claude to use subagents to parallelize the work. Subagents run in their own context windows and report results back to the main session.

```
Use subagents to migrate each file in src/components/ from the old API to the new API.
Process them in parallel batches.
```

Subagents are good when you want Claude to manage the orchestration for you and you are already in a session. However, for 200 files, the `claude -p` loop approach gives you more control over parallelism, error handling, and retries.

## Option 3: Agent teams (experimental)

Agent teams coordinate multiple full Claude Code sessions that can communicate with each other. This is overkill for a straightforward file-by-file migration since agent teams add coordination overhead and use significantly more tokens. They are best suited for tasks where agents need to discuss findings, challenge each other, or coordinate across interdependent changes.

Agent teams are experimental and must be enabled via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in your settings.

## Recommendation

For a 200-file migration where each file gets the same transformation applied independently, **use `claude -p` in a parallel shell loop** (Option 1). It gives you:

- Direct control over concurrency (`-P 10`, `-P 20`, etc.)
- Easy retry logic for failures (just re-run failed files)
- Tight permission scoping with `--allowedTools`
- Structured output for tracking results
- No coordination overhead between agents

The key insight is that each file migration is independent, so you do not need inter-agent communication -- you just need many parallel, isolated invocations of Claude.
