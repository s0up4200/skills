# Running Claude Code in CI for Automated PR Reviews

## Non-Interactive Mode

Claude Code provides a **`--print` (`-p`)** flag that runs it in non-interactive (headless) mode. In this mode, Claude processes a single prompt, outputs the result to stdout, and exits without waiting for user input. This is the primary flag you need for CI pipelines.

```bash
claude -p "Review this PR for bugs, security issues, and code quality"
```

### Key CLI Flags for CI

| Flag | Description |
|------|-------------|
| `--print` / `-p` | Non-interactive mode. Sends prompt, prints response, exits. |
| `--output-format json` | Returns structured JSON output instead of plain text (useful for parsing results programmatically). |
| `--model <model>` | Specify which Claude model to use (e.g., `claude-sonnet-4-20250514`). |
| `--max-turns <n>` | Limit the number of agentic turns Claude can take. |
| `--allowedTools <tools>` | Restrict which tools Claude can use (comma-separated). |
| `--disallowedTools <tools>` | Block specific tools from being used. |
| `--verbose` | Enable verbose output for debugging CI issues. |

### Piping Context

You can pipe diff content directly into Claude Code:

```bash
gh pr diff $PR_NUMBER | claude -p "Review the following PR diff for bugs, security issues, and style problems. Be concise."
```

Or combine it with file reading:

```bash
claude -p "Review the changes in this PR" --allowedTools "Read,Bash(git diff)"
```

## Authentication

Claude Code in CI requires an **API key** rather than the interactive OAuth login used in local development. There are two authentication approaches:

### Option 1: Anthropic API Key (Direct)

Set the `ANTHROPIC_API_KEY` environment variable:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

In your CI configuration (e.g., GitHub Actions):

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Option 2: Amazon Bedrock

If you use Claude via AWS Bedrock:

```bash
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
```

### Option 3: Google Vertex AI

If you use Claude via Google Vertex:

```bash
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION="us-east5"
export ANTHROPIC_VERTEX_PROJECT_ID="your-project-id"
```

## Example: GitHub Actions Workflow

```yaml
name: Claude PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Review PR
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # Get the diff between the PR branch and base
          DIFF=$(git diff origin/${{ github.base_ref }}...HEAD)

          # Run Claude in non-interactive mode
          REVIEW=$(echo "$DIFF" | claude -p \
            "You are a code reviewer. Review this diff for:
            1. Bugs and logic errors
            2. Security vulnerabilities
            3. Performance issues
            4. Code style and best practices

            Be concise and actionable. Format as markdown." \
            --output-format text)

          # Post review as PR comment using gh CLI
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "$REVIEW"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Important CI Considerations

1. **Tool permissions**: In CI, you likely want to restrict tool access. Use `--allowedTools` to limit Claude to read-only operations (e.g., `Read`, `Grep`, `Glob`) and prevent it from modifying files or running arbitrary bash commands.

2. **Cost control**: Use `--max-turns` to cap how many agentic loops Claude can perform, preventing runaway usage.

3. **Disable telemetry**: Set `CLAUDE_CODE_DISABLE_TELEMETRY=1` if you do not want telemetry sent from CI.

4. **Accept terms of service non-interactively**: In CI you may also want to set `CLAUDE_CODE_ACCEPT_TOS=1` to skip the interactive terms-of-service prompt on first run.

5. **Timeouts**: CI environments should set reasonable timeouts since agentic loops can take time.

6. **`--dangerously-skip-permissions`**: In trusted CI environments, you can skip the permission prompts that would otherwise block non-interactive execution. Only use this in sandboxed CI runners you control.

## Structured Output for CI Parsing

For programmatic consumption of results:

```bash
RESULT=$(claude -p "Review this code" --output-format json)
echo "$RESULT" | jq '.result'
```

This returns JSON with the response content, which you can parse with `jq` or similar tools for downstream CI logic (e.g., failing a build if critical issues are found).
