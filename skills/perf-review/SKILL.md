---
name: perf-review
description: Review Go and TypeScript code for performance problems — allocations, GC pressure, O(n²) algorithms, N+1 queries, unbounded concurrency, blocked event loops, re-render storms. Works on uncommitted changes, a commit range, a branch, or a full PR. Use when the user says "perf review", "check performance", "find bad allocs", "is this slow", "review allocations", "will this scale", or asks for a performance pass on a diff, branch, or PR. Do not use for general correctness review or style review — this skill only hunts performance.
---

# Performance Review

Review code changes for performance problems and report them. Do not change code. The user decides what to fix.

## Step 1: Pick the scope

Ask git what changed. Pick the first case that matches the request:

| Request | Command |
|---|---|
| "my changes", "uncommitted" | `git diff HEAD` (staged + unstaged) |
| "last commit", a commit hash | `git diff <hash>^ <hash>` |
| a branch or PR | `git diff $(git merge-base main HEAD)...HEAD` |
| a GitHub PR number or URL | `gh pr diff <number>` |
| "this file", "this package" | Read the named files directly |

If the request is ambiguous and there are uncommitted changes, review those. Say what scope you chose.

## Step 2: Read beyond the diff

A diff hides the context that decides whether code is slow. Before you judge a hunk, read the full function it lives in, and find its callers:

- **A loop around the call site changes everything.** One allocation is free. The same allocation inside a loop over a million rows is a GC storm. Grep for callers of each changed function to learn how hot it is.
- **Hot path or cold path?** Request handlers, render functions, loops over datasets, and anything called per row or per frame are hot. Init code, CLI argument parsing, and error paths that fire once are cold. Only flag cold-path code when the problem is algorithmic (a real O(n²) grows into the hot path on its own).
- **Data size matters.** `array.includes` in a loop over 20 items is fine. Over 20,000 it is a quadratic bug. When the size is not visible in the code, say what size makes the finding real.

## Step 3: Apply the language checklist

Read the reference for each language present in the diff, and check every changed hunk against its list:

- Go files → read `references/go.md`
- TypeScript / JavaScript / TSX files → read `references/typescript.md`

## Step 4: Report

Use this exact structure:

```markdown
# Performance review: <scope>

## Findings

### 1. <short title> — `path/file.go:123`
**Severity:** high | medium | low
**Pattern:** <name from the reference, e.g. "append without preallocation">
**Why it is slow:** <one or two sentences, tied to this code's actual call pattern and data size>
**Fix:**
<minimal code snippet of the fix — not applied, just shown>

## Not flagged
<one line per pattern you saw but deliberately left alone, with the reason — e.g. "string concat in cmd/init.go: runs once at startup">

## Verify
<the one or two commands that would confirm the top findings — see below>
```

Severity rules:

- **high** — hot path, measurable at current scale: quadratic algorithm over real data, N+1 query, per-request allocation storm, blocked event loop, unbounded goroutines or promises.
- **medium** — hot path but small constant factor, or a cold-path algorithmic problem that grows with data.
- **low** — real but minor; mention only when the fix is one line.

Cite line numbers from `grep -n` output, diff hunk headers, or a numbered read — never from memory. One wrong line number costs the whole review its credibility.

Order findings by severity. If there are no findings, say so plainly — no low-severity filler to look thorough.

## Step 5: Point at verification, not guesses

Every high finding gets a way to confirm it — take the command from the Verification section of the language reference. Do not run benchmarks yourself unless asked; give the command.

If you are not sure a finding is real, keep it, mark the severity honestly, and say what measurement decides it. A review that only reports certainties misses the expensive bugs; a review that states guesses as facts wastes the reader's day. Label which is which.
