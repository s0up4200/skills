---
name: focus
description: Recommend what the user should work on next in a GitHub or Forgejo repo. It ranks all open work, and puts first the teammates who wait on the user. Then come PRs to merge, the user's own claims, refactors of code that keeps breaking, PRs from outside contributors, and issues to implement or triage. When the user names an epic (a tracking issue with sub-issues and blocked-by edges), it shows that epic. Use when the user types "/focus", or asks "what should I work on next", "where do I focus", "who waits on me", "what is free to pick up", "what is blocked", "is my ticket unblocked yet", or "status of the epic", or names a tracking issue such as owner/repo#123. Not for a sweep of every open issue for fixed or stale ones, which github-resolution-audit covers, and not for PR merge conflicts, which pr-conflicts covers.
---

# Focus

Answer one question: what should the user work on next? The answer is a judgement over all open work in the repo. First comes the work that holds up other maintainers, because each day that they wait costs the project more than one day of the user's own work. An epic (a tracking issue with sub-issues) is one input to this judgement, not the whole answer.

The report is read-only. Do not assign, comment, or edit an issue unless the user asks in this session, because a claim on shared work tells the other contributors to stay away.

Requires the `gh` CLI, authenticated.

## 1. Find the scope

- The user named an issue, or asked for the state of an epic: read [`references/epic-report.md`](references/epic-report.md) and follow it in place of the steps below.
- The user passed `prs` (`/focus prs`): rank only the pull requests.
- The user named a repo, or the current directory is a GitHub or Forgejo repo: that repo is the whole scope. A repo with no open issues and no open PRs is a complete answer. Report it and stop.
- Neither: find the repos where somebody waits on the user, and the repos of the user's own claims:

  ```bash
  gh search prs --review-requested=@me --state open --limit 100 --json repository \
    --jq '[.[].repository.nameWithOwner]|group_by(.)|map("\(.[0]) \(length)")[]'
  gh search issues --assignee @me --state open --limit 100 --json repository \
    --jq '[.[].repository.nameWithOwner]|group_by(.)|map("\(.[0]) \(length)")[]'
  ```

  Read each repo that they list. Ask which repo only when both come back empty. Do not sweep every repo the user can see, because that is slow and mostly noise.

## 2. Read the open work

```bash
<skill base directory>/scripts/open-work.sh OWNER/REPO
```

The base directory is printed when the skill loads. The script prints one line per open PR, oldest first. Then it prints one line per open issue. The comment at the top of the script names each field. These fields drive the ranking:

- `team` or `outside` on a PR. A team member is an author with the association OWNER, MEMBER, or COLLABORATOR. Each other author is an outside contributor.
- `review requested: me` on a PR, and `new commits since my review`.
- `asks me` on an issue: a comment after the user's last comment mentions the user. A team comment after the user's last comment that proposes a plan or asks to take the issue waits on the user too, with no mention. Read each `last:` line for it.
- `blocking` and `blockedBy` on an issue, with only the open edges. An issue that blocks two or more open issues is a gate. Finishing a gate frees the most work.
- `epic N/M done` on a tracking issue, and `epic #N` on its sub-issues.

If a comment that the script cut can mean that the work is done, or that somebody asks the user a question, read the issue with `gh issue view N --json comments`.

On a Forgejo repo, use `fj`. Inside a clone, it finds the host and the repo from the git remote. `fj whoami` shows the login.

```bash
fj pr search --state open
fj issue search --state open
fj issue view N comments
```

`fj` shows no author association and no dependencies. On Forgejo, treat the collaborators of the repo as the team, and read the blockers from the issue bodies and comments.

### Labels

The repo's triage labels are in `docs/agents/triage-labels.md` when that file exists. Map each label to its role: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, `needs-grilling`. An issue with no triage label has the role `needs-triage`.

Read the repo's labels once with `gh label list --json name,description`. Treat each label that means refactor, tech debt, or cleanup as a refactor label.

### Hot spots

When the current directory is a clone of the repo, find the files that bug fixes touched most often in the last 90 days:

```bash
git log --since=90.days --format= --name-only -E -i --grep='^fix' | sort | uniq -c | sort -rn | head -15
```

