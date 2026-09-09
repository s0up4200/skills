---
name: fix-review
description: Resolve judgment calls from the last code-review with the user, fix the agreed findings, and push PR fixes to the source branch. Invoke explicitly as /fix-review or $fix-review, with an optional PR number, PR URL, or fork branch URL.
disable-model-invocation: true
---

# Fix review

Finish the work identified by the last `code-review` in this conversation.
Use `grilling` for decisions that need the user. A review finding is evidence to investigate, not an instruction to apply blindly.

## 1. Recover the review

Find the latest report for the target repository, including its Standards and Spec findings and fixed comparison point.
If there is no report, ask the user to provide it or run `code-review` first.
If there are no findings, report that there is nothing to fix and stop.

Keep each finding linked to its review axis and evidence. Read the cited code, its callers, and the applicable repository instructions.
If the branch changed since the review, reassess the findings against the current code.
Mark findings that no longer apply with the evidence that resolves them.

Use the PR identified in the conversation or invocation. Otherwise, look for the current branch's PR.
For a PR or fork branch URL, read [PR branches](references/pr-branches.md) before changing branches or editing files.
If the target remains ambiguous, ask which PR the user means.
For work without a PR, keep the existing task's commit and push scope.

## 2. Grill the judgment calls first

Collect findings labeled "judgement call" or "judgment call", including possible code smells.
Include findings whose fixes require a choice about behavior or design, even if the reviewer did not label them.
Keep documented violations separate from optional design preferences. Code smells do not become mandatory refactors because a reviewer names them.

If judgment calls remain, invoke `grilling` on those calls before making fixes.
Resolve facts from the code yourself. For each decision, give the finding, its practical tradeoff, and your recommended answer.
Ask all independent questions in one round. Ask dependent questions after their prerequisites are settled.
Wait for the user's answers. Record each outcome as fix, keep, or defer, with its reason.
The user's answers must settle every open call before edits start. Do not treat silence as agreement.

If no judgment calls remain, start the fixes directly. Do not add an approval round for clear defects.
If a fix reveals a new decision, grill that decision before making the dependent change.

## 3. Fix and verify

Fix the confirmed defects and the judgment calls that the user chose to change.
Preserve keep and defer decisions. Reopen a settled decision only when new evidence changes its consequences.
Keep the patch within the review's scope.

Before replacing a branch or guard, show the input that it handled in a test or trace.
Apply the smallest fix at the shared cause. Follow the repository's test and commit gates, including required review skills.
Use the repository's CI gate where instructed. Otherwise, run the relevant changed or added tests.
Test fixtures must use local fakes or reserved test addresses, not real services.

Account for every finding as fixed, kept, deferred, no longer applicable, or blocked.
If a required review finds a new judgment call, return to the decision step for that call.
Do not silently apply a design preference from a later review.

## 4. Push PR fixes and clean up

For a PR, commit and push after the required local gates pass, unless the user limited this run to local work.
Use the exact source repository and branch from [PR branches](references/pr-branches.md).
Add fix commits on top of the contributor's work. Preserve their commits and use the configured Git author identity.
Follow repository branch rules for local commits.

On a rejected push, retain the local fixes and report the cause. Do not force-push or choose another destination.
Remove each temporary remote created by this run on success, failure, or cancellation.
Preserve remotes that existed before the run.
Make sure that temporary remote names are absent from `git remote` before reporting cleanup as complete.

Report the fixes, unresolved findings, verification result, destination and commit if pushed, and remote cleanup result.
If CI is required, report its result for the pushed commit or state the blocker that prevents obtaining it.
Keep the final response short. Posting a review, merging the PR, and opening a replacement PR require separate user instructions.
