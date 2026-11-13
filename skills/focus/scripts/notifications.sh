#!/usr/bin/env bash
# Print the unread notifications of the last 14 days that can wait on the
# user (a mention, a team mention, a review request, or an assignment), for
# the focus skill. It leaves them unread, and it drops each item that is
# closed or merged, in one state query.
# Line: reason | owner/repo#N | type (Issue, PullRequest, Discussion) | title
# Usage: notifications.sh [OWNER/REPO]   With no repo, it reads all repos.
set -euo pipefail
# A mise-managed gh wrapper prints status lines to stdout, which breaks jq.
export MISE_QUIET=1

path=notifications
[[ -n ${1:-} ]] && path="repos/$1/notifications"
mapfile -t items < <(gh api "$path" --paginate --jq '.[]
  | select(.reason | IN("mention", "team_mention", "review_requested", "assign"))
  | select(.updated_at > (now - 14*86400 | todate))
  | [.reason, .repository.full_name, ((.subject.url // "") | split("/") | last), .subject.type, .subject.title]
  | @tsv')
((${#items[@]} > 0)) || exit 0

query='query{'
for i in "${!items[@]}"; do
  IFS=$'\t' read -r _ repo number type _ <<<"${items[$i]}"
  [[ $number =~ ^[0-9]+$ ]] || continue
  case $type in
    Issue | PullRequest) field="issueOrPullRequest(number:$number){... on Issue{state} ... on PullRequest{state}}" ;;
    Discussion) field="discussion(number:$number){closed}" ;;
    *) continue ;;
  esac
  query+="n$i: repository(owner:\"${repo%%/*}\",name:\"${repo#*/}\"){$field} "
done

# gh exits 1 when one item does not resolve, but still prints the data of
# the others. An item with no state prints, because it may still wait.
result=$(gh api graphql -f query="$query}" 2>/dev/null) || true
closed=$(jq -r '.data // {} | to_entries[]
  | select(.value.issueOrPullRequest.state | IN("CLOSED", "MERGED")) // select(.value.discussion.closed == true)
  | .key[1:]' <<<"$result" 2>/dev/null) || closed=

for i in "${!items[@]}"; do
  grep -qx "$i" <<<"$closed" && continue
  IFS=$'\t' read -r reason repo number type title <<<"${items[$i]}"
  echo "$reason | $repo#$number | $type | $title"
done
