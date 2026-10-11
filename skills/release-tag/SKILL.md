---
name: release-tag
description: Create and push a signed git release tag, then finish the release where a workflow opens a release-notes PR for the tag. Use this skill when the user says "tag a release", "new release", "cut a release", "bump version", "release tag", "tag version", "push a tag", or any variation of wanting to create a new version tag. Also use when the user types "/release-tag" or "/release", or says "finish v1.2.3" for a tag that is already pushed.
---

# Release Tag

Create a signed git release tag and push it. The workflow is interactive — the user confirms every step before anything is pushed. If the user says "finish <tag>" for a tag that is already pushed, start at step 7 with that tag.

## Workflow

### 1. Ensure the release branch is current

The release branch is `main` when the remote has both `main` and `develop`. Releases ship from `main` there, and `develop` is merged into `main` before a tag. In other repos, the release branch is the default branch:

```bash
git ls-remote --heads origin main develop
git remote show origin | sed -n '/HEAD branch/s/.*: //p'
```

Then check out and pull:

```bash
git checkout <release-branch> && git pull origin <release-branch>
```

If the working tree has uncommitted changes, stop and tell the user. Don't stash or discard anything — let them decide.

If the release branch is `main` and `develop` has commits that are not on `main`, show the count and ask the user before you continue. A fix-only release from `main` is a valid choice:

```bash
git fetch origin && git rev-list --count origin/main..origin/develop
```

### 2. Find the latest tag

```bash
git describe --tags --abbrev=0
```

Parse the version components (e.g., `v1.21.3` → major=1, minor=21, patch=3). If no tags exist, start from `v0.1.0`.

### 3. Determine the next version

Look at commits since the last tag to decide whether this is a minor or patch bump:

```bash
git log <latest-tag>..HEAD --oneline
```

**Patch bump** (v1.21.3 → v1.21.4): Only bug fixes, docs, chores, refactors, dependency bumps, or minor tweaks. Look for commit prefixes like `fix`, `chore`, `docs`, `refactor`, `perf`, `style`, `ci`, `build`.

**Minor bump** (v1.21.3 → v1.22.0): Any new features or meaningful behavior changes. Look for commit prefixes like `feat`, or commits that clearly add new functionality even without conventional commit prefixes.

**Never bump major.** If commits look like breaking changes, still suggest a minor bump and note the breaking changes to the user.

When in doubt, default to patch.

### 4. Present the plan and ask for confirmation

Show the user:
- Current latest tag
- The commits since that tag (short log)
- Your recommended version and why (minor vs patch)
- The exact commands that will run

Use AskUserQuestion to let them confirm or pick a different version. Offer both the minor and patch options so they can override your recommendation.

### 5. Create and push the tag

Only after the user confirms:

```bash
git tag -s v<VERSION> -m "v<VERSION>"
git push origin v<VERSION>
```

Use `git push origin v<VERSION>` (pushing the specific tag) rather than `git push --tags` to avoid accidentally pushing other local tags.

### 6. Confirm success

Show the tag that was created and a link to the releases page if it's a GitHub repo (check with `git remote get-url origin`).

### 7. Finish the release

Do this step only when a workflow opens a release-notes PR for the tag. In autobrr/qui, `release-notes.yml` copies the release body to `documentation/blog` after the Release run. In autobrr/mkbrr, `changelog.yml` writes a changelog entry. Find the workflow:

```bash
grep -lE 'docs\([a-z-]+\): add \$' .github/workflows/*.y*ml
```

If grep finds no file, the release is finished after step 6.

Wait for the runs and the PR in the background (Bash with `run_in_background`). The script judges only the latest run of each workflow, so a run that was cancelled and then re-run does not count as a failure. It gives the tag runs 20 minutes and the PR 10 more minutes. It prints one line: `PR <number>`, `FAILED <run url>`, or `TIMEOUT <phase>`:

```bash
tag=v<VERSION>
end=$((SECONDS+1200))
until gh run list --branch "$tag" --json status --jq 'length > 0 and all(.status == "completed")' | grep -q true; do
  [ $SECONDS -lt $end ] || { echo "TIMEOUT runs"; exit 2; }
  sleep 30
done
failed=$(gh run list --branch "$tag" --json workflowName,createdAt,conclusion,url --jq 'group_by(.workflowName) | map(max_by(.createdAt)) | .[] | select(.conclusion != "success" and .conclusion != "skipped") | .url')
[ -z "$failed" ] || { echo "FAILED $failed"; exit 1; }
end=$((SECONDS+600))
until pr=$(gh pr list --state all --search "$tag in:title" --json number,title --jq ".[] | select(.title | endswith(\": add $tag\")) | .number") && [ -n "$pr" ]; do
  [ $SECONDS -lt $end ] || { echo "TIMEOUT pr"; exit 2; }
  sleep 30
done
echo "PR $pr"
```

If the script prints `FAILED` or `TIMEOUT`, stop and report which step broke, with the run link. Do not re-run a workflow, publish a draft, or edit the release. The user decides what to do.

When the PR exists, make sure that the release is published (`isDraft` is false), and show the user:

- The PR link and the files it changes (`gh pr view <number> --json url,files`).
- The release URL.
- The Highlights section of the release body, quoted (`gh release view v<VERSION> --json isDraft,url,body`).

If the release is still a draft, stop and report. If the PR changes a file outside `documentation/` or the changelog folder that the workflow writes to, flag it to the user.

Give the user the merge command and do not run it yourself. The release branch requires an approving review, and only the user decides to bypass it:

```bash
gh pr merge <number> --squash --admin
```

Then watch the PR state in the background, every 30 seconds for up to one hour:

```bash
end=$((SECONDS+3600))
until state=$(gh pr view <number> --json state --jq .state) && [ "$state" != OPEN ]; do
  [ $SECONDS -lt $end ] || { echo TIMEOUT; exit 2; }
  sleep 30
done
echo "$state"
```

If the state is `CLOSED`, stop and report. If the watch times out, tell the user to say "finish v<VERSION>" after the merge.

When the state is `MERGED` and the remote has a `develop` branch, merge `main` into `develop`. This pushes a commit straight to `develop`, so ask the user for a separate yes that names the push first:

```bash
git fetch origin
git checkout develop && git pull origin develop
git merge --no-ff origin/main -m "Merge branch 'main' into develop"
git push origin develop
```

If the merge has a conflict, stop. Leave the working tree as it is and tell the user which files conflict.
