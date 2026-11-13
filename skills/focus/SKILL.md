---
name: focus
description: Recommend what the user should work on next, in one GitHub or Forgejo repo or across all the repos of their recent work. It ranks all open work in one table, and puts first the teammates who wait on the user. Then come PRs to merge, the user's own claims, refactors of code that keeps breaking, PRs from outside contributors, and issues to implement or triage. Each row names the next skill and a model, and in T3 Code "start 1 3" opens a thread for each row. When the user names an epic (a tracking issue with sub-issues and blocked-by edges), it shows that epic. Use when the user types "/focus" or "/focus all", or asks "what should I work on next", "where do I focus", "who waits on me", "what is open across my repos", "what is free to pick up", "which issues can I implement next", "what is blocked", "is my ticket unblocked yet", or "status of the epic", or names a tracking issue such as owner/repo#123. Not for a sweep of every open issue for fixed or stale ones, which github-resolution-audit covers, and not for PR merge conflicts, which pr-conflicts covers.
---

# Focus

Answer one question: what should the user work on next? The answer is a judgement over all open work in the repo. First comes the work that holds up other maintainers, because each day that they wait costs the project more than one day of the user's own work. An epic (a tracking issue with sub-issues) is one input to this judgement, not the whole answer.

The report is read-only. Do not assign, comment, or edit an issue unless the user asks in this session, because a claim on shared work tells the other contributors to stay away.

Requires the `gh` CLI, authenticated.

## 1. Find the scope

- The user named an issue, or asked for the state of an epic: read [`references/epic-report.md`](references/epic-report.md) and follow it in place of the steps below.
- The user passed `all` (`/focus all`, `/focus all 14`) or asked about all their repos, or the user named no repo and the current directory is not a GitHub or Forgejo repo: read [`references/all-repos.md`](references/all-repos.md). It replaces step 2 and adds rules to step 5.
- The user passed `prs` (`/focus prs`): rank only the pull requests.
- The user named a repo, or the current directory is a GitHub or Forgejo repo: that repo is the whole scope. A repo with no open issues and no open PRs is a complete answer. Report it and stop.

## 2. Read the open work

```bash
<skill base directory>/scripts/open-work.sh OWNER/REPO
```

The base directory is printed when the skill loads. The first line names the user's login and the default branch. A `release:` line follows when the default branch is ahead of the latest release. Then the script prints one line per open PR, oldest first, and one line per open issue. The comment at the top of the script names each field. These fields drive the ranking:

- `team` or `outside` on a PR. A team member is an author with the association OWNER, MEMBER, or COLLABORATOR. Each other author is an outside contributor.
- `review requested: me` on a PR, and `new commits since my review`.
- `unresolved threads` on a PR: review comments that nobody has resolved. `review threads: read 100 of N` means that the script did not read them all. Then count them on the page of the PR.
- `asks me` on an issue: a comment after the user's last comment mentions the user. A team comment after the user's last comment that proposes a plan or asks to take the issue waits on the user too, with no mention. Read each `last:` line for it.
- `blocking` and `blockedBy` on an issue, with only the open edges. An issue that blocks two or more open issues is a gate. Finishing a gate frees the most work.
- `body blockers` on an issue: the issues and PRs that a "Blocked by" line or a "Blocked by" section of the body names. The script does not read their state. For each issue that you rank under Implement, read it with `gh issue view N --repo OWNER/REPO --json state`. An open one blocks the issue.
- `closing PRs` on an issue: the open PRs that close it. Somebody already works on the issue.
- `epic N/M done` on a tracking issue, and `epic #N` on its sub-issues.

If a comment that the script cut can mean that the work is done, or that somebody asks the user a question, read the issue with `gh issue view N --repo OWNER/REPO --json comments`.

The unread notifications show who waits on the user where the script sees no mention, for example in a review comment. Read them, and leave them unread. The query keeps the last 14 days, because old unread notifications are mostly about closed items. Drop `repos/OWNER/REPO/` from the path to read all repos:

