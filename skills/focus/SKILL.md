---
name: focus
description: Give an overview of large chained work on GitHub (tracking issues with sub-issues and blocked-by dependencies) and recommend where the user should put their focus next. Use when the user types "/focus", or asks "what should I work on next", "where do I focus", "what is free to pick up", "what is blocked", "is my ticket unblocked yet", "status of the epic", "where does the rollout stand", or names a tracking issue such as autobrr/qui#2916 and wants to know its state. Not for a sweep of every open issue for fixed or stale ones, which github-resolution-audit covers, and not for PR merge conflicts, which pr-conflicts covers.
---

# Focus

Answer one question: what should the user work on next? A tracking issue (an "epic") splits a large change into sub-issues. Claims are assignees, and order is GitHub "blocked by" dependencies. Several people work on one epic at the same time, so the answer changes daily. The report replaces a manual click through every sub-issue.

The report is read-only. Do not assign, comment, or edit an issue unless the user asks in this session, because a claim on a shared epic tells the other contributors to stay away.

Requires the `gh` CLI, authenticated.

## 1. Find the scope

- The user named an issue: that issue is the epic.
- The user named a repo, or the current directory is a GitHub repo: find every open epic there.
- Neither: ask which repo. Do not guess. A sweep of every repo the user can see is slow and mostly noise.

Find the open epics in a repo. An epic is an open issue with at least one sub-issue:

```bash
gh api graphql -F owner=OWNER -F name=REPO -f query='
query($owner:String!,$name:String!){repository(owner:$owner,name:$name){
  issues(states:OPEN,first:100,orderBy:{field:UPDATED_AT,direction:DESC}){
    nodes{number title subIssuesSummary{total completed}}}}}' \
  --jq '.data.repository.issues.nodes[]|select(.subIssuesSummary.total>0)'
```

A sub-issue can itself be an epic (in qui, #2902 sits under #2916). Report it inside its parent, not as a second epic.

Get the user's login with `gh api user --jq .login`.

## 2. Read each epic

One query per epic gets the tree, the claims, the edges, and the PRs:

```bash
gh api graphql -F owner=OWNER -F name=REPO -F n=NUMBER -f query='
query($owner:String!,$name:String!,$n:Int!){repository(owner:$owner,name:$name){
  issue(number:$n){title body updatedAt
    subIssues(first:100){nodes{
      number title state updatedAt
      assignees(first:10){nodes{login}}
      blockedBy(first:20){nodes{number state}}
      blocking(first:20){nodes{number state}}
      subIssues(first:50){nodes{number title state assignees(first:5){nodes{login}}
        blockedBy(first:10){nodes{number state}} blocking(first:20){nodes{number state}}
        closedByPullRequestsReferences(first:5){nodes{number state isDraft reviewDecision author{login}}}}}
      closedByPullRequestsReferences(first:5,includeClosedPrs:true){nodes{
        number state isDraft reviewDecision author{login} updatedAt}}}}}}}'
```

Sort the grandchildren like the children. In qui#2916 the main gate, #2906, is a grandchild under #2902.

Read the epic body too. Maintainers write things there that the graph does not hold: "needs a fresh grill", "no spec yet", "owned by X". A body note that contradicts the graph is a finding. Report it, because one of the two is stale.

## 3. Sort every open sub-issue

Put each open sub-issue in exactly one bucket. Check them in this order:

1. **In review**: it has an open PR. Note the author, draft state, and review decision. An approved PR that is not merged is the cheapest progress on the board.
2. **Blocked**: at least one `blockedBy` issue is open. Name the open blockers. Ignore closed ones: GitHub keeps the edge after the blocker closes.
3. **Yours, ready**: assigned to the user, nothing open blocks it.
4. **Others', ready**: assigned to someone else. Note when its last update is older than 14 days. A stale claim is worth a question, not a takeover.
5. **Free**: no assignee, nothing open blocks it.

Then mark two things across the buckets:

- **Gates**: an open issue that blocks two or more others. Count its `blocking` edges that are open. Finishing a gate frees the most work, so it outranks equal work elsewhere.
- **Needs spec**: the epic body or the issue body says the issue needs a spec, a grill, or a design pass. Do not report it as ready to code. The first step is the spec.

## 4. Recommend

Rank what the user can do now, best first:

1. Review or merge an open PR that gates other work. Somebody else waits on it.
2. Finish the user's own ready work, gates first.
3. Unblock somebody else: the user's open PR with requested changes, or the user's issue that blocks a teammate's claim.
4. Pick up free work, gates first, then the issues that need no spec.
5. Spec work: grill or write the spec for a "needs spec" issue, so it becomes free.

When the user's own claim is blocked, say so and name the blocker and who holds it. Say "wait" only when nothing above applies. A blocked claim is usually a reason to help with its blocker.

Give one recommendation and at most two alternatives, each with a one-line reason. The user asked where to look, not for a ranked list of fourteen issues.

## 5. Report

Lead with the recommendation. Then one block per epic:

```
qui#2916 Remote filesystem backend rollout: 2/14 done
  In review: #2906 (PR #2929 by s0up4200, approved), gates #2917 #2918 #2919 #2920
  Yours:     #2902 (1/2 sub-issues done)
  Others:    #2918 com6056 (blocked by #2906), #2930 com6056 (blocked by #2918)
  Free:      #2725 needs spec, #2726 needs spec, #2738, #2792, #2921
  Blocked:   #2917 #2919 #2920 by #2906
  Drift:     body says "#2918 needs a spec", graph shows it claimed
```

Link each number. Leave empty buckets out.

## 6. Ask only what changes the answer

Ask after the report, not before, and only when the answer changes the recommendation:

- More than one epic is open: which one matters most this week?
- The best free issue is a gate: should the user claim it? Assign it only on a yes, with `gh issue edit N --add-assignee @me`.
- A claim by someone else is stale: should the user ask that person, or leave it?
