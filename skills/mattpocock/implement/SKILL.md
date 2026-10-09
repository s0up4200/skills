---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

If the issue has an Agent Brief comment, the latest brief is the spec, and a later `Brief amendment` comment overrides it. The issue body and the other comments are context only.

When the work comes from an issue and the user answers a spec question, post a comment on the issue that starts with `Brief amendment`. Write each decision as a short statement of what the code does in place of what the spec says, and why, so the comment reads like an edit to the spec:

```
Brief amendment

- Count in `AuthLogCallback` when publickey auth succeeds, not in the accept loop. A handshake that fails during key exchange does not count.
- A connection that passes auth but closes before the server sends the auth success now counts in `Accepts()`.
```

Write only the decisions that the user made. If the user answered "yes", the decision is your recommended answer. The Spec reviewer of code-review reads only the issue, so a decision that stays in the chat comes back as a finding. A spec question that you answer yourself stays a departure for the step before the commit.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

Write the Domain Docs that the spec or tickets list to `GLOSSARY.md` and `docs/adr/` on this branch, with the code. Call the Skill tool with "domain-modeling" for the formats.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with "code-review" to review the work.

Before you commit, list each place where the code departs from the spec: a requirement that you changed or left out, and each spec question that you answered yourself, for example a term that the spec did not define. Add the departures that code-review found. Ask about all the departures in one round, in the format of the `grilling` skill: number each question, give your recommended answer, and word it so "yes" accepts the recommendation.

```
❓ **Q1** - **<departure title>**: <what the spec says, what the code does, and the choices>

➡️ <your recommended answer>
```

Wait for the answers, and change the code to match them. If an answer raises a new question, ask it in a new round. A spec question that you answer alone stays hidden until after the commit.

Commit your work to the current branch.
