# Stacked pull requests

A stack is a chain of pull requests made with the `gh stack` extension. Each pull request uses the branch of the one below it as its base. The review threads stay on one pull request, so a run still verifies one pull request. The stack changes where a fix goes, what counts as stale, and how a push reaches the branches above.

## Step 1 in a stack

`gh api repos/$repo/pulls/$pr --jq .stack` gives `number` (the stack number, not a PR number), `position`, and `size`. List the stack, bottom to top:

```bash
gh api "repos/$repo/stacks/$stack" --jq '.pull_requests[] | "\(.number) \(.head.ref) \(.state)"'
```

Check out with `gh stack checkout "$pr"`. It imports the whole stack into `.git/gh-stack`. After a plain `gh pr checkout`, `gh stack rebase` and `gh stack push` stop with "not part of a stack".

Name the stack on the first line of the report, for example `**owner/repo#3026** · stack #3030, 1 of 2 (#3029 above)`.

## Step 2: stale means this branch

A finding is stale only when a commit on this pull request's branch resolved it. A pull request in a stack can still merge alone, and then it ships what its own branch holds. When the fix exists only in a pull request higher up, the verdict is **judgment**: "fixed in #N; move the fix down to this pull request?"

## Step 3: fix this branch, hand off a lower one

Each pull request in a stack can have its own session in its own worktree, which runs this skill on that pull request. A commit on the branch of another pull request competes with that session.

Find the lowest branch whose diff introduced the code. When it is this pull request's branch, commit the fix here. When it is a lower branch, the verdict is **judgment**, and it waits for the user even when it is small: name the lower pull request and the fix, so the user can give it to the session that owns that pull request. A fix on this branch only would leave the lower pull request with the defect. Keep the thread open. After the fix reaches this branch by a rebase, a later run finds it stale.

After a commit on this branch, carry it up the stack:

```bash
gh stack rebase
gh stack push     # --force-with-lease on each branch
```

If `gh stack rebase` stops at a conflict, stop the run. Report the conflicting files, and give `gh stack rebase --abort` as the way back to the state before the rebase. Resolve the thread after the push, on the pull request that has the thread.
