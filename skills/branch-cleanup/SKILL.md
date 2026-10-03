---
name: branch-cleanup
description: Find dead local git branches and worktrees in the current repo, write a plan with a SHA backup, and hand the user a cleanup script to run. Use only when the user asks, for example "clean up branches", "prune dead branches", "remove old worktrees", "which branches can go", "delete merged branches", or "/branch-cleanup [days]". Handles squash-merged PRs, local-only branches, fork PR checkouts, and worktrees owned by other tools. Do not offer it on your own, and do not use it to delete branches on a remote.
---

# Branch cleanup

Remove local branches and worktrees that no longer carry work, without losing work that exists only on this machine. The plan script decides; you show the plan, and the user runs the cleanup script.

The user runs the script, not you. Auto mode blocks bulk `git branch -D` from the agent, and a bulk delete deserves one look from the user before it runs. Never work around this by deleting branches yourself in smaller batches.

## 1. Run the plan

From anywhere inside the repo:

```bash
<skill-dir>/scripts/plan.sh [days]
```

`days` is the recent window, 7 by default. The user can write it as `14` or `14d`.

The script fetches all remotes with `--prune`, reads PRs with `gh` when `origin` is on GitHub, and changes no branch or worktree. It writes two files into `<git-common-dir>/branch-cleanup/`:

- `<stamp>.tsv`: every branch it plans to delete, with its tip SHA and the reason
- `<stamp>-cleanup.sh`: the script the user runs

## 2. What the plan decides

A branch is kept when any of these is true, checked in this order:

1. It is the default branch, `main`, `master`, `develop`, or the branch the main worktree has checked out.
2. A branch with the same name exists on any remote.
3. An open PR matches it: same head branch name, a `pr-N` or `prN` name, or the same tip commit. A local checkout of an open PR can hold review fixes that are not pushed yet.
4. It is not merged (rules below), and its oldest reflog entry is inside the window. When the reflog has expired, the tip's commit date stands in.
5. Its worktree has local changes or is locked. Git cannot delete a branch that is checked out.

Otherwise it is deleted:

- **merged into the default branch**: the tip is an ancestor of `origin/<default>`.
- **merged PR #N**: the tip is at or behind the head of a merged PR. This catches squash merges, which `git branch --merged` misses.
- **not on any remote, older than N days**: everything else. When some of its commits exist only on this machine, the plan flags it with `!! N commit(s) exist only here`. Commits in a PR head on GitHub count as pushed.

Worktrees: a worktree on a deleted branch is removed. A detached worktree is removed when its HEAD is already merged or pushed. A worktree with local changes, or a locked worktree, stays, and the plan prints its `git status`. Worktree directories that no longer exist are pruned. Worktrees in other tools' directories (Codex, herdr, `/var/tmp`) are treated like any other.

## 3. Show the plan

Give the user the counts, every flagged branch (`!!`) with its commit count, every kept worktree with its status, and the path of the cleanup script. The flagged branches are the only real decision, so put them first. A long list of plain merged branches needs only a count.

Then hand over the command:

```
! <path>/<stamp>-cleanup.sh
```

The cleanup script deletes a branch only if its tip still matches the SHA in the plan, so a branch that moved after the plan is skipped, not lost. It removes worktrees with plain `git worktree remove`, which refuses a worktree that became dirty.

## 4. After the run

Read the script's output from the conversation. Report what was deleted and anything it skipped. To restore a branch, the user runs `git branch <name> <sha>` with the SHA from the `.tsv` file.

## Testing a change to the script

`scripts/test.sh` builds a scratch repo with a local bare remote and a PR fixture, runs the plan and the cleanup, and checks the result. It makes no network call. Run it after any change to `plan.sh`.
