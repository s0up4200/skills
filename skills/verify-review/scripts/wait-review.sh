#!/usr/bin/env bash
# Watch a pushed commit of a pull request, and print one line per event as it arrives.
# Usage: wait-review.sh <owner/repo> <pr-number> <head-sha> [minutes]
# <head-sha> can be a short SHA or a ref. The script expands it to the full SHA.
# Run it from the repository root. The host comes from the `origin` remote.
# Run it under a monitor that makes each stdout line a notification (the Monitor tool in
# Claude Code).
# GitHub events:
#   review <bot> <sha7>        a bot reviewed <head-sha>, or the Codex summary marks it
#                              Completed. <bot> is greptile, macroscope, coderabbit, codex,
#                              copilot, gemini, or claude.
#   check-failed <name> <url>  a check that is not a bot review failed on <head-sha>.
#                              One line per check name, with its latest failed run.
#   comment <login> <url>      a person other than you commented or reviewed after the
#                              first wait on this pull request
#   conflict <head-sha>        the branch conflicts with its base branch. The script exits.
#   done <sha7>                each bot finished on <head-sha>, and the script exits. A bot
#                              finishes when it reviews the head or when its review checks
#                              complete, because a clean re-review posts no review. The
#                              script expects each bot that reviewed an earlier commit
#                              (Greptile only after it reviewed two commits, because a repo
#                              can set it to review only when the pull request opens). When
#                              no review check still runs, it waits at most 2 more minutes
#                              for a bot with no check, such as Codex or Copilot.
#   timeout <sha7>             no bot finished on <head-sha> in time (default 20 minutes)
# The script reports each event once per pull request (a conflict and a review once per
# head). It keeps the reported events in ~/.local/state/wait-review/, so a wait that
# starts again skips them. It exits 0 without a line when a newer commit replaces
# <head-sha>, because the wait after that push watches the new head.
# Forgejo: prints `review forgejo-actions` when a forgejo-actions comment ends with
# reviewed-sha <head-sha>, and exits.
# Exits 0 after done or conflict. Exits 1 after timeout.
set -euo pipefail
export MISE_QUIET=1
repo="${1:?owner/repo}"; pr="${2:?pr number}"; sha="${3:?head sha}"; minutes="${4:-20}"
sha=$(git rev-parse --verify "$sha^{commit}")
short=${sha:0:7}
host=$(git remote get-url origin | sed -E 's#^[a-z+]+://([^@/]*@)?##; s#^[^@]*@##; s#[:/].*##')
deadline=$(( $(date +%s) + minutes * 60 ))
state="$HOME/.local/state/wait-review/${repo//\//_}-$pr"
mkdir -p "${state%/*}"
[ -s "$state" ] || date -u +%Y-%m-%dT%H:%M:%SZ >"$state"
start=$(head -1 "$state")
bot_re='greptile|macroscope|coderabbit|codex|copilot|gemini|claude'
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

github_fetch() {
  gh api --paginate "repos/$repo/issues/$pr/comments" | jq -s 'add // []' >"$tmp/issue.json"
  gh api --paginate "repos/$repo/pulls/$pr/comments" | jq -s 'add // []' >"$tmp/inline.json"
  gh api --paginate "repos/$repo/pulls/$pr/reviews" | jq -s 'add // []' >"$tmp/reviews.json"
  gh api "repos/$repo/commits/$sha/check-runs?per_page=100" >"$tmp/checks.json"
  gh api "repos/$repo/pulls/$pr" >"$tmp/pr.json"
}

