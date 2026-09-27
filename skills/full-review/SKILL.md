---
name: full-review
effort: high
description: Check that a pull request does what it promises, in one run. It runs /code-review, /pr-review-toolkit:review-pr, a design pass for architecture and negative space, and /verify-review --dry-run on the unresolved AI threads, then /prove-review on all of it, then asks whether to post with /post-review or to fix it yourself. Run it only when the user names it, as /full-review [pr] [-- intent note].
argument-hint: "[optional: PR number or URL] [-- intent note, e.g. pure refactor, no functional change]"
---

# Full review

One command for a full review of a pull request. The review answers one question first: **does the PR do what it promises?** A promise often needs changes outside the diff: a caller that still sends the old value, a type that mirrors the old model, a document that describes the old behavior. A missing change of that kind breaks the promise as surely as a bug in the diff.

Each reviewer sees a different part of the change:

- `/code-review` checks the diff against the repository's standards and the linked spec.
- `/pr-review-toolkit:review-pr` checks the tests, the error handling, and the comments.
- The **design reviewer** reads past the diff. It explains what the change does, checks the architecture, and looks at the **negative space**: what else must change for each promise to hold. A diff reviewer cannot see a line that is not in the diff.
- `/verify-review --dry-run` checks the unresolved AI review threads that are already on the PR.

Then `/prove-review` keeps only the findings it can prove, and the user decides what happens next.

The run is expensive: several reviewer agents, then `/prove-review` rounds. The user asked for that cost when they typed the command.

Arguments: `/full-review [pr] [-- intent note]`. With no PR, use the PR named in the conversation, then the PR of the current branch. Stop if there is no PR, or if it is closed or merged. The intent note is what the author meant the change to be, for example "pure refactor, no functional change". Every reviewer gets it, and it counts as spec.

Nothing in steps 1 to 4 writes to GitHub or to the PR branch.

## 1. Pin the target

```bash
gh pr view "$pr" --json number,url,state,title,body,headRefOid,baseRefName,closingIssuesReferences
git fetch origin "pull/$pr/head" "$base"
git merge-base "$head_sha" "origin/$base"
```

Record the repository path, the PR number, the head SHA, the base branch, and the merge-base. Every report in this run is about that head SHA.

Collect the spec: each linked issue (`gh issue view`), each design document the PR body names, and the intent note. If there is none, the spec is the PR body alone. Say so in the prompts, so no reviewer stops to ask for one.

Write the **promise list** to `promises.md` in the scratchpad: one numbered line for each thing the PR says it does, with the quote it comes from. Take the promises from the title, the PR body, each acceptance criterion of the linked issues, and the intent note. A promise is a behavior a user or a caller can observe ("a ratio above 10 saves"), not a file the PR edits. Every reviewer gets this list.

The reviewers read the working tree, so it must be the PR head. If `git rev-parse HEAD` already gives the head SHA and `git status --porcelain` is empty, review in place. Otherwise, make a worktree on disk, never in the RAM-backed `/tmp`, and work from it:

```bash
wt=/var/tmp/full-review/$(basename "$repo")-$pr
git worktree add --detach "$wt" "$head_sha"
```

## 2. Run the reviews

Load `/code-review` and `/pr-review-toolkit:review-pr` with the Skill tool. Then dispatch, in one message, so that they run in parallel:

- The `/code-review` sub-agents. The fixed point is the merge-base. Give the Spec sub-agent the spec and the promise list from step 1. If `/code-review` wants `docs/agents/issue-tracker.md` and the repository has none, the issue is already fetched: go on without it.
- The `/pr-review-toolkit:review-pr` agents for the `tests errors comments` aspects only. In trial runs these found defects no other reviewer did. The code reviewer and the type analyzer only repeated what `/code-review` and the design reviewer found, and the simplifier proposes polish that tests no promise. Their scope is `git diff <merge-base>...<head>`, not the uncommitted changes, which are empty here. Give them the promise list as context.
- The design reviewer, on Opus. The prompt names the repository or worktree path, the PR number, the head SHA, the merge-base, the spec and the promise list from step 1, and this instruction: "Read `<skill base directory>/references/design-reviewer.md` and follow it."

While the agents run, run `/verify-review "$pr" --dry-run`. Hold its judgment questions: they go to the user once, in the final report, not in the middle of the run. If the PR has no unresolved AI threads, note that and go on.

When all agents are back, print each report under its own heading: `/code-review`, `/pr-review-toolkit:review-pr`, design review, `/verify-review`. Each report stays whole. `/prove-review` merges them in the next step, and a merge here would hide which reviewer found what.

The step is done when each of the four reports is in the conversation, or has a one-line reason why it is absent.

## 3. Prove

Run `/prove-review "$pr"` on every report from step 2. Tell it that the reports come from `/full-review`, so it proves all of them in one run, and give it the path to `promises.md`. Its `/full-review` section covers the merge.

## 4. Clean up

If step 1 made a worktree, remove it: `git worktree remove "$wt"`.

## 5. Report and ask

Print, in this order:

1. The **walkthrough** from the design review: what the change does, in depth.
2. The proved report from `/prove-review`, with the head SHA. It opens with the promise checklist.
3. The **design questions** from the design review. These are architecture concerns that have no line to point at, so `/prove-review` cannot prove them. They are for the user to think about.
4. The dropped list, one line for each finding.
5. The decisions on the AI threads, one question for each judgment verdict, with your recommendation.

If no finding survived `/prove-review`, say that the review is clean, and stop after the list above. A request-changes review with nothing to change is noise.

Otherwise, ask the user one question with the AskUserQuestion tool:

- **Post the review**: run `/post-review "$pr"`. It rewrites the proved report for the PR author, shows the final body, and waits for a yes before anything reaches GitHub.
- **Fix it myself**: stop here. The proved report stays in the conversation for the user to work from.