```bash
gh api repos/OWNER/REPO/notifications --paginate --jq '.[]
  | select(.reason | IN("mention", "team_mention", "review_requested", "assign"))
  | select(.updated_at > (now - 14*86400 | todate))
  | "\(.reason) | \(.repository.full_name)#\((.subject.url // "") | split("/") | last) | \(.subject.title)"'
```

On a Forgejo repo, use `fj`. Inside a clone, it finds the host and the repo from the git remote. `fj whoami` shows the login.

```bash
fj pr search --state open
fj issue search --state open
fj issue view N comments
```

`fj` shows no author association and no dependencies. On Forgejo, treat the collaborators of the repo as the team, and read the blockers from the issue bodies and comments.

### Labels

The repo's triage labels are in `docs/agents/triage-labels.md` when that file exists. Outside a clone of the repo, read it with `gh api repos/OWNER/REPO/contents/docs/agents/triage-labels.md -H 'Accept: application/vnd.github.raw'`. Map each label to its role: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, `needs-grilling`. An issue with no triage label has the role `needs-triage`.

Read the repo's labels once with `gh label list --repo OWNER/REPO --json name,description`. Treat each label that means refactor, tech debt, or cleanup as a refactor label.

### Hot spots

When the current directory is a clone of the repo, find the files that bug fixes touched most often in the last 90 days:

```bash
git log --since=90.days --format= --name-only -E -i --grep='^fix' | sort | uniq -c | sort -rn | head -15
```

A file with many fixes is a hot spot. Leave out lock files, changelogs, and generated files. A refactor of a hot spot makes the next fix and the next agent run in that code cheaper. Skip this step when there is no local clone.

## 3. Find the work that is done

First find the issues that are done but still open: a comment says that the work is finished, and lists no open work. A PR with no closing keyword leaves its issue open. A status update that names merged PRs and also lists open work ("Open: ...", "left to do") is not done. Check each PR that a comment names with `gh pr view N --repo OWNER/REPO --json state`, because a comment can be wrong. Report each done issue as one to close, not as work to rank.

A tracking issue with `epic M/M done` is done too: every sub-issue is closed. Report it as one to close, unless its body lists work that has no ticket yet.

## 4. Rank

Ignore drafts, `wontfix` issues, and `needs-info` issues with no reply from the reporter. Rank the rest, best first. Each rank names its next step, which is the skill that the user runs on the item:

1. Unblock a teammate. A team PR that asks for the user's review, or that has no review from the user, or that has new commits since the user's last review. An issue with `asks me` from a team member. The user's issue or PR that blocks an issue that a teammate claimed. Next step for a PR: `/code-review`. Next step for an issue: `/grilling` on it, then one reply with the answers.
2. Merge: a PR that is approved, or the user's own PR with no unresolved threads, when it has green checks and no conflicts. A sole maintainer gets no approval on their own PR. Next step: `merge`, with no session. When the repo's instructions ask for a live run before a merge and the PR shows none: `/field-test`.
3. The user's own work: the user's PR with requested changes or unresolved threads, then the user's ready claims, gates first. Next step for unresolved threads: `/verify-review`.
4. Refactor: an open issue with a refactor label that is free or claimed by the user, and that nothing open blocks. Put first a refactor that is a gate or that touches a hot spot. When no refactor issue touches the top hot spot, name that file as a candidate for `/codebase-design`.
5. Review an outside contributor's PR, with the same conditions as in rank 1. A review request to the user comes first.
6. Implement: a free `ready-for-agent` issue. Free means no assignee, no closing PR, no open `blockedBy` edge or body blocker, and no label whose description says that the fix needs a change in another project. Gates first, then bugs before enhancements, then the oldest issue. Next step: `/implement`, on a new branch. For a bug whose issue names no cause: `/diagnosing-bugs` first.
7. Triage: a `needs-triage` issue, or a `needs-info` issue that has a reply from the reporter after the last maintainer comment. An outside reporter's question that waits for an answer goes here too. Next step: `/triage`. For a feature request from an outside reporter: `/challenge-request`.
8. `ready-for-human`: name it. The user does this work, not an agent.
9. Grill: a `needs-grilling` issue, the maintainer's own parked idea. Next step: `/grill-with-docs`, then `/to-spec`.

