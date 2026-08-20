---
name: pr-conflicts
description: Sweep every open pull request in a repository for merge conflicts and mark the conflicting ones with the repo's conflict label. Use when the user says "check open PRs for conflicts", "which PRs have conflicts", "label the conflicting PRs", "find PRs that need a rebase", "mark PRs with has-conflicts", or asks for a state-of-the-queue pass over open PRs. Also use after merging a large PR, since that is when the rest of the queue goes stale. Not for resolving a conflict in the working tree, which is a merge-conflict task, and not for labelling one PR by type or area, which the labels skill covers.
---

# PR conflicts

Mark every open pull request that no longer merges cleanly, so the queue shows at a glance which branches need their author to merge the base branch in. The label is the deliverable, not a report: it survives the session and shows up in the PR list, filters, and the contributor's own notifications.

Requires the `gh` CLI, authenticated, with write access to the repo. Without write access `gh pr edit` returns 403. Report the list you would have labelled rather than retrying.

## 1. Find the repo's conflict label

Repos spell it differently: `has conflicts`, `has-conflicts`, `conflict`, `needs-rebase`, `status: conflict`. The label the user names in their request is what they remember, not necessarily what exists, and `--add-label` fails on a name the repo does not have.

```bash
gh label list --limit 200 --json name,description
```

Scan the list for the one that names a stale or unmergeable branch, and use that exact string. A `--search conflict` shortcut misses the repos that call it `needs-rebase` or `stale-branch`. If nothing comes back, the repo has no such label. Creating one is a repo-wide decision, so propose the name, description, and colour and wait for approval before `gh label create`.

## 2. Read the merge state of every open PR

```bash
gh pr list --state open --limit 200 --json number,title,mergeable,labels
```

`mergeable` is the field that matters:

- `CONFLICTING` means the merge fails. Label it.
- `MERGEABLE` means it merges. Ignore `mergeStateStatus` here: its `BLOCKED` and `UNSTABLE` values mean a missing review or a failing check, and labelling those as conflicts is the easiest way to make the sweep untrustworthy.
- `UNKNOWN` means GitHub has not computed the merge commit yet.

`UNKNOWN` is the trap. GitHub computes mergeability lazily, and asking for the field is what queues the job, so a fresh clone, a repo nobody has queried in a while, or a PR opened seconds ago comes back `UNKNOWN` on the first pass. Treating that as "fine" silently skips PRs that are in fact conflicting, and the sweep then reports a clean queue that is not clean. Re-query only the unknown ones after a few seconds:

```bash
gh pr list --state open --limit 200 --json number,mergeable -q '.[]|select(.mergeable=="UNKNOWN").number'
```

If a number is still `UNKNOWN` after two or three tries, leave it alone and say so in the report. A wrong label on someone's PR costs more than a gap you named out loud.

Draft PRs count. A draft with conflicts is exactly the case where the author has stopped watching, and the label is how they find out.

## 3. Apply the label

Skip PRs that already carry it, so the report shows what actually changed and nobody gets a fresh notification for a state they already know about.

```bash
gh pr edit <N> --add-label "has conflicts"
```

`--add-label` adds to the existing labels, it does not replace them.

## 4. Remove the label from PRs that are clean again

This is the half that makes the sweep worth running twice. A conflict label that stays on after the author merges the base branch in trains everyone to ignore the label, and then it stops meaning anything.

Remove it only when `mergeable` is `MERGEABLE` on this run. Never remove on `UNKNOWN`, since that is absence of information, not a clean merge.

```bash
gh pr edit <N> --remove-label "has conflicts"
```

This is the one exception to leaving existing labels alone. The conflict label is derived state that this sweep owns, unlike a type or area label that a maintainer chose deliberately.

## 5. Report

Give the counts first, then the list of PRs that changed, with numbers and titles so the user can click through. Name three things explicitly:

- PRs newly labelled
- PRs the label was removed from
- PRs left undecided because `mergeable` stayed `UNKNOWN`

Say nothing about the PRs that were already correct beyond a count. The user is scanning for what moved.

## Notes

Conflicts are computed against each PR's own base branch, which is not always the default branch. A stack of PRs based on each other shows the child as conflicting until the parent merges, and that resolves itself.
