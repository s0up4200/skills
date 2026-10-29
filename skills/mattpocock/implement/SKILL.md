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

If the repo instructions ask for a live run, or the branch changes something that a user sees in the UI, call the Skill tool with "field-test" on a local rig. A run on the production host needs the image that CI builds after the push, so it comes after the commit. If a later change touches an observable of the live run, run that observable again.

Once done, call the Skill tool with "code-review" to review the work.

If the diff adds or changes an SQL statement, or adds a loop over rows from a database or over a list that a request or a caller supplies, also call the Skill tool with "perf-review" on the diff. Act on its findings as you act on the code-review findings.

Before you commit, list each place where the code departs from the spec: a requirement that you changed or left out, and each spec question that you answered yourself, for example a term that the spec did not define. Add the departures that code-review found. When the work comes from an issue, post them on the issue in one comment that starts with `Brief amendment (agent decision)`, in the format of a Brief amendment. Otherwise, list them in your final reply.

Commit your work to the current branch.

When the commit is the last step of the user's message, and the session has the tool `mcp__compact__after_turn`, call it, so that the next step, for example `/pr`, starts from a short summary. Give it a `focus` that keeps what the pull request body needs: the issue, the branch, the departures that are not on the issue, and the result of each check that CI cannot see, such as a live run.
