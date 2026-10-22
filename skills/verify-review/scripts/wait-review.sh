#!/usr/bin/env bash
# Wait for the AI reviewers to review a pushed commit, then print who did.
# Usage: wait-review.sh <owner/repo> <pr-number> <head-sha> [minutes]
# <head-sha> can be a short SHA or a ref. The script expands it to the full SHA.
# Run it from the repository root. The host comes from the `origin` remote.
# GitHub: wait for a bot review of <head-sha> from each bot that reviewed an earlier
# commit. After the first one arrives, wait at most 2 more minutes for the rest.
# Forgejo: wait for a forgejo-actions comment that ends with reviewed-sha <head-sha>.
# Prints one reviewer login per line. Exits 1 when no review arrives in time
# (default 20 minutes).
set -euo pipefail
export MISE_QUIET=1
repo="${1:?owner/repo}"; pr="${2:?pr number}"; sha="${3:?head sha}"; minutes="${4:-20}"
sha=$(git rev-parse --verify "$sha^{commit}")
host=$(git remote get-url origin | sed -E 's#^[a-z+]+://([^@/]*@)?##; s#^[^@]*@##; s#[:/].*##')
deadline=$(( $(date +%s) + minutes * 60 ))

github_reviews() {
  # A Codex review with no findings posts no review. Its summary comment marks
  # the commit as Completed instead.
  local codex
  codex=$(gh api --paginate "repos/$repo/issues/$pr/comments" | jq -rs --arg sha "${sha:0:7}" 'add
    | map(select(.body|test("codex-pull-request-review-summary")))
    | if any(.body|test("Completed\\*\\*[^|]*\\| `" + $sha)) then "chatgpt-codex-connector[bot]" else "" end')
  gh api --paginate "repos/$repo/pulls/$pr/reviews" | jq -rs --arg sha "$sha" --arg codex "$codex" 'add
    | map(select((.user.type=="Bot") or (.user.login|test("\\[bot\\]$"))))
    | (map(.user.login) | unique) as $bots
    | (map(select(.commit_id==$sha) | .user.login) + ([$codex] - [""]) | unique) as $done
    | "\($bots|length) \($done|length) \($done|join(","))"'
}

forgejo_review() {
  local token
  token=$(jq -r --arg h "$host" '.hosts[$h].token' ~/.local/share/forgejo-cli/keys.json)
  curl -fsS -H "Authorization: token $token" \
    "https://$host/api/v1/repos/$repo/issues/$pr/comments?limit=50" |
    jq -r --arg sha "$sha" '[.[] | select(.user.login=="forgejo-actions")
      | select(.body|test("reviewed-sha: " + $sha))] | if length>0 then "forgejo-actions" else "" end'
}

while [ "$(date +%s)" -lt "$deadline" ]; do
  if [ "$host" = github.com ]; then
    read -r bots done who <<<"$(github_reviews)"
    if [ "$done" -gt 0 ]; then
      if [ "$done" -ge "$bots" ]; then tr , '\n' <<<"$who"; exit 0; fi
      grace=$(( $(date +%s) + 120 ))
      [ "$grace" -lt "$deadline" ] && deadline=$grace
    fi
  else
    who=$(forgejo_review)
    if [ -n "$who" ]; then echo "$who"; exit 0; fi
  fi
  sleep 30
done
[ -n "${who:-}" ] && { tr , '\n' <<<"$who"; exit 0; }
echo "no review of $sha after waiting" >&2
exit 1
