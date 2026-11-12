#!/usr/bin/env bash
# Read the open work of each repo where the current gh user has recent open
# work, for `/focus all`.
# A repo is in scope when an open issue or pull request that involves the user
# (author, assignee, mention, comment, or review request) changed in the last
# DAYS days, the user can push to the repo, the repo is not archived, and the
# skip file does not list it. The skip file is
# ${XDG_CONFIG_HOME:-~/.config}/focus/skip, with one OWNER/REPO on each line.
# Output: one line per repo in scope, most stars first: the repo, its stars,
# its open issues and pull requests, the line count of its open work, and the
# file that holds those lines (the output of open-work.sh). A repo that
# open-work.sh could not read shows "failed" and the file with the error.
# Then one line for the repos that the skip file removed, and one line for the
# repos that the user can only read.
# Usage: all-work.sh [DAYS]   (default 30)
set -euo pipefail
# A mise-managed gh wrapper prints status lines to stdout, which breaks jq.
export MISE_QUIET=1

days=${1:-30}
[[ $days =~ ^[0-9]+$ ]] || { echo "usage: all-work.sh [DAYS]" >&2; exit 2; }
here=$(cd "$(dirname "$0")" && pwd)
# BSD date first (macOS), then GNU date.
since=$(date -u -v-"$days"d +%F 2>/dev/null || date -u -d "$days days ago" +%F)
skip=${XDG_CONFIG_HOME:-$HOME/.config}/focus/skip
out=$(mktemp -d "${TMPDIR:-/tmp}/focus.XXXXXX")

names=$(gh search issues --involves @me --state open --include-prs --updated ">=$since" \
  --limit 1000 --json repository --jq '[.[].repository.nameWithOwner] | unique | .[]')
[[ -n $names ]] || { echo "no open work that involves you changed in the last $days days"; exit 0; }

# One query with an alias per repo reads all of them in one call.
query=$(jq -Rrn '[inputs | split("/")] | to_entries
  | map("r\(.key):repository(owner:\(.value[0] | @json),name:\(.value[1] | @json)){nameWithOwner stargazerCount viewerPermission isArchived issues(states:OPEN){totalCount} pullRequests(states:OPEN){totalCount}}")
  | "{\(join(" "))}"' <<<"$names")

scope=() skipped=() readable=()
while IFS=$'\t' read -r repo stars issues prs access; do
  if [[ -f $skip ]] && grep -qixF -- "$repo" "$skip"; then
    skipped+=("$repo")
  elif [[ $access != push ]]; then
    readable+=("$repo")
  else
    scope+=("$repo")
    echo "$repo | stars $stars | open issues $issues | open PRs $prs" >"$out/${repo//\//_}.head"
  fi
done < <(gh api graphql -f query="$query" --jq '[.data[] | select(. != null and (.isArchived | not))]
  | sort_by(-.stargazerCount, -(.issues.totalCount + .pullRequests.totalCount)) | .[]
  | [.nameWithOwner, .stargazerCount, .issues.totalCount, .pullRequests.totalCount,
     (if .viewerPermission | IN("ADMIN", "MAINTAIN", "WRITE") then "push" else "read" end)] | @tsv')

if ((${#scope[@]} > 0)); then
  # Four repos at a time keep the run under the GitHub limit on parallel requests.
  printf '%s\n' "${scope[@]}" | xargs -P 4 -I{} bash -c \
    'f=$2/${1//\//_}; "$0" "$1" >"$f.txt" 2>"$f.err" || mv "$f.txt" "$f.failed"' \
    "$here/open-work.sh" {} "$out"
  for repo in "${scope[@]}"; do
    f=$out/${repo//\//_}
    if [[ -f $f.failed ]]; then
      echo "$(<"$f.head") | failed, see $f.err"
    else
      echo "$(<"$f.head") | $(wc -l <"$f.txt" | tr -d ' ') lines | $f.txt"
    fi
  done
fi
((${#skipped[@]} == 0)) || echo "skipped by $skip: ${skipped[*]}"
((${#readable[@]} == 0)) || echo "read only: ${readable[*]}"
