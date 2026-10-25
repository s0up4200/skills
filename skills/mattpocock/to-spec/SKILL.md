---
name: to-spec
description: "Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed."
disable-model-invocation: true
---

This skill takes the current conversation context and codebase understanding and produces a spec. Do NOT interview the user; just synthesize what you already know.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations.

3. Write the spec using the template below, then publish it to the project issue tracker in one of two ways:
   - If the conversation grilled an existing issue that has no sub-issues, and the spec covers the whole issue, replace the body of that issue with the spec. Remove its triage-role label, whatever role it had. Post no comment on it. The tracker keeps the old body in the edit history.
   - In all other cases, create a new issue.

   Apply the `ready-for-agent` triage label - no need for additional triage.

4. If the spec is a new issue and the conversation grilled an existing issue, comment "Specced in #<spec>" on that issue. If the issue has sub-issues, it is a map: keep it open, link the spec to it as a child the way the tracker doc's **Child ticket** operation links one, and remove its triage-role label. Otherwise the spec covers only part of it: keep it open and give it the triage role that the session decided for the rest. Close each other issue that the spec covers in full, with the comment "Covered by #<spec>".

5. Give each follow-up issue that the session filed (for example "investigate X" or "track the gap Y") the triage role that the session's decisions set, such as `ready-for-agent` or `ready-for-human`. `docs/agents/triage-labels.md` maps each role to its label. When a follow-up depends on the spec, add a blocked-by edge from the follow-up to the spec with the tracker doc's **Blocking** operation. When a follow-up is blocked by the grilled issue, move that edge to the spec.

<spec-template>

## Branch

The first step for the implementer, before any code: update the base branch of the repo, then run `git switch -c <type>/<slug>` with a concrete name. `/implement` commits to the current branch, so without this step the work lands on the base branch. If the session ran on a feature branch, for example in a worktree, name that branch here and tell the implementer to rebase it on the updated base branch.

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.

## Domain Docs

The glossary entries and ADRs that this work adds or changes, in final text, gathered from the conversation and the resolved tickets. Omit this section when there are none.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

</spec-template>
