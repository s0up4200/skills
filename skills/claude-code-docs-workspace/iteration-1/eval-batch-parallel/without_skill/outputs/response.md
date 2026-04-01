# Fanning Out Work to Multiple Agents in Parallel with Claude Code

Yes, Claude Code supports parallel agent execution for exactly this kind of scenario. Here are the main approaches:

## 1. Subagent Tool (Built-in Parallel Agents)

Claude Code has a built-in **Agent tool** (also called subagents) that lets you spawn multiple independent Claude agents that run in parallel. You can use this directly in a conversation:

- Ask Claude to "run this migration on all 200 files in parallel using subagents"
- Claude will batch the files and dispatch multiple agents, each handling a subset
- Each subagent runs independently with its own context and tools
- Results are collected and reported back to you

The key constraint is that each subagent operates independently -- they cannot share state or coordinate with each other. This makes them perfect for applying the same transformation to many files.

## 2. Bash-Level Parallelism

You can also ask Claude to generate a script that uses `xargs -P` or GNU `parallel` to invoke `claude` CLI in headless mode across your files:

```bash
# Example: run claude in headless mode on each file
find src/ -name "*.ts" | xargs -P 8 -I {} claude --print "Apply migration X to {}"
```

Or with the `--dangerously-skip-permissions` flag for fully automated runs:

```bash
find . -name "*.ts" | parallel -j 10 claude -p "Apply this migration to {}: <description>" --dangerously-skip-permissions
```

## 3. Claude Code SDK (Programmatic Approach)

If you want more control, you can use the Claude Code SDK programmatically:

```typescript
import { claude } from "@anthropic-ai/claude-code";

const files = getFilesToMigrate(); // your 200 files
const CONCURRENCY = 10;

// Process in batches
for (let i = 0; i < files.length; i += CONCURRENCY) {
  const batch = files.slice(i, i + CONCURRENCY);
  await Promise.all(
    batch.map(file =>
      claude(`Apply the following migration to ${file}: <your migration description>`, {
        cwd: process.cwd(),
      })
    )
  );
}
```

## 4. Interactive: Ask Claude to Dispatch Agents

In a Claude Code session, you can simply describe what you want:

> "I need to apply this migration to all 200 .ts files in src/. Fan out to parallel agents -- each agent should apply <describe migration> to each file."

Claude will use its Agent tool to dispatch parallel subagents, each handling one or more files.

## Practical Tips

- **Batch size**: Don't send all 200 at once. Group into batches of 5-10 concurrent agents to avoid rate limits and keep things manageable.
- **Idempotency**: Make sure the migration is safe to retry. If an agent fails on a file, you want to be able to re-run it without corrupting already-migrated files.
- **Dry run first**: Test the migration on 2-3 files first to verify correctness before fanning out to all 200.
- **Describe the migration precisely**: Each agent gets its own context, so the migration instructions need to be self-contained. Include before/after examples if possible.
- **Use `--print` or `-p` flag**: For non-interactive batch processing, the `--print` flag (or `-p`) runs Claude in single-shot mode and prints the result without interactive prompts.
- **Rate limits**: If you're on a usage-based plan, be mindful that parallel agents each consume tokens independently. 200 files with 10 concurrent agents will hit the API heavily.

## Recommended Approach for 200 Files

For a migration across 200 files, the most practical approach is:

1. Write a clear, specific prompt describing the migration with before/after examples
2. Test it on 3-5 files interactively to validate correctness
3. Use the bash-level parallelism approach with `claude -p` to process all files in batches of 8-10 concurrent processes
4. Review the git diff afterward to verify the migration was applied correctly across all files

This gives you the best balance of speed, reliability, and ability to review results.
