# PR branches

Use this procedure for PR fixes, especially when the contributor uses a fork.
The head repository and head branch are the PR's source. The base repository receives the proposed merge.
Resolve the source from GitHub metadata, not from the PR author, `origin`, or the local branch name.

## Find the source

Use the known base repository and PR number:

```bash
gh api "repos/$review_base/pulls/$review_pr" \
  --jq '{state, head_repo: .head.repo.full_name, head_branch: .head.ref, head_sha: .head.sha, head_url: .head.repo.clone_url, maintainer_can_modify}'
```

For a fork branch URL, retain the complete branch name, including its slashes.
For example, `/tree/fix/2565-contains-in-diacritics` names `fix/2565-contains-in-diacritics`. The number in that name is not a PR number.
Find its open PR in the known base repository:

```bash
gh api --method GET "repos/$review_base/pulls" \
  -f state=open -f "head=$review_owner:$review_head" \
  --jq '.[] | {number, url: .html_url, head_repo: .head.repo.full_name, head_branch: .head.ref}'
```

Match both the head repository and branch against the supplied URL.
If the review does not identify the base repository, read the fork's parent metadata and use it to find the PR.
If no unique match exists, ask the user for the target. Do not guess from a similar title or branch.
Stop before pushing if the PR is closed or its source repository or branch no longer exists.

## Prepare the local branch

Record the existing remotes and worktree changes. Keep reviewed local work when it belongs to the target PR.
If checkout is needed, preserve unrelated changes and use a separate worktree if needed.
Use an unused local branch name for the checkout:

```bash
gh pr checkout "$review_pr_url" --branch "$review_local_branch"
```

Record any remote that checkout creates, so cleanup also covers it.
For a fresh checkout, make sure that its commit matches the PR head before editing.
If it differs from the reviewed commit, reassess the findings on that code before applying them.

## Push to the source and remove the temporary remote

Before pushing, fetch the current source branch and make sure that it is an ancestor of the local fix commits.
Inspect the outgoing commits. They must contain only the reviewed work and these fixes.
If the contributor added commits, inspect them and preserve them when updating the local fixes.
Repeat the relevant verification after integration. Stop and report if the new work needs an unresolved user decision.

Use a temporary remote name that does not already exist. Set its URL from the PR's `head_url` value.
Record its name as soon as creation succeeds. Keep this record through failures so cleanup does not depend on a successful push.

```bash
git remote add "$review_remote" "$review_head_url"
git remote get-url --push --all "$review_remote"
git push "$review_remote" "HEAD:refs/heads/$review_head"
```

Inspect the effective push URL before the push. It must identify only the intended source repository, including after Git URL rewrites.
For an external contribution, this is the contributor's fork, even if `origin` points at the base repository.
Use a normal fast-forward push. On rejection, retain the local commits and report the error without retrying with force.

GitHub can permit maintainer edits through `maintainer_can_modify`, or the user can have direct write access to the fork.
If access is denied, report that blocker. Do not redirect the push to the base repository or another fork.
After a successful push, compare the remote branch SHA with the local fix commit:

```bash
git ls-remote "$review_head_url" "refs/heads/$review_head"
git rev-parse HEAD
```

Run cleanup even when the push or its verification fails:

```bash
git remote remove "$review_remote"
git remote
```

Remove any other remote that this run's checkout created. Preserve all pre-existing remotes.
Make sure that every recorded temporary name is absent. Remote removal changes local Git configuration, not the contributor's repository.
Keep local fix commits available when a push fails, and report their branch and SHA.

## Sources

Platform behavior reviewed on 2026-09-09. Consult these sources if the installed tools behave differently:

- [GitHub pull request API](https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request) defines head repository, branch, and maintainer-edit fields.
- [GitHub CLI checkout](https://cli.github.com/manual/gh_pr_checkout) supports pull requests from forks and local branch selection.
- [Git push](https://git-scm.com/docs/git-push) defines explicit destinations and fast-forward rejection.
- [Git remote](https://git-scm.com/docs/git-remote) defines effective push URLs and local remote removal.
- [GitHub fork contributions](https://docs.github.com/en/pull-requests/how-tos/commit-changes/committing-changes-to-a-pull-request-branch-created-from-a-fork) explains maintainer access.
