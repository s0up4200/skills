# Setting Up Custom Agents in Claude Code

Custom agents (also called "custom slash commands" or sub-agents) in Claude Code allow you to create specialized personas -- like a code reviewer -- that can be invoked on demand. Here is how to set them up.

## Overview

Claude Code supports custom agents through its configuration system. You can define agents at two levels:

1. **Project-level**: Stored in your project's `.claude/` directory (shared with your team via version control).
2. **User-level**: Stored in your home directory's `~/.claude/` directory (personal, available across all projects).

## Creating a Custom Agent (Slash Command)

Custom agents in Claude Code are defined as **markdown files** inside a `commands/` directory. When you create a file at the right path, it becomes available as a slash command (e.g., `/review`).

### Directory Structure

```
# Project-level (shared with team)
.claude/commands/review.md

# User-level (personal, works everywhere)
~/.claude/commands/review.md
```

### Step-by-Step: Code Reviewer Agent

1. **Create the commands directory** (if it does not already exist):

   ```bash
   mkdir -p .claude/commands
   ```

2. **Create the agent file** `.claude/commands/review.md`:

   ```markdown
   Review the code in this project with the following guidelines:

   ## Review Checklist
   - Check for security vulnerabilities (SQL injection, XSS, hardcoded secrets)
   - Verify error handling is comprehensive and consistent
   - Look for performance issues (N+1 queries, unnecessary re-renders, memory leaks)
   - Ensure naming conventions are clear and consistent
   - Check that functions are focused and not too long (suggest splitting if >50 lines)
   - Verify tests exist for new/changed functionality
   - Look for code duplication that could be extracted
   - Check for proper typing (if TypeScript) or type hints (if Python)

   ## Output Format
   For each issue found, report:
   1. **File and line**: where the issue is
   2. **Severity**: Critical / Warning / Suggestion
   3. **Description**: what the issue is
   4. **Recommendation**: how to fix it

   Summarize with a table of findings grouped by severity at the end.
   ```

3. **Use the agent**: In Claude Code, type:

   ```
   /review
   ```

   Claude Code will pick up the markdown file and use its contents as the system prompt for that interaction.

### Passing Arguments with `$ARGUMENTS`

You can make your commands accept arguments. Use the `$ARGUMENTS` placeholder in your markdown file:

```markdown
# .claude/commands/review-file.md

Review the following file with a focus on code quality, security, and best practices:

$ARGUMENTS

Provide actionable feedback with specific line references.
```

Then invoke it with:

```
/review-file src/auth/login.ts
```

The `$ARGUMENTS` placeholder will be replaced with `src/auth/login.ts`.

## Advanced: Multi-Agent Setup

You can create multiple specialized review agents:

```
.claude/commands/
  review.md            # General code review
  review-security.md   # Security-focused review
  review-perf.md       # Performance-focused review
  review-pr.md         # Pull request review
```

### Example: Security Review Agent

```markdown
# .claude/commands/review-security.md

You are a security-focused code reviewer. Analyze the codebase for:

1. **Authentication & Authorization**: Missing auth checks, privilege escalation
2. **Input Validation**: Unsanitized user input, injection vulnerabilities
3. **Data Exposure**: Leaked secrets, PII in logs, overly permissive APIs
4. **Dependencies**: Known vulnerable packages (check package.json / requirements.txt)
5. **Cryptography**: Weak algorithms, hardcoded keys, improper random generation

Rate each finding: P0 (critical, fix now) / P1 (high, fix before deploy) / P2 (medium) / P3 (low)

If $ARGUMENTS is provided, focus the review on those specific files or directories:
$ARGUMENTS
```

### Example: PR Review Agent

```markdown
# .claude/commands/review-pr.md

Review the current branch's changes compared to main. Run `git diff main...HEAD` to see what changed.

For each changed file, evaluate:
- Does the change make sense given the commit messages?
- Are there any bugs or edge cases missed?
- Is the code well-tested?
- Are there any breaking changes?

Provide a summary verdict: APPROVE, REQUEST_CHANGES, or COMMENT.
```

## Tips for Effective Custom Agents

1. **Be specific in your instructions**: The more precise your markdown prompt, the more consistent the agent's behavior.

2. **Include output format expectations**: Tell the agent exactly how you want results structured (tables, bullet points, severity ratings, etc.).

3. **Reference project conventions**: Point to your project's style guide, linting config, or CLAUDE.md for context the agent should follow.

4. **Combine with CLAUDE.md**: Your project's `CLAUDE.md` (or `.claude/CLAUDE.md`) file is always loaded as context. Put persistent project guidelines there and keep command-specific instructions in the command files.

5. **Use version control**: Commit `.claude/commands/` to your repo so the whole team gets the same review agents.

## Summary

| Aspect | Details |
|---|---|
| **Location (project)** | `.claude/commands/<name>.md` |
| **Location (user)** | `~/.claude/commands/<name>.md` |
| **Invocation** | `/<name>` in Claude Code |
| **Arguments** | Use `$ARGUMENTS` placeholder in the markdown file |
| **Scope** | Project-level commands are shared; user-level are personal |

That is all you need to get started. Create the markdown file, write your review guidelines, and invoke it with the slash command. Claude Code handles the rest.
