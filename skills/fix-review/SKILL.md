---
name: fix-review
description: Resolve the judgment calls from the last code-review, fix the agreed findings, and push the fixes to the pull request's source branch.
disable-model-invocation: true
argument-hint: "[optional: PR number, PR URL, or fork branch URL]"
---

# Fix review

Finish the work identified by the last `code-review` in this conversation.
Use `grilling` for decisions that need the user. A review finding is evidence to investigate, not an instruction to apply blindly.

With no argument, use the pull request named in the conversation, or the pull request for the current branch.

## 1. Recover the review

Find the last `code-review` report in this conversation. It has a `## Standards` section, a `## Spec` section, and the fixed point the review compared against.
If there is no report, ask the user to provide one or to run `code-review` first.
If both sections report no findings, say there is nothing to fix and stop.

Keep each finding linked to its axis and its evidence. Read the cited code, its callers, and the applicable repository instructions.
If the branch changed since the review, reassess each finding against the current code. Mark the findings that no longer apply, with the evidence that resolves them.

## 2. Identify the target branch

Let `gh` resolve the source branch. Do not derive it from the author, from `origin`, or from the local branch name. Check that the pull request is still open, and whether its fork accepts maintainer edits:

```bash
gh pr view "$pr" --json state,maintainerCanModify
```

A fork branch URL is not a pull request number. Keep the whole branch name, slashes included: `/tree/fix/2565-contains-in-diacritics` names the branch `fix/2565-contains-in-diacritics`, and `2565` is part of that name. Find its open pull request:

```bash
gh api --method GET "repos/$base/pulls" -f state=open -f "head=$owner:$branch" \
  --jq '.[] | {number, url: .html_url, head_repo: .head.repo.full_name, head_branch: .head.ref}'
```

If there is no unique match, ask the user which pull request they mean. Do not guess from a similar title or branch name.
Stop before any edit if the pull request is closed, or if its source repository or branch is gone.

Check out the pull request when the fixes need a different branch. Keep the default local branch name, so that a later `git push` maps to the source branch. Add `--worktree "$path"` when the current working tree must stay as it is:

```bash
gh pr checkout "$pr"
```

For work with no pull request, keep the current task's commit and push scope.

## 3. Grill the judgment calls first

Collect the findings that need a decision rather than a repair: anything the reviewer called a judgement call, every possible code smell, and every finding whose fix chooses between behaviours or designs.
Keep documented violations separate from optional design preferences.

If judgment calls remain, invoke `grilling` on them before making any fix.
Resolve facts from the code yourself. For each decision, give the finding, its practical tradeoff, and your recommended answer.
Ask all independent questions in one round. Ask dependent questions after their prerequisites are settled.
Wait for the user's answers. Record each outcome as fix, keep, or defer, with its reason. Silence is not agreement.

If no judgment call remains, start the fixes. Do not add an approval round for clear defects.
If a fix reveals a new decision, grill that decision before making the dependent change.

## 4. Fix and verify

Fix the confirmed defects, and the judgment calls the user chose to change.
Preserve the keep and defer decisions. Reopen a settled decision only when new evidence changes its consequences.
Keep the patch inside the review's scope.

Before you remove a branch or a guard, show the input that it handled, in a test or a trace.
Apply the smallest fix at the shared cause. Follow the user's commit gate and the repository's own instructions, including every review skill they require.
Where CI is the test gate, use it. Otherwise, run the tests you changed or added.
Test fixtures use local fakes or reserved test addresses, never real services.

Account for every finding as fixed, kept, deferred, no longer applicable, or blocked.
If a required review raises a new judgment call, return to step 3 for that call.
Do not silently apply a design preference from a later review.

## 5. Push and report

For a pull request, commit and push after the local gates pass, unless the user limited this run to local work.
`gh pr checkout` points the branch at the pull request's source, a contributor's fork included, so a plain `git push` reaches the right place. `-v` names the destination as it pushes:

```bash
git push -v
```

If the push is rejected, keep the local commits and report their branch and SHA with the cause, commonly a fork that forbids maintainer edits (`maintainerCanModify`). Do not force-push, and do not choose another destination.

Report the fixes, the unresolved findings, the verification result, and the destination and commit if you pushed.
Keep the report short.
