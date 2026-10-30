#!/usr/bin/env bash
# Wait for news on a pushed commit of a pull request, then print one line per event.
# Usage: wait-review.sh <owner/repo> <pr-number> <head-sha> [minutes]
# <head-sha> can be a short SHA or a ref. The script expands it to the full SHA.
# Run it from the repository root. The host comes from the `origin` remote.
# GitHub events:
#   review <login>             a bot reviewed <head-sha>. The script waits for a review
#                              from each bot that reviewed an earlier commit, and for
#                              each bot review check on <head-sha> to finish. After
#                              that, if a bot has not reviewed yet, it waits at most 2
#                              more minutes for it.
#   check-failed <name> <url>  a check that is not a bot review failed on <head-sha>
#   conflict <head-sha>        the branch conflicts with its base branch
#   comment <login> <url>      a person other than you commented or reviewed after the
#                              first wait on this pull request
# The script reports each check-failed, conflict, and comment event once per pull
# request (a conflict once per head). It keeps the reported events in
# ~/.local/state/wait-review/, so a wait that starts again skips them.
# Forgejo: prints `review forgejo-actions` when a forgejo-actions comment ends with
# reviewed-sha <head-sha>.
# Exits 0 after the first poll that finds an event. Exits 1 when no event arrives in
# time (default 20 minutes).
set -euo pipefail
export MISE_QUIET=1
repo="${1:?owner/repo}"; pr="${2:?pr number}"; sha="${3:?head sha}"; minutes="${4:-20}"
sha=$(git rev-parse --verify "$sha^{commit}")
host=$(git remote get-url origin | sed -E 's#^[a-z+]+://([^@/]*@)?##; s#^[^@]*@##; s#[:/].*##')
deadline=$(( $(date +%s) + minutes * 60 ))
state="$HOME/.local/state/wait-review/${repo//\//_}-$pr"
mkdir -p "${state%/*}"
[ -s "$state" ] || date -u +%Y-%m-%dT%H:%M:%SZ >"$state"
start=$(head -1 "$state")
bot_checks='greptile|macroscope|coderabbit|codex|copilot|gemini|claude'
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

github_fetch() {
  gh api --paginate "repos/$repo/issues/$pr/comments" | jq -s 'add // []' >"$tmp/issue.json"
  gh api --paginate "repos/$repo/pulls/$pr/comments" | jq -s 'add // []' >"$tmp/inline.json"
  gh api --paginate "repos/$repo/pulls/$pr/reviews" | jq -s 'add // []' >"$tmp/reviews.json"
  gh api "repos/$repo/commits/$sha/check-runs?per_page=100" >"$tmp/checks.json"
  gh api "repos/$repo/pulls/$pr" >"$tmp/pr.json"
}

github_reviews() {
  # A Codex review with no findings posts no review. Its summary comment marks
  # the commit as Completed instead.
  local codex
  codex=$(jq -r --arg sha "${sha:0:7}" '
    map(select(.body|test("codex-pull-request-review-summary")))
    | if any(.body|test("Completed\\*\\*[^|]*\\| `" + $sha)) then "chatgpt-codex-connector[bot]" else "" end' "$tmp/issue.json")
  # A bot that answers a reply in a thread also makes a review of the head, with
  # no body and only reply comments. Count a review only when it has a body or
  # a comment that starts a thread.
  local starts
  starts=$(jq -c 'map(select(.in_reply_to_id==null) | .pull_request_review_id) | unique' "$tmp/inline.json")
  jq -r --arg sha "$sha" --arg codex "$codex" --argjson starts "$starts" '
    map(select((.user.type=="Bot") or (.user.login|test("\\[bot\\]$"))))
    | map(select(.body!="" or (.id as $id | $starts | index($id))))
    | (map(.user.login) + ([$codex] - [""]) | unique) as $bots
    | (map(select(.commit_id==$sha) | .user.login) + ([$codex] - [""]) | unique) as $done
    | "\($bots|length) \($done|length) \($done|join(","))"' "$tmp/reviews.json"
}

github_events() {
  jq -r --arg bots "$bot_checks" '.check_runs[]
    | select(.conclusion=="failure" or .conclusion=="timed_out" or .conclusion=="startup_failure")
    | select(.name|test($bots;"i")|not)
    | "check-failed \(.name) \(.html_url)"' "$tmp/checks.json"
  jq -r --arg sha "$sha" 'select(.mergeable_state=="dirty") | "conflict \($sha)"' "$tmp/pr.json"
  jq -rn --arg me "$me" --arg since "$start" \
    --slurpfile i "$tmp/issue.json" --slurpfile c "$tmp/inline.json" --slurpfile r "$tmp/reviews.json" '
    [($i[0][], $c[0][] | {user, at:.created_at, url:.html_url}),
     ($r[0][] | {user, at:.submitted_at, url:.html_url})]
    | map(select(.at != null and .at >= $since and .user.login != $me
        and .user.type != "Bot" and (.user.login|test("\\[bot\\]$")|not)))
    | .[] | "comment \(.user.login) \(.url)"'
}

forgejo_review() {
  local token
  token=$(jq -r --arg h "$host" '.hosts[$h].token' ~/.local/share/forgejo-cli/keys.json)
  curl -fsS -H "Authorization: token $token" \
    "https://$host/api/v1/repos/$repo/issues/$pr/comments?limit=50" |
    jq -r --arg sha "$sha" '[.[] | select(.user.login=="forgejo-actions")
      | select(.body|test("reviewed-sha: " + $sha))] | if length>0 then "forgejo-actions" else "" end'
}

print_reviews() { [ -n "${who:-}" ] && tr , '\n' <<<"$who" | sed 's/^/review /'; }

[ "$host" = github.com ] && me=$(gh api user --jq .login)
while [ "$(date +%s)" -lt "$deadline" ]; do
  if [ "$host" = github.com ]; then
    github_fetch
    # Drop the events that an earlier poll or run reported, then record the rest.
    events=$(github_events | grep -vxF -f <(tail -n +2 "$state") || true)
    [ -z "$events" ] || echo "$events" >>"$state"
    read -r bots reviewed who <<<"$(github_reviews)"
    # A review check that still runs on the head means that bot is not done.
    pending=$(jq --arg bots "$bot_checks" '[.check_runs[]
      | select(.status!="completed" and (.name|test($bots;"i")))] | length' "$tmp/checks.json")
    if [ -n "$events" ]; then echo "$events"; print_reviews || true; exit 0; fi
    if [ "$reviewed" -gt 0 ] && [ "$pending" -eq 0 ]; then
      if [ "$reviewed" -ge "$bots" ]; then print_reviews; exit 0; fi
      grace=$(( $(date +%s) + 120 ))
      [ "$grace" -lt "$deadline" ] && deadline=$grace
    fi
  else
    who=$(forgejo_review)
    if [ -n "$who" ]; then print_reviews; exit 0; fi
  fi
  sleep 30
done
print_reviews && exit 0
echo "no event on $sha after waiting" >&2
exit 1
