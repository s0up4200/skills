---
name: implement-spec
description: "Implement the result of /to-spec and /to-tickets in code."
disable-model-invocation: true
---

You have been provided a spec. This spec should have tickets associated with it, describing how to implement the spec.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is the entire spec implemented on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Start every subagent with a fresh context window.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Implementer subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the spec and tickets to understand the task graph.

2. (optional) Use an **exploration subagent** to conduct any exploration required by the tickets - relevant codebase files or external documentation. Ensure the exploration subagent can save files - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Create the integration branch. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 5 (a branch with no commits ahead of main can't open one), marked as closing the spec and tickets.

4. Use a fresh **implementer subagent** for each ticket, each in its own worktree on its own branch. Each implementer subagent:
   - confirms its worktree is based on the integration branch before starting, and resets onto it if not;
   - calls the Skill tool with `tdd` to build the ticket;
   - writes the Domain Docs that its ticket lists, with the code;
   - merges the integration branch tip into its own branch before reporting done

5. Once an **implementer subagent** completes, merge its work to the integration branch with a **merger subagent**.

6. If this changes the **frontier** of available tickets, kick off more **implementer subagents** to work on the new tickets. This allows for maximum concurrency.

7. Once all tickets are complete, compute one fixed point for the reviews: `git merge-base <default branch> <integration branch>`. The default branch is the output of `git symbolic-ref --short refs/remotes/origin/HEAD`. When `origin/HEAD` is not set, the command exits 128: use the first of `origin/main`, `origin/master`, and `origin/develop` that `git rev-parse --verify --quiet <ref>` finds, and ask the user when none exists. If `origin` is a fork, use the remote of the parent repository in place of `origin`, as `code-review` does, and fetch its default branch first. Pass that fixed point to each review:
   - Call the Skill tool with `code-review` on the integration branch.
   - If the diff adds or changes an SQL statement, or adds a loop over rows from a database or over a list that a request or a caller supplies, call the Skill tool with `perf-review`.
   - If the diff touches SQL or another store, a call to another system (an HTTP client, an API client, a fetch or a mutation in the web app), a background loop or goroutine, a cache, a stored or wire format, or a delete of files or rows, call the Skill tool with `data-review`.

   Fix all issues raised by the reviews in a single fresh **implementer subagent**.

8. If the spec names a live proof, the repo instructions ask for a live run, or the spec changes something that a user sees in the UI, call the Skill tool with `field-test` on the integration branch, on a local rig. Run it yourself, once for the whole spec. Parallel rigs in the **implementer subagents** would compete for ports and browser tabs, and only you can ask the user for a confirmation. Fix each failure in a single fresh **implementer subagent**, then run the failed observable again.

9. Read the pull request template of the repo and each rule in your instructions that applies before a pull request opens, and do each check on the integration branch, for example performance measurements in a subagent with a fresh context window. If a draft PR exists, mark it ready for review. Otherwise, resolve each ticket the way the issue tracker closes work, and report the integration branch.

10. Clean up all **implementer subagent** worktrees.