A file with many fixes is a hot spot. Leave out lock files, changelogs, and generated files. A refactor of a hot spot makes the next fix and the next agent run in that code cheaper. Skip this step when there is no local clone.

## 3. Find the work that is done

First find the issues that are done but still open: a comment says that the work is finished, and lists no open work. A PR with no closing keyword leaves its issue open. A status update that names merged PRs and also lists open work ("Open: ...", "left to do") is not done. Check each PR that a comment names with `gh pr view N --json state`, because a comment can be wrong. Report each done issue as one to close, not as work to rank.

A tracking issue with `epic M/M done` is done too: every sub-issue is closed. Report it as one to close, unless its body lists work that has no ticket yet.

## 4. Rank

Ignore drafts, `wontfix` issues, and `needs-info` issues with no reply from the reporter. Rank the rest, best first:

1. Unblock a teammate. A team PR that asks for the user's review, or that has no review from the user, or that has new commits since the user's last review. An issue with `asks me` from a team member. The user's issue or PR that blocks an issue that a teammate claimed. Next step for a PR: `/code-review`. Next step for an issue: `/grilling` on it, then one reply with the answers.
2. Merge: a PR that is approved, has green checks, and has no conflicts.
3. The user's own work: the user's PR with requested changes, then the user's ready claims, gates first.
4. Refactor: an open issue with a refactor label that is free or claimed by the user, and that nothing open blocks. Put first a refactor that is a gate or that touches a hot spot. When no refactor issue touches the top hot spot, name that file as a candidate for `/codebase-design`.
5. Review an outside contributor's PR, with the same conditions as in rank 1. A review request to the user comes first.
6. Implement: a free `ready-for-agent` issue that nothing open blocks. Gates first, then bugs before enhancements. Next step: `/implement`, on a new branch.
7. Triage: a `needs-triage` issue, or a `needs-info` issue that has a reply from the reporter after the last maintainer comment. An outside reporter's question that waits for an answer goes here too. Next step: `/triage`.
8. `ready-for-human`: name it. The user does this work, not an agent.
9. Grill: a `needs-grilling` issue, the maintainer's own parked idea. Next step: `/grill-with-docs`, then `/to-spec`.

Inside one rank, put the oldest PR first (by `created`). A PR that waits for weeks costs its author more than a new one. Show the size of each PR (`+additions/-deletions`).

A PR with failing checks or conflicts waits on its author, not on the user. Leave it out of ranks 1, 2, and 5, unless the author asked the user for help.

When the user's own claim is blocked, name the blocker and who holds it. A blocked claim is usually a reason to help with its blocker.

## 5. Report

Lead with one recommendation and at most two alternatives, each with a one-line reason. The user asked where to look, not for a ranked list of fourteen items. Then one block per repo:

```
owner/repo
  Done:      #99 (comment: finished in merged PR #117), close it
  Waiting:   PR #118 by alice (team, review requested, 9 days, +340/-80), #130 asks me (bob)
  Merge:     PR #120 (approved, CI green, +12/-3)
  Yours:     PR #122 changes requested, #104 (gate for #105 #106)
  Refactor:  #110 (gate for #111), hot spot internal/sync/worker.go (9 fixes in 90 days)
  Outside:   PR #125 by carol (review requested, +39/-1)
  Implement: #107 bug, #98
  Triage:    #131 (no label), #81 needs-info (reporter replied)
  Grill:     #95, #97
  Epics:     #100 2/9 done, #140 0/4 done
```

Link each number. Leave empty lines out. The `Epics` line shows progress only. For the tree of one epic, the user runs `/focus #N`.

## 6. Ask only what changes the answer

Ask after the report, not before, and only when the answer changes the recommendation:

- The best free issue is a gate: should the user claim it? Assign it only on a yes, with `gh issue edit N --add-assignee @me`.
- An issue is done but still open: should the user close it? Close it only on a yes, with `gh issue comment N --body "Shipped in #X"` and then `gh issue close N`, because `gh issue close --comment` on an already-closed issue drops the comment and still exits 0.
