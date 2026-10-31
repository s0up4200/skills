---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

If the spec has a Domain Docs section, add each entry as an acceptance criterion on the ticket whose code it describes.

Write into each ticket every decision of the source that applies to it, for example an implementation choice, a test approach, or an out-of-scope item. The Spec reviewer of `code-review` checks the code against the ticket, not against the parent.

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

**Hidden work is the second exception to vertical slicing.** It applies when all of these are true:

- The tracker is GitHub, and the repo has the `no-ui-yet` label: `gh label list --search no-ui-yet --json name --jq '.[].name' | grep -qx no-ui-yet`. In such a repo, users run the branch that each ticket merges into.
- An early ticket, merged alone, would show users part of a feature that does not work yet.
- Each ticket merges as its own PR. When `/implement-spec` builds the whole spec as one PR, nothing reaches users early, so slice as usual.

Slice the feature into **dormant** tickets and one last **gate** ticket:

- A dormant ticket still cuts schema, logic, API, and tests, but it adds no way in for users. Dormant means that with each new setting at its default and no rows in the new tables, the app behaves as before. Its What to build describes the behaviour through the API and the tests. Give it the acceptance criterion "A test fails if the new logic runs without the new data." Publish it with the `no-ui-yet` label. The `labels` skill copies that label to the PR, and the release notes leave a PR with that label out of the Highlights.
- API users and field tests can create the new data before the gate. Let each ticket that protects the data (cleanup, delete, orphan checks) block each ticket that acts on it. Each field test clears the data that it saves.
- If a ticket changes logic that also runs for a user without the new data, keep the old logic as the default behind a switch that users cannot set, for example a constant. Its criterion becomes "With the switch off, a test fails if the new logic runs."
- The gate ticket is blocked by every other ticket. It adds every way in: the navigation link, the route, the setting, each new field in a view that users already have, and the user docs. It deletes each switch and the old logic behind it. Publish it without the `no-ui-yet` label. Its PR body describes the whole feature, because the earlier PRs got no Highlight. If the gate does not fit one context window, split it into tickets whose PRs target an integration branch. The PR of the last one merges that branch and closes each of them.
- Migrations and new endpoints reach users before the gate. Give each table and each endpoint its final shape in the ticket that makes it. A later change to a merged migration is a new migration.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work
- **Role**: dormant, switch, or gate, when the feature is hidden work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the tickets to the configured tracker

Publish the approved tickets. **How** depends on the tracker `/setup-matt-pocock-skills` configured; the tickets are the same either way, only the shape of the blocking edges changes:

- **Local files** → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below: one ticket per file, never a single combined file.
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues. If the source was an existing issue, link each ticket with the tracker document's **Child ticket** operation. Apply the `ready-for-agent` triage label unless instructed otherwise; the tickets are agent-grabbable by construction.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

Keep the parent issue open. Change its description only when the tracker document's **Child ticket** operation requires a membership update. Read the current description first and preserve its other content.

<local-ticket-template>

# <NN>: <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

</local-ticket-template>

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- A reference to each blocking ticket, or "None (can start immediately)". Omit this section when blockers were set as native edges.

</issue-template>

In either form, avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
