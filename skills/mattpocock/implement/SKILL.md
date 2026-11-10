---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Before you start, find the open children of the ticket through the tracker document's **Child ticket** operation. If the operation is not recorded and the tracker has no native sub-issues, search open issues for the legacy `Part of #<n>` first line. In that case, also read the parent's `## Tickets` task list. If the ticket has open children, ask the user which child to implement. That child is the spec, and its Brief amendment goes on that child.

If the issue has an Agent Brief comment, the latest brief is the spec, and a later `Brief amendment` comment overrides it. The issue body and the other comments are context only.

Read the parent issue in full before you start, for the decisions that apply to this ticket. The user stories of the sibling tickets are context only. Build only what the spec of this ticket asks for.

Before you write code, check the spec for drift when it is more than 7 days old. Code in an active repo moves within a week, and a younger spec, such as one that the user just triaged or grilled, skips the check. Its age counts from the latest Agent Brief or Brief amendment, or, for an issue with neither, from the last edit of the issue body. Fetch the default branch as code-review describes for `<remote>/<branch>`. Then run `git log --oneline --since=<spec date> <remote>/<branch> -- <files>` for the files that the spec names and the files that hold each function, type, setting, and endpoint that it names. Also run `git log --oneline --since=<spec date> -S<name> <remote>/<branch>` for each of those names. The file log finds a rewrite that keeps the name. `-S` finds the commit that deleted or renamed a name, which no longer has a file to log. If a command fails, the check has not run: fix the command, because an empty output must mean no commits. If both print no commits, start the work. Otherwise, start a subagent with a fresh context window. Give it the spec, its date, the commits, and these rules: report facts only, one line for each reference that drifted, with the commit. A reference drifted when it is gone, renamed, or rewritten, or when a merged pull request already builds part of the spec. Propose no change to the spec, because an opinion about a settled spec only makes the user doubt it. If a reference that the spec depends on is gone or rewritten, or part of the work is already merged, ask the user about those items only. Otherwise, start the work without showing the report.

When the work comes from an issue and the user answers a spec question, post a comment on the issue that starts with `Brief amendment`. Write each decision as a short statement of what the code does in place of what the spec says, and why, so the comment reads like an edit to the spec:

```
Brief amendment

- Count in `AuthLogCallback` when publickey auth succeeds, not in the accept loop. A handshake that fails during key exchange does not count.
- A connection that passes auth but closes before the server sends the auth success now counts in `Accepts()`.
```

The Spec reviewer of code-review reads only the issue, so a decision that stays in the chat comes back as a finding.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

Write the Domain Docs that the spec or tickets list to `GLOSSARY.md` and `docs/adr/` on this branch, with the code. Call the Skill tool with "domain-modeling" for the formats.

Run typechecking regularly and single test files regularly. At the end, run the test gate that your instructions define. If they define none, run the full test suite once.

If the spec names a live proof, the repo instructions ask for a live run, or the branch changes something that a user sees in the UI, start a subagent with a fresh context window that calls the Skill tool with "field-test" on a local rig, and reports the commands, the results, and the capture paths. Give the subagent the live proof of the spec. Rig runs need no question to the user, and the subagent keeps the rig output out of your context. A run on the production host needs the image that CI builds after the push, so it comes after the commit. If a later change touches an observable of the live run, run that observable again. For a visual change, the live run is done when it saved a before and an after capture to disk, and your final reply lists the path of each one. `/pr` publishes these captures as Evidence. Without them, it builds both versions again to take them.

Once done, call the Skill tool with "code-review" to review the work.

If the diff adds or changes an SQL statement, or adds a loop over rows from a database or over a list that a request or a caller supplies, also run "perf-review" on the diff.

If the diff touches SQL or another store, a call to another system (an HTTP client, an API client, a fetch or a mutation in the web app), a background loop or goroutine, a cache, a stored or wire format, or a delete of files or rows, also run "data-review" on the diff.

Run each of these reviews in its own subagent with a fresh context window. The subagent calls the Skill tool with the skill name and returns the report. Give it only the skill name and the scope of the diff, not your reasons for the code, because a reviewer that knows why each line is there agrees with it. Act on its findings as you act on the code-review findings.

Then read the pull request template of the repo and each rule in your instructions that applies before a pull request opens, for example performance checks or a docs review. Do each check now, on the final code, so that the pull request needs no more work. Run each measurement in a subagent with a fresh context window, one at a time. Save its full report word for word to a file outside the repo, for example in the session scratchpad, and keep the path. The pull request body gets a short form of it, which the `pr` skill describes. Give each measured cost in absolute time with its unit, per request or per tick, next to the percent, because a large percent of a short path can be a cost that no user notices. If a measurement shows a regression beyond the noise, judge the absolute cost on the real path first. If a user can notice it, try one fix and measure again. If the regression stays, or if a fix costs more than the regression, commit, open no pull request, and ask the user in your final reply whether to accept the cost.

Before you commit, list each place where the code departs from the spec: a requirement that you changed or left out, and each spec question that you answered yourself, for example a term that the spec did not define. Add the departures that code-review found. When the work comes from an issue, post them on the issue without an ask, in one comment that starts with `Brief amendment (agent decision)`, in the format of a Brief amendment. Then commit at once: the user checks the departures on the issue. Otherwise, list them in your final reply.

Commit your work to the current branch.

When your instructions say that the pull request waits for the user, for example a slowdown that the user must accept, a visual change with no captures, or a repo that the user does not own or maintain, end the turn after the commit. Say in your final reply what waits and why, and keep the full context for the user's answer. Otherwise, call the Skill tool with "pr" in the same turn as the commit to open the pull request.
