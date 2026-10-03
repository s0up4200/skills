#!/usr/bin/env bash
# Build a scratch repo with every branch and worktree case, run plan.sh and the
# cleanup script it writes, and check what is left. No network: the remote is a
# local bare repo and the PR list is a fixture file.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@example.invalid GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@example.invalid
old="$(date -d '30 days ago' -R)"

git init -q --bare -b main "$tmp/remote.git"
git clone -q "$tmp/remote.git" "$tmp/repo" 2>/dev/null
cd "$tmp/repo"
commit() { echo "$1" >"$1"; git add "$1"; git commit -qm "$1"; }
old_branch() { GIT_COMMITTER_DATE=$old git switch -qc "$1" "${2:-main}"; }

commit base
git push -q origin main
git remote set-head origin main

# merged: fast-forwarded into main.
old_branch merged; commit m1; git switch -q main; git merge -q --ff-only merged; git push -q origin main
# local-old: local only, old, one unique commit. Deleted and flagged.
old_branch local-old; GIT_COMMITTER_DATE=$old commit lo1
# local-recent: local only, new. Kept.
git switch -qc local-recent main; commit lr1
# on-remote: pushed. Kept.
git switch -qc on-remote main; commit or1; git push -q origin on-remote
# squashed: PR #5 merged by squash, tip equals the PR head. Deleted.
old_branch squashed; commit sq1; squashed_tip=$(git rev-parse HEAD)
# squashed-extra: PR #6 merged, then one more local commit. Deleted and flagged.
old_branch squashed-extra; commit se1; se_head=$(git rev-parse HEAD); GIT_COMMITTER_DATE=$old commit se2
# pr-7: checkout of open fork PR #7 with a local review commit. Kept.
old_branch pr-7; commit p7; p7_head=$(git rev-parse HEAD); commit p7-local
# wt-clean: merged branch in a clean worktree with an ignored file. Both removed.
old_branch wt-clean; git switch -q main
# wt-dirty: merged branch in a dirty worktree. Both kept.
old_branch wt-dirty; git switch -q main
# The main worktree's branch is protected even when local only.
git switch -q main
git worktree add -q "$tmp/wt-clean" wt-clean
printf 'node_modules/\n' >>.git/info/exclude
mkdir "$tmp/wt-clean/node_modules"; touch "$tmp/wt-clean/node_modules/x"
git worktree add -q "$tmp/wt-dirty" wt-dirty; echo x >"$tmp/wt-dirty/new-file"
# Detached worktree on a merged commit: removed. Detached with a unique commit: kept.
git worktree add -q --detach "$tmp/det-merged" main
git worktree add -q --detach "$tmp/det-unique" main; (cd "$tmp/det-unique" && commit du1)
# Worktree whose directory is gone: pruned, and its merged branch deleted.
git worktree add -q "$tmp/wt-gone" -b gone-dir main; rm -rf "$tmp/wt-gone"

cat >"$tmp/prs.json" <<EOF
[
  {"state":"MERGED","number":5,"headRefName":"squashed","headRefOid":"$squashed_tip"},
  {"state":"MERGED","number":6,"headRefName":"squashed-extra","headRefOid":"$se_head"},
  {"state":"OPEN","number":7,"headRefName":"fork-feature","headRefOid":"$p7_head"}
]
EOF

plan=$(BRANCH_CLEANUP_PRS="$tmp/prs.json" "$here/plan.sh" 7)
echo "$plan"
fail=0
expect() { grep -qE -- "$1" <<<"$plan" || { echo "FAIL plan: missing /$1/"; fail=1; }; }
expect '^  merged +merged into main$'
expect '^  local-old +not on any remote, older than 7 days +!! 1 commit\(s\) exist only here$'
expect '^  squashed +merged PR #5$'
expect '^  squashed-extra +not on any remote, older than 7 days +!! 1 commit'
expect '^  wt-clean +merged into main$'
expect '^  gone-dir +merged into main$'
expect '^  local-recent +created in the last 7 days$'
expect '^  on-remote +on remote$'
expect '^  pr-7 +open PR #7$'
expect '^  wt-dirty +worktree .*/wt-dirty has local changes'
expect "^  $tmp/wt-clean$"
expect "^  $tmp/det-merged$"
expect "det-unique  \[detached, 1 unmerged commit"
grep -q '^  main ' <<<"$plan" && { echo "FAIL: main listed"; fail=1; }

script=$(sed -n 's/^Cleanup: //p' <<<"$plan")
bash "$script" >/dev/null

left=$(git for-each-ref refs/heads --format='%(refname:lstrip=2)' | sort | tr '\n' ' ')
want="local-recent main on-remote pr-7 wt-dirty "
[[ $left == "$want" ]] || { echo "FAIL branches left: '$left' want '$want'"; fail=1; }
wts=$(git worktree list --porcelain | sed -n 's#^worktree '"$tmp"'/##p' | sort | tr '\n' ' ')
[[ $wts == "det-unique repo wt-dirty " ]] || { echo "FAIL worktrees left: '$wts'"; fail=1; }
backup=$(sed -n 's/^Backup: *//p' <<<"$plan")
grep -q "^squashed	$squashed_tip	merged PR #5$" "$backup" || { echo "FAIL backup row"; fail=1; }

(( fail == 0 )) && echo "PASS"
exit $fail
