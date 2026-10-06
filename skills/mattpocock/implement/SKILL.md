---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the issue has an Agent Brief comment, the latest brief is the spec. The issue body and the other comments are context only.

Use /tdd where possible, at pre-agreed seams.

Write the Domain Docs that the spec or tickets list to `GLOSSARY.md` and `docs/adr/` on this branch, with the code. Call the Skill tool with "domain-modeling" for the formats.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Before you commit, list each place where the code departs from the spec: a requirement that you changed or left out, and each spec question that you answered yourself, for example a term that the spec did not define. Add the departures that /code-review found. Ask the user about each departure with AskUserQuestion, one question for each, and change the code to match the answers. A spec question that you answer alone stays hidden until after the commit.

Commit your work to the current branch.
