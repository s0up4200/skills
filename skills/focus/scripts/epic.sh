#!/usr/bin/env bash
# shellcheck disable=SC2016 # the GraphQL queries hold $variables for gh, not for the shell
# Print one GitHub epic in a compact form for the focus skill.
# Output: the epic title, its body (cut to 6000 characters), then one line
# per sub-issue and per grandchild (grandchildren are indented). A closed
# issue line has only the number, state, and title. An open issue line also
# has the last update, assignees, labels, the OPEN blockedBy and blocking
# edges, and the linked PRs with state, draft, review decision, author, and
# size. Under each open issue are its last 5 comments, each cut to 400
# characters.
# Usage: epic.sh OWNER/REPO NUMBER
set -euo pipefail
# A mise-managed gh wrapper prints status lines to stdout, which breaks jq.
export MISE_QUIET=1

repo=${1:?usage: epic.sh OWNER/REPO NUMBER}
n=${2:?usage: epic.sh OWNER/REPO NUMBER}

gh api graphql -F owner="${repo%%/*}" -F name="${repo#*/}" -F n="$n" -f query='
query($owner:String!,$name:String!,$n:Int!){repository(owner:$owner,name:$name){
  issue(number:$n){title body updatedAt
    subIssues(first:100){nodes{
      number title state updatedAt
      assignees(first:10){nodes{login}} labels(first:20){nodes{name}}
      blockedBy(first:20){nodes{number state}}
      blocking(first:20){nodes{number state}}
      comments(last:5){nodes{author{login} createdAt body}}
      subIssues(first:50){nodes{number title state updatedAt
        assignees(first:5){nodes{login}} labels(first:20){nodes{name}}
        blockedBy(first:10){nodes{number state}} blocking(first:20){nodes{number state}}
        comments(last:5){nodes{author{login} createdAt body}}
        closedByPullRequestsReferences(first:5,includeClosedPrs:true){nodes{
          number state isDraft reviewDecision author{login} additions deletions}}}}
      closedByPullRequestsReferences(first:5,includeClosedPrs:true){nodes{
        number state isDraft reviewDecision author{login} additions deletions}}}}}}}' |
jq -r '
def cut($k): if length > $k then .[:$k] + " [cut]" else . end;
def field($name; $xs): if ($xs | length) > 0 then " | \($name): \($xs | join(" "))" else "" end;
def edges: [.nodes[] | select(.state == "OPEN") | "#\(.number)"];
def prs: [.closedByPullRequestsReferences.nodes[]
  | "PR#\(.number) \(.state)" + (if .isDraft then " draft" else "" end)
    + " \(.reviewDecision // "NO_DECISION") by \(.author.login // "ghost") +\(.additions)/-\(.deletions)"];
def line($in):
  if .state != "OPEN" then "\($in)#\(.number) \(.state) \(.title)" else
  "\($in)#\(.number) \(.state) \(.title) | updated \(.updatedAt[:10])"
  + field("assignees"; [.assignees.nodes[].login])
  + field("labels"; [.labels.nodes[].name])
  + field("blockedBy"; .blockedBy | edges)
  + field("blocking"; .blocking | edges)
  + field("PRs"; prs) end;
def comments($in):
  if .state == "OPEN" then .comments.nodes[]
    | "\($in)  > \(.author.login // "ghost") \(.createdAt[:10]): \(.body | gsub("\\s+"; " ") | cut(400))"
  else empty end;
.data.repository.issue
| "Epic: \(.title) | updated \(.updatedAt[:10])",
  "Body:", (.body | cut(6000)),
  "Sub-issues:",
  (.subIssues.nodes[] | line(""), comments(""), (.subIssues.nodes[] | line("  "), comments("  ")))'
