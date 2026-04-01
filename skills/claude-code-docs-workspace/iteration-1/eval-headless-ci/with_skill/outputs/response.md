# Running Claude Code in CI for Automated PR Reviews

## Non-Interactive Mode: The `-p` Flag

The primary CLI flag for non-interactive (headless) mode is **`-p`** (or `--print`). This runs Claude Code without an interactive session -- it processes the prompt and exits.

```bash
claude -p "Review this PR for bugs and security issues"
```

### Key CLI Flags for CI Usage

| Flag | Purpose |
|---|---|
| `-p` / `--print` | Run non-interactively (required for CI) |
| `--bare` | Skip auto-discovery of hooks, skills, plugins, MCP servers, CLAUDE.md. Faster startup and reproducible across machines. Recommended for CI. |
| `--allowedTools` | Auto-approve specific tools without permission prompts (e.g., `"Read,Bash(git diff *)"`) |
| `--dangerously-skip-permissions` | Skip all permission prompts (use with caution) |
| `--max-turns` | Limit agentic turns to prevent runaway usage (print mode only) |
| `--max-budget-usd` | Cap API spend per invocation (print mode only) |
| `--output-format` | Control output: `text` (default), `json` (structured with metadata), `stream-json` (streaming) |
| `--json-schema` | Get validated structured JSON output matching a schema |
| `--model` | Select a specific model (e.g., `claude-sonnet-4-6`, `claude-opus-4-6`) |
| `--append-system-prompt` | Add custom instructions while keeping default behavior |
| `--system-prompt` | Replace the entire system prompt |
| `--continue` / `--resume` | Continue a previous conversation |
| `--fallback-model` | Auto-fallback to another model if the primary is overloaded |
| `--no-session-persistence` | Don't save sessions to disk (print mode only) |

### Example: PR Review in a Script

```bash
gh pr diff "$PR_NUMBER" | claude -p \
  --bare \
  --append-system-prompt "You are a security engineer. Review for vulnerabilities." \
  --allowedTools "Read" \
  --max-turns 5 \
  --output-format json
```

---

## Authentication in CI

There are three authentication methods depending on your provider.

### Option 1: Anthropic API Key (Direct)

Set the `ANTHROPIC_API_KEY` environment variable. This is the simplest approach.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
claude -p "Review this code"
```

In GitHub Actions, store the key as a repository secret:

```yaml
steps:
  - uses: anthropics/claude-code-action@v1
    with:
      anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
      prompt: "Review this pull request for code quality and security."
```

> **Note:** When using `--bare` mode, Anthropic authentication must come from the `ANTHROPIC_API_KEY` environment variable or an `apiKeyHelper` in the JSON passed to `--settings`. Bare mode skips OAuth and keychain reads.

### Option 2: AWS Bedrock

Use OIDC federation (no static credentials needed):

```yaml
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
      aws-region: us-west-2

  - uses: anthropics/claude-code-action@v1
    with:
      use_bedrock: "true"
      claude_args: '--model us.anthropic.claude-sonnet-4-6'
```

Required environment variables for Bedrock (when not using the GitHub Action):
- Standard AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`) or an IAM role
- `AWS_REGION`

### Option 3: Google Vertex AI

Use Workload Identity Federation:

```yaml
steps:
  - uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
      service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

  - uses: anthropics/claude-code-action@v1
    with:
      use_vertex: "true"
      claude_args: '--model claude-sonnet-4@20250514'
    env:
      ANTHROPIC_VERTEX_PROJECT_ID: ${{ steps.auth.outputs.project_id }}
      CLOUD_ML_REGION: us-east5
```

---

## GitHub Actions: Complete PR Review Workflow

The official **`anthropics/claude-code-action@v1`** GitHub Action wraps all of this into a ready-to-use action.

### Automatic Review on Every PR

```yaml
name: Code Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review this pull request for code quality, correctness, and security. Analyze the diff, then post your findings as review comments."
          claude_args: "--max-turns 5"
```

### Respond to `@claude` Mentions in PR Comments

```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Quick Setup

The fastest way to set up the GitHub Action is to run `/install-github-app` inside an interactive Claude Code session. It walks you through installing the Claude GitHub App and configuring repository secrets.

For manual setup:
1. Install the Claude GitHub App: https://github.com/apps/claude
2. Add `ANTHROPIC_API_KEY` as a repository secret
3. Copy the workflow YAML into `.github/workflows/`

---

## Using the Raw CLI in Any CI System (Not Just GitHub)

If you are not using GitHub Actions (e.g., GitLab CI, Jenkins, CircleCI), you can install and run Claude Code directly:

```bash
# Install Claude Code
curl -fsSL https://claude.ai/install.sh | bash

# Run a review
export ANTHROPIC_API_KEY="$YOUR_SECRET"
claude --bare -p "Review the changes in this merge request" \
  --allowedTools "Read,Bash(git diff *),Bash(git log *)" \
  --max-turns 5 \
  --output-format json
```

### GitLab CI/CD

Claude Code also has dedicated GitLab CI/CD support. Key differences:
- Use `CI_JOB_TOKEN` by default, or create a Project Access Token with `api` scope
- Store as `GITLAB_ACCESS_TOKEN` (masked) if using a PAT

---

## Tips for CI Usage

- **Use `--bare` for reproducibility.** It skips local config (hooks, plugins, MCP, CLAUDE.md) so the same command behaves identically on every runner.
- **Set `--max-turns` and `--max-budget-usd`** to prevent runaway API costs.
- **Use `--output-format json`** to parse results programmatically (pipe through `jq`).
- **Use `--allowedTools`** to pre-approve only the tools Claude needs (e.g., `Read`, `Bash(git diff *)`) so it never blocks waiting for permission.
- **Add a `CLAUDE.md`** to your repo root with project-specific review guidelines -- Claude reads it automatically (unless `--bare` is used, in which case pass instructions via `--append-system-prompt` or `--append-system-prompt-file`).