Inside one rank, put the oldest PR first (by `created`). A PR that waits for weeks costs its author more than a new one.

A PR with failing checks or conflicts waits on its author, not on the user. Leave it out of ranks 1, 2, and 5, unless the author asked the user for help.

When the user's own claim is blocked, name the blocker and who holds it. A blocked claim is usually a reason to help with its blocker.

## 5. Report

Lead with one line that recommends row 1 and gives its reason. Then one table of at most 12 rows, best first. The user asked where to look, so a row must say what the item is without a click:

```
Next: row 1. Alice has waited 9 days for this review, and her PR blocks #4020.

| # | Repo | Item | Summary | Next | Model |
|---|---|---|---|---|---|
| 1 | acme/app | [PR #4012](url) by alice, team, review requested, 9 d, +340/-80 | Fetches the torrents of one instance in a single batch | `/code-review` | Opus 5.5, high |
| 2 | acme/probe | [#311](url) asks me (bob) | Bob proposes a new schedule for the speed tests | `/grilling` | Fable 5.2, high |
| 3 | acme/app | [PR #4020](url), approved, CI green, +12/-3 | Fixes the wrong ratio in the torrent list | merge | |
```

- **Repo**: leave this column out when the scope is one repo.
- **Item**: the linked number, then the facts that put the item in its rank: the author, team or outside, the age, the size of a PR (`+additions/-deletions`), a gate and what it frees.
- **Summary**: at most 12 words on what changes in the app for the person who uses it. A title that already says this needs no rewrite. Read the body when the title does not.
- **Next**: the next step from step 4.
- **Model**: a Claude model and an effort level for each row that needs a session, from [`references/model-choice.md`](references/model-choice.md). The user runs each row in a new session. Pick Opus for work that a test can prove, and Fable for work that no test can prove, such as a design. Fable costs twice as much as Opus. A row with no session, such as a merge, has an empty cell.

When the user asks for issues to implement, fill the table with up to five free ones from rank 6.

Under the table, list what is not a row. Leave out each empty line:

```
Also:
- Close: #99 (finished in merged PR #117)
- Epics: #100 2/9 done, #140 0/4 done
- Release: 23 commits since v1.14.0 (2026-10-30), 9 of them a fix or a feature. `/release-tag`
- Not shown: 6 to triage, 3 to grill
```

The `Epics` line shows progress only. For the tree of one epic, the user runs `/focus #N`. The `Release` line comes from the `release:` line of the script.

## 6. Start the rows

In T3 Code, the session has the `t3_thread_launch` tool. Read [`references/t3-code.md`](references/t3-code.md) before you print the table. It marks each row that already has a thread, and it starts a thread for each row that the user names with `start 1 3`, then prints the table again with the new threads.

In each other harness, print the commands for each row that writes code, so that the user can run several sessions at once. Each row gets its own worktree:

```
git worktree add ../<repo>-wt-<N> -b fix/<slug> origin/HEAD
/implement <issue URL>
```

## 7. Ask only what changes the answer

Ask after the report, not before, and only when the answer changes the recommendation:

- The best free issue is a gate: should the user claim it? Assign it only on a yes, with `gh issue edit N --repo OWNER/REPO --add-assignee @me`.
- An issue is done but still open: should the user close it? Close it only on a yes, with `gh issue comment N --repo OWNER/REPO --body "Shipped in #X"` and then `gh issue close N --repo OWNER/REPO`, because `gh issue close --comment` on an already-closed issue drops the comment and still exits 0.
