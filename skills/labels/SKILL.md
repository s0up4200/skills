---
name: labels
description: Label a GitHub pull request or issue with the repo's existing labels. Use when the user types "/labels", or says "label this PR", "add labels", "tag the PR", "what labels should this get", "label the issue", or asks for labels on a PR/issue number, URL, or the current branch. Also use right after opening a PR when it has no labels yet. Creates a new label only after the user approves it.
---

# Labels

Pick the labels a pull request or issue should carry, from the labels the repository already has, and apply them. Creating a new label is a repo-wide decision with a long tail — every future contributor sees it — so that step always stops and asks.

Requires the `gh` CLI, authenticated, with write access. Without write access the edit returns 403; report the labels you would have applied so the user can hand them to a maintainer, rather than retrying.

## 1. Resolve the target

The user may give a number (`/labels 412`), a URL, or nothing. With nothing, take the current branch's PR — `gh pr view --json number -q .number`. If that fails there is no PR for this branch; ask which number they mean rather than labelling a nearby PR because it looked close.

Pull requests and issues share one numbering space and one API:

```bash
gh api repos/{owner}/{repo}/issues/<N> --jq '{title,body,labels:[.labels[].name],is_pr:(.pull_request!=null)}'
```

`is_pr` decides which command applies labels in step 5. `gh api` fills `{owner}` and `{repo}` from the current repo — pass `-R owner/repo` for a different one.

## 2. Read what the repo already uses

```bash
gh label list --limit 200 --json name,description,color
```

The `description` field is the repo's own definition of each label — trust it over what the name suggests. `area/parsing` in one repo may be `component: parser` in another; this list is the vocabulary you have. When the descriptions are thin, `gh pr list --state merged --limit 30 --json number,title,labels` shows which labels are actually in use, which are dead, and whether the repo pairs a type label with an area label or uses one per PR.

## 3. Read the change itself

For a PR, the title and body say the intent; the diff says the truth. Both matter — a PR titled "small fix" that touches the auth middleware is a security-relevant change.

```bash
gh pr diff <N> --name-only
```

Paths carry most of the signal: `docs/` means documentation, `.github/workflows/` means CI, `web/` vs `internal/` splits frontend from backend. Read the actual diff only when the paths leave the type ambiguous.

For an issue, the body is all there is. A stack trace or "this used to work" means a bug; "it would be nice if" means a feature request.

## 4. Choose labels

Aim for the smallest set that helps someone filtering the issue tracker. Most PRs land on one type label plus one area label. More than about four on one item is usually a sign of guessing.

Pick from what `gh label list` returned, spelled exactly as it appears there — a name the repo does not have is rejected, not created.

Leave alone labels a person or a workflow owns:

- Process and triage labels (`needs-triage`, `blocked`, `wontfix`, `duplicate`, `good first issue`) reflect a maintainer decision, not a property of the diff.
- Automation labels (`dependencies`, `stale`, release-drafter and semver labels) are applied by bots. Adding them by hand fights the bot or fires the wrong release note.
- `breaking change` and security labels change what happens downstream. Apply only when the diff plainly shows it, and say why in your report.

Never remove a label that is already there. Someone put it there deliberately, and a stale label costs far less than undoing a maintainer's triage. If one looks clearly wrong, mention it and let the user remove it.

## 5. Apply

Both commands add to the existing labels rather than replacing them:

```bash
gh pr edit <N> --add-label "bug,area/parser"      # is_pr true
gh issue edit <N> --add-label "bug,area/parser"   # is_pr false
```

Then report what was added and, in a few words each, why. Skip labels already present and say so rather than re-adding them.

## 6. New labels — ask first

If nothing in the list fits, ask before creating. A new label is justified when it names a category that will recur and no existing label covers it. It is not justified for a one-off PR — that is what the title is for.

Use AskUserQuestion with the proposed name, description, and what it would cover, and offer the closest existing label as the alternative. On approval:

```bash
gh label create "area/scheduler" --description "Job scheduling and cron" --color "0e8a16"
```

Follow the repo's existing naming shape — if labels read `area/x`, do not add `component: y`. A vocabulary with two conventions is worse than one with a slightly imprecise word.

A repo with no labels at all is the one case worth proposing several at once: offer a small starter set (type plus area) for approval instead of creating them one at a time.
