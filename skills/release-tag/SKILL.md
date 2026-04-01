---
name: release-tag
description: Create and push a signed git release tag. Use this skill when the user says "tag a release", "new release", "cut a release", "bump version", "release tag", "tag version", "push a tag", or any variation of wanting to create a new version tag. Also use when the user types "/release-tag" or "/release".
---

# Release Tag

Create a signed git release tag and push it. The workflow is interactive — the user confirms every step before anything is pushed.

## Workflow

### 1. Ensure the default branch is current

Detect the default branch — don't assume `main`:

```bash
git remote show origin | sed -n '/HEAD branch/s/.*: //p'
```

Then checkout and pull:

```bash
git checkout <default-branch> && git pull origin <default-branch>
```

If the working tree has uncommitted changes, stop and tell the user. Don't stash or discard anything — let them decide.

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