# One JSON object: expected (bots that reviewed an earlier commit), reviewed (bots that
# reviewed the head), checked (bots whose review checks on the head all completed), and
# pending (review checks on the head that still run).
github_bots() {
  # A bot that answers a reply in a thread also makes a review of the head, with no
  # body and only reply comments. Count a review only when it has a body or a comment
  # that starts a thread.
  local starts
  starts=$(jq -c 'map(select(.in_reply_to_id==null) | .pull_request_review_id) | unique' "$tmp/inline.json")
  jq -n --arg sha "$sha" --arg re "$bot_re" --argjson starts "$starts" \
    --slurpfile r "$tmp/reviews.json" --slurpfile i "$tmp/issue.json" --slurpfile c "$tmp/checks.json" '
    def bot: ascii_downcase | first(match($re).string) // empty;
    ($r[0] | map(select((.user.type=="Bot") or (.user.login|test("\\[bot\\]$")))
      | select(.body!="" or (.id as $id | $starts | index($id))))) as $rv
    | ($rv | map(select(.user.login|test("greptile")) | .commit_id) | unique | length > 1) as $greptile
    # A Codex review with no findings posts no review. Its summary comment marks the
    # commit as Completed instead.
    | ([$i[0][] | select(.body|test("codex-pull-request-review-summary"))
        | select(.body|test("Completed\\*\\*[^|]*\\| `" + $sha[0:7]))] | if length > 0 then ["codex"] else [] end) as $codex
    | ($c[0].check_runs | map(select(.name|test($re;"i")) | {bot: (.name|bot), done: (.status=="completed")})) as $bc
    | {expected: ([$rv[] | .user.login | bot | select(. != "greptile" or $greptile)] | unique),
       reviewed: (([$rv[] | select(.commit_id==$sha) | .user.login | bot] + $codex) | unique),
       checked: [$bc | group_by(.bot)[] | select(all(.done)) | .[0].bot],
       pending: ([$bc[] | select(.done|not)] | length)}'
}

github_events() {
  # Each event, such as a new label, starts another run of a check on the same head.
  jq -r --arg bots "$bot_re" '[.check_runs[]
    | select(.conclusion=="failure" or .conclusion=="timed_out" or .conclusion=="startup_failure")
    | select(.name|test($bots;"i")|not)]
    | group_by(.name) | map(max_by(.id)) | .[]
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

[ "$host" = github.com ] && me=$(gh api user --jq .login)
finished=0 streak=0
while [ "$(date +%s)" -lt "$deadline" ]; do
  if [ "$host" = github.com ]; then
    github_fetch
    if [ "$(jq -r .head.sha "$tmp/pr.json")" != "$sha" ]; then
      echo "a newer commit replaced $short, so this wait ends" >&2
      exit 0
    fi
    bots=$(github_bots)
    # Drop the lines that an earlier poll or run reported, then record the rest.
    lines=$({ github_events; jq -r --arg s "$short" '.reviewed[] | "review \(.) \($s)"' <<<"$bots"; } |
      grep -vxF -f <(tail -n +2 "$state") || true)
    if [ -n "$lines" ]; then
      echo "$lines" >>"$state"
      echo "$lines"
      grep -q '^conflict ' <<<"$lines" && exit 0
    fi
    read -r pending finished missing <<<"$(jq -r '[.pending, ((.reviewed + .checked) | unique | length),
      ((.expected - .reviewed - .checked) | length)] | @tsv' <<<"$bots")"
    if [ "$pending" -eq 0 ] && [ "$finished" -gt 0 ]; then
      if [ "$missing" -eq 0 ]; then
        # A bot posts its review a few seconds before its check completes. One more poll
        # catches a review that lands in between.
        streak=$((streak + 1))
        [ "$streak" -ge 2 ] && { echo "done $short"; exit 0; }
      else
        streak=0
        grace=$(( $(date +%s) + 120 ))
        [ "$grace" -lt "$deadline" ] && deadline=$grace
      fi
    else
      streak=0
    fi
  else
    who=$(forgejo_review)
    if [ -n "$who" ]; then echo "review $who"; exit 0; fi
  fi
  sleep 30
done
[ "$finished" -gt 0 ] && { echo "done $short"; exit 0; }
echo "timeout $short"
exit 1
