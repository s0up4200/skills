---
name: data-review
effort: high
description: Review a diff for data bugs in writes to a shared store, calls to other systems, sync loops and caches, stored formats, and deletes. Use when the user says "data review", asks "is this safe under concurrent writes" or "what if the call fails halfway", or when a diff touches SQL or another store, an HTTP or API client, a fetch or mutation in a web app, a background loop or goroutine, a cache, a stored or wire format, or a delete of files or rows. Do not use for the speed of a query or a loop, which is perf-review, or for style, which is code-review.
---

# Data Review

Review a diff for bugs that lose, corrupt, or misreport data, and report them. Do not change code. The caller decides what to fix.

The rules come from _Designing Data-Intensive Applications_, 2nd edition (Kleppmann and Riccomini), and _Domain-Driven Design_ (Evans). These bugs pass the tests: the tests run one writer, a network that answers, and data that the new code wrote. Each finding names the second writer, the failed call, or the old data that breaks the change.

## Step 1: Pick the scope

Take the fixed point that the caller passes. With none, use the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` (for example `origin/develop`). When `origin/HEAD` is not set, the command exits 128: read the default branch from the remote with `git ls-remote --symref origin HEAD`, and only when that fails, use the first of `origin/main`, `origin/master`, and `origin/develop` that `git rev-parse --verify --quiet <ref>` finds. With none of these, ask. A local `main` can be far behind, or missing. If `origin` is a fork, use the remote of the parent repository in place of `origin`, as `code-review` does. Fetch the default branch before the diff, also as `code-review` does, because a remote-tracking branch can be old.

| Work | Command |
|---|---|
| committed | `git diff <fixed-point>...HEAD` |
| no commits yet | `git diff HEAD` |
| commits and uncommitted changes | `git diff $(git merge-base <fixed-point> HEAD)` |
| one commit | `git diff <hash>^ <hash>` |
| a GitHub PR number or URL | `gh pr diff -R "$(git remote get-url <remote>)" <number>`, where `<remote>` is the remote of the repository that holds the PR (the parent in a fork) |
| named files | read them in full |

When the scope includes uncommitted work, `git diff` leaves out untracked files. List them with `git status --short --untracked-files=all`, and read each new file in full. A new file that holds a sync loop is the main target. For a GitHub PR, read the code at its head, not the current working tree: `git fetch <remote> pull/<number>/head` from the same `<remote>`, then `git worktree add --detach <scratch dir> FETCH_HEAD`, and run the later steps there. Remove the worktree after the report. Say what scope you chose.

## Step 2: Map the data

A diff shows one writer, one call, and new data. The bugs come from what it does not show. For each table, key, file, or remote object that the diff writes, reads back, or deletes, list:

- **Writers**: each code path that writes it. Grep for each write to the same table, key, or path: request handlers, background loops, automations, scans, imports, restores, the CLI.
- **Remote calls**: each call to another system on the path, and what the code does with its status, its body, and a timeout.
- **Old data and old readers**: rows, files, and backups from earlier releases, a web app bundle that a service worker still serves, and the previous release after a rollback.

The step is done when each thing that the diff writes or deletes has its writer list.

## Step 3: Apply the rules

Read each reference whose branch the diff touches, and apply each of its rules to each hunk in that branch:

- A write to a database, a key-value store, or a file that the app owns, and a write that changes state on a remote system (an add, a delete, a settings change) → `references/writes.md`
- A call to another system, and the retries, fan-outs, queues, and worker loops around it → `references/calls.md`
- A sync loop, poller, cache, memo, or copied value, and each delete of files or rows that a scan or a list decides → `references/copies.md`
- A stored or wire format: tagged structs, migrations, JSON columns, config and state files, stored enums, response fields → `references/formats.md`

Most diffs touch more than one branch: a sync loop calls a remote system, writes a store, and deletes rows. The step is done when each rule of each file that you read has been applied to each hunk in its branch.

A rule marked **Against APOSD** carries its agreement with _A Philosophy of Software Design_. A fix that breaks that agreement (a `*sql.Tx` passed through layers, a caching decorator, a setting for a threshold, a retry that hides an unknown outcome) is not the fix to propose.

## Step 4: Report

Use the repo-wide report layout: the first line names the repo and the scope, the status comes next, then one short list for each section, and the last line says what the user can reply. Put one fact in each list item:

```markdown
**<repo> · <scope>** · <n> findings, worst: <rule name> (<severity>)
**Status:** one of: high findings, findings with no high one, or no findings.

**Findings**
1. **<severity>** · <rule name>: <short title> · `path/file.go:123`
   - Scenario: <the steps, with concrete values, that end in the wrong state: two writers in order, the call that times out after the remote applied it, the old row and the value that it reads as>
   - Fix: <the change, in a few lines or a minimal snippet, not applied>
   - Proof: <the test that goes red on the bug, see step 5>

**Not flagged**
- <one risk that you saw and left alone, with the reason: "lost update on settings: one writer, the settings handler, and the loop only reads">

**Reply with** the numbers to fix, or **all**.
```

Severity:

- **high**: data is lost or corrupted, the remote system does the wrong thing (a duplicate add, a delete of the wrong file), or the user is told that a change saved when it did not. It happens at today's scale and timing.
- **medium**: a wrong value that the next sync or a refresh corrects, or a high case that needs a rare timing.
- **low**: a missing guard on a path that has one writer today.

Cite line numbers from `grep -n` output, diff hunk headers, or a numbered read, never from memory. Order findings by severity. With no findings, say so: list what you checked under Not flagged, and add no low findings to look thorough.

## Step 5: Prove each high finding

Give each high finding a test that goes red on the bug, as the rule's text describes it. For a race on a database, that is at least 8 callers at once, released together, on each database that the repo supports. `-race` does not see a database race. For a remote call, it is a fake that fails the way the real system fails: a timeout after it applied the change, an error body with status 200, an empty list during a restart. For a format, it is a fixture captured from the previous release. Give the test; do not write or run it unless asked.

If you are not sure that a finding is real, keep it, mark the severity honestly, and say which test or reading decides it.
