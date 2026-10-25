#!/usr/bin/env bash
# shellcheck disable=SC2016 # the GraphQL queries hold $variables for gh, not for the shell
# Print the open pull requests and issues of a GitHub repo in a compact form,
# for the focus skill.
# PR line: number, title, author, "team" or "outside" (team means an OWNER,
# MEMBER, or COLLABORATOR author), draft, review decision, mergeable, size,
# created date, check state of the last commit, date of the last commit, the
# latest review by the current gh user (state and date, or "none"), "new
# commits since my review", and the requested reviewers ("me" for the user,
# "team:SLUG" for a team).
# Issue line: number, title (cut to 70 characters), assignees, labels, the
# sub-issue progress when the issue is an epic, the parent epic, the OPEN
# blocking and blockedBy edges, last update, "reporter replied" when the
# issue author commented after the last maintainer comment (an OWNER,
# MEMBER, or COLLABORATOR comment among the last 10), "asks me" when a
# comment after the user's last comment mentions the user, and the last
# comment (author, date, cut to 100 characters).
# Usage: open-work.sh OWNER/REPO
set -euo pipefail
# A mise-managed gh wrapper prints status lines to stdout, which breaks jq.
export MISE_QUIET=1

repo=${1:?usage: open-work.sh OWNER/REPO}
owner=${repo%%/*}
name=${repo#*/}
me=$(gh api user --jq .login)

# Pages of 50 keep each query far under the GitHub limit of 500,000 nodes.
gh api graphql --paginate -F owner="$owner" -F name="$name" -F me="$me" -f query='
query($owner:String!,$name:String!,$me:String!,$endCursor:String){repository(owner:$owner,name:$name){
  pullRequests(states:OPEN,first:50,after:$endCursor,orderBy:{field:CREATED_AT,direction:ASC}){
    pageInfo{hasNextPage endCursor}
    nodes{number title author{login} authorAssociation isDraft reviewDecision mergeable createdAt additions deletions
      reviews(author:$me,last:1){nodes{state submittedAt}}
      reviewRequests(first:10){nodes{requestedReviewer{... on User{login} ... on Team{slug}}}}
      commits(last:1){nodes{commit{committedDate statusCheckRollup{state}}}}}}}}' |
jq -r --arg me "$me" '.data.repository.pullRequests.nodes[]
  | (.commits.nodes[0].commit) as $c | (.reviews.nodes[0]) as $r
  | [.reviewRequests.nodes[].requestedReviewer
     | if .login then (if .login == $me then "me" else .login end) elif .slug then "team:\(.slug)" else empty end] as $rq
  | "PR #\(.number) \(.title) | by \(.author.login // "ghost")"
    + (if .authorAssociation | IN("OWNER", "MEMBER", "COLLABORATOR") then " team" else " outside" end)
    + (if .isDraft then " | draft" else "" end)
    + " | \(.reviewDecision // "NO_DECISION") | \(.mergeable) | +\(.additions)/-\(.deletions)"
    + " | created \(.createdAt[:10]) | checks \($c.statusCheckRollup.state // "none")"
    + " | last commit \($c.committedDate[:10])"
    + " | my review \(if $r then "\($r.state) \($r.submittedAt[:10])" else "none" end)"
    + (if $r and $c.committedDate > $r.submittedAt then " | new commits since my review" else "" end)
    + (if ($rq | length) > 0 then " | review requested: \($rq | join(" "))" else "" end)'

gh api graphql --paginate -F owner="$owner" -F name="$name" -f query='
query($owner:String!,$name:String!,$endCursor:String){repository(owner:$owner,name:$name){
  issues(states:OPEN,first:50,after:$endCursor,orderBy:{field:UPDATED_AT,direction:DESC}){
    pageInfo{hasNextPage endCursor}
    nodes{number title author{login} updatedAt
      assignees(first:5){nodes{login}} labels(first:10){nodes{name}} parent{number}
      subIssuesSummary{total completed}
      blocking(first:20){nodes{number state}} blockedBy(first:20){nodes{number state}}
      comments(last:10){nodes{author{login} authorAssociation createdAt body}}}}}}' |
jq -r --arg me "$me" 'def cut($k): if length > $k then .[:$k] + "[cut]" else . end;
def edges($name): [.nodes[] | select(.state == "OPEN") | "#\(.number)"]
  | if length > 0 then " | \($name): \(join(" "))" else "" end;
.data.repository.issues.nodes[]
  | .author.login as $op | .comments.nodes as $cs
  | ([$cs[] | select(.authorAssociation | IN("OWNER", "MEMBER", "COLLABORATOR")) | .createdAt] | max) as $maint
  | ([$cs[] | select(.author.login == $op) | .createdAt] | max) as $rep
  | ([$cs[] | select(.author.login == $me) | .createdAt] | max) as $mine
  | [$cs[] | select(.author.login != $me and ($mine == null or .createdAt > $mine)
      and (.body | test("@" + $me + "\\b"; "i")))][-1] as $ask
  | ($cs[-1]) as $last
  | "#\(.number) \(.title | cut(70))"
    + (if (.assignees.nodes | length) > 0 then " | assignees: \([.assignees.nodes[].login] | join(" "))" else "" end)
    + (if (.labels.nodes | length) > 0 then " | labels: \([.labels.nodes[].name] | join(" "))" else "" end)
    + (if .subIssuesSummary.total > 0 then " | epic \(.subIssuesSummary.completed)/\(.subIssuesSummary.total) done" else "" end)
    + (if .parent then " | epic #\(.parent.number)" else "" end)
    + (.blocking | edges("blocking")) + (.blockedBy | edges("blockedBy"))
    + " | updated \(.updatedAt[:10])"
    + (if $ask then " | asks me (\($ask.author.login // "ghost") \($ask.createdAt[:10]))" else "" end)
    + (if $maint and $rep and $rep > $maint then " | reporter replied" else "" end)
    + (if $last then " | last: \($last.author.login // "ghost") \($last.createdAt[:10]): "
        + ($last.body | gsub("\\s+"; " ") | cut(100))
       else "" end)'
