# Epic report

Read this file when the user names an epic (a tracking issue with sub-issues) or asks for the state of one. The report shows the tree of the epic, who claimed each sub-issue, and what blocks what.

Forgejo has no sub-issues. A tracking issue there lists its children as a task list in its body (`- [ ] #12`), so read the body to build the tree. Forgejo has "blocked by" dependencies, but `fj` cannot show them. When the body or the comments do not name the blockers, say that the blocked bucket is incomplete, and leave the edges out. Then sort and report as in steps 2 to 4.

## 1. Read the epic

One script call gets the tree, the claims, the edges, the PRs, and the last comments:

```bash
<skill base directory>/scripts/epic.sh OWNER/REPO NUMBER
```

The base directory is printed when the skill loads. The script prints the epic body, cut to 6000 characters. Then it prints one line per sub-issue, with the grandchildren indented under it. A closed issue shows only its number, state, and title. An open issue also shows its last update, assignees, labels, the open `blockedBy` and `blocking` edges, and the linked PRs. Under each open issue are its last 5 comments, each cut to 400 characters. If a cut comment or body hides a fact that you need, read that issue with `gh issue view N`.

Sort the grandchildren like the children. A gate can be a grandchild, so count its edges too.

Read the last comments on each open sub-issue. A PR with no closing keyword leaves its issue open, so the graph shows shipped work as free. Often only a comment says that the work shipped.

Read the epic body too. Maintainers write things there that the graph does not hold: "needs a fresh grill", "no spec yet", "owned by X". A body note that contradicts the graph is a finding. Report it, because one of the two is stale.

## 2. Sort every open sub-issue

Put each open sub-issue in exactly one bucket. Check them in this order:

1. **Done, still open**: a linked PR is merged, or a comment says that the work is finished. Read the whole comment. A status update often names merged PRs and still lists open work ("Open: ...", "left to do", a date to check back). That issue is not done: sort it into the next buckets, and note the open item and its date. Check each PR that a comment names with `gh pr view N --json state`, because a comment can be wrong. Report a done issue as one to close. It is not work.
2. **In review**: it has an open PR. Note the author, draft state, review decision, and size (`+additions/-deletions`). An approved PR that is not merged is the cheapest progress on the board.
3. **Blocked**: at least one `blockedBy` issue is open. Name the open blockers. Ignore closed ones: GitHub keeps the edge after the blocker closes.
4. **Yours, ready**: assigned to the user, nothing open blocks it.
5. **Others', ready**: assigned to someone else. Note when its last update is older than 14 days. A stale claim is worth a question, not a takeover.
6. **Free**: no assignee, nothing open blocks it.

Then mark two things across the buckets:

- **Gates**: an open issue that blocks two or more others. Count its `blocking` edges that are open. Finishing a gate frees the most work, so it outranks equal work elsewhere.
- **Needs spec**: the epic body, the issue body, or a label says the issue needs a spec, a grill, or a design pass. Read the repo's labels once with `gh label list --json name,description`, and treat each label that means spec, grill, design, or RFC as "needs spec". Do not report it as ready to code. The first step is the spec.

## 3. Recommend

Rank what the user can do now, best first:

1. Review or merge an open PR that gates other work. Somebody else waits on it.
2. Finish the user's own ready work, gates first.
3. Unblock somebody else: the user's open PR with requested changes, or the user's issue that blocks a teammate's claim.
4. Pick up free work, gates first, then the issues that need no spec.
5. Spec work: grill or write the spec for a "needs spec" issue, so it becomes free.

When two PRs have the same rank, put a team member's PR before an outside contributor's PR, as in the main ranking of `SKILL.md`. Then put the older one first (by `createdAt`). A PR that waits for weeks costs its author more than a new one.

When the user's own claim is blocked, say so and name the blocker and who holds it. Say "wait" only when nothing above applies. A blocked claim is usually a reason to help with its blocker.

Give one recommendation and at most two alternatives, each with a one-line reason. The user asked where to look, not for a ranked list of fourteen issues.

## 4. Report

Lead with the recommendation. Then one block per epic:

```
owner/repo#100 Example epic title: 2/9 done
  Done:      #103 (comment: finished in merged PRs #118 #119), close it
  In review: #104 (PR #120 by alice, approved, +210/-40), gates #105 #106 #107
  Yours:     #102 (1/2 sub-issues done)
  Others:    #106 bob (blocked by #104), #108 bob (blocked by #106)
  Free:      #110 needs spec, #111
  Blocked:   #105 #107 by #104
  Drift:     body says "#106 needs a spec", graph shows it claimed
```

Link each number. Leave empty buckets out.

## 5. Ask only what changes the answer

Ask after the report, not before, and only when the answer changes the recommendation:

- More than one epic is open: which one matters most this week?
- The best free issue is a gate: should the user claim it? Assign it only on a yes, with `gh issue edit N --add-assignee @me`.
- A claim by someone else is stale: should the user ask that person, or leave it?
- An issue is done but still open: should the user close it? Close it only on a yes, with `gh issue comment N --body "Shipped in #X"` and then `gh issue close N`, because `gh issue close --comment` on an already-closed issue drops the comment and still exits 0.
