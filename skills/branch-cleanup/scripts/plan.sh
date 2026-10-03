#!/usr/bin/env bash
# Usage: plan.sh [days]. Plans only; see SKILL.md for the rules and output files.
# BRANCH_CLEANUP_PRS=<file> replaces `gh pr list` with a JSON fixture (test seam).
# The pull/N/head fetch below stays: merged fork-PR heads are often not local.
set -eo pipefail

days=${1:-7}
days=${days%d}
[[ $days =~ ^[0-9]+$ ]] || { echo "days must be a number, got '$1'" >&2; exit 2; }

top=$(git rev-parse --path-format=absolute --git-common-dir)
main_wt=$(git worktree list --porcelain | awk 'NR==1{print $2}')
cd "$main_wt"

git fetch --all --prune --quiet || echo "warning: fetch failed, remote refs may be stale" >&2

main_branch=$(git branch --show-current)

# Default branch and the ref that counts as "merged".
default=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##') || true
if [[ -z $default ]]; then
  for c in main master develop; do
    git show-ref --quiet "refs/remotes/origin/$c" && { default=$c; break; }
  done
fi
[[ -n $default ]] || default=$main_branch
base=refs/heads/$default
git show-ref --quiet "refs/remotes/origin/$default" && base=refs/remotes/origin/$default

# Every branch name that exists on any remote.
declare -A on_remote
while read -r r; do on_remote[${r#*/}]=1; done < <(git for-each-ref refs/remotes --format='%(refname:lstrip=2)' | grep -v '/HEAD$')

# PRs, GitHub only. Lines: state number headRefName headRefOid
prs=""
if [[ -n ${BRANCH_CLEANUP_PRS:-} ]]; then
  prs=$(jq -r '.[]|"\(.state) \(.number) \(.headRefName) \(.headRefOid)"' "$BRANCH_CLEANUP_PRS")
elif git remote get-url origin 2>/dev/null | grep -q 'github\.com' && command -v gh >/dev/null; then
  prs=$(gh pr list --state all --limit 5000 --json state,number,headRefName,headRefOid \
    --jq '.[]|"\(.state) \(.number) \(.headRefName) \(.headRefOid)"') || echo "warning: gh pr list failed, PR rules skipped" >&2
fi

# PR rows that belong to a branch: same head name, a pr-N / prN name, or the same tip.
prs_for() {
  local b=$1 tip=$2 n=""
  [[ $b =~ ^pr-?([0-9]+)(-.*)?$ ]] && n=${BASH_REMATCH[1]}
  [[ -n $prs ]] || return 0
  awk -v b="$b" -v n="$n" -v t="$tip" '$3==b || $2==n || $4==t' <<<"$prs"
}

# Tip creation time: oldest reflog entry, else the tip's commit date.
created() {
  local t
  t=$(git reflog show --date=unix --format=%gd "refs/heads/$1" 2>/dev/null | tail -1 | grep -o '[0-9]\{9,\}') || true
  [[ -n $t ]] || t=$(git log -1 --format=%ct "refs/heads/$1")
  echo "$t"
}

cutoff=$(( $(date +%s) - days * 86400 ))

declare -A del_reason del_flag keep_reason tips
merged_tips=()

while read -r b; do
  tip=$(git rev-parse "refs/heads/$b")
  tips[$b]=$tip
  if [[ $b == "$default" || $b == main || $b == master || $b == develop || $b == "$main_branch" ]]; then
    keep_reason[$b]="protected"; continue
  fi
  if [[ -n ${on_remote[$b]:-} ]]; then keep_reason[$b]="on remote"; continue; fi

  rows=$(prs_for "$b" "$tip")
  open=$(awk '$1=="OPEN"{print "#"$2; exit}' <<<"$rows")
  if [[ -n $open ]]; then keep_reason[$b]="open PR $open"; continue; fi

  if git merge-base --is-ancestor "$tip" "$base"; then
    del_reason[$b]="merged into $default"; merged_tips+=("$tip"); continue
  fi

  merged_pr="" pr_heads=()
  while read -r st n _ oid; do
    [[ $st == MERGED || $st == CLOSED ]] || continue
    git cat-file -e "$oid^{commit}" 2>/dev/null || git fetch --quiet origin "pull/$n/head" 2>/dev/null || true
    git cat-file -e "$oid^{commit}" 2>/dev/null || continue
    pr_heads+=("$oid")
    if [[ $st == MERGED ]] && git merge-base --is-ancestor "$tip" "$oid"; then
      merged_pr="#$n"; merged_tips+=("$oid"); break
    fi
  done <<<"$rows"
  if [[ -n $merged_pr ]]; then del_reason[$b]="merged PR $merged_pr"; continue; fi

  if (( $(created "$b") >= cutoff )); then keep_reason[$b]="created in the last $days days"; continue; fi

  del_reason[$b]="not on any remote, older than $days days"
  # Commits in a PR head are on GitHub even when no remote branch holds them.
  unpushed=$(git rev-list --count "$tip" --not --remotes "$base" "${pr_heads[@]}")
  (( unpushed > 0 )) && del_flag[$b]="$unpushed commit(s) exist only here"
done < <(git for-each-ref refs/heads --format='%(refname:lstrip=2)')

# Worktrees. A dirty worktree keeps its branch: git cannot delete a checked-out branch.
wt_remove=() wt_keep=()
while IFS=$'\t' read -r path head branch locked; do
  [[ $path == "$main_wt" ]] && continue
  [[ -d $path ]] || continue  # missing dirs go to `git worktree prune`
  dirty=$(git -C "$path" status --porcelain 2>/dev/null | head -5)
  if [[ -n $branch ]]; then
    [[ -n ${del_reason[$branch]:-} ]] || continue
    if [[ -n $locked || -n $dirty ]]; then
      keep_reason[$branch]="worktree $path has local changes or is locked"
      unset 'del_reason[$branch]' 'del_flag[$branch]'
      wt_keep+=("$path  [$branch] ${locked:+locked }${dirty:+$'\n'$(sed 's/^/      /' <<<"$dirty")}")
    else
      wt_remove+=("$path")
    fi
  else
    left=$(git rev-list --count "$head" --not --remotes "$base" "${merged_tips[@]}")
    if [[ -n $locked || -n $dirty || $left -gt 0 ]]; then
      wt_keep+=("$path  [detached, $left unmerged commit(s)] ${locked:+locked }${dirty:+$'\n'$(sed 's/^/      /' <<<"$dirty")}")
    else
      wt_remove+=("$path")
    fi
  fi
done < <(git worktree list --porcelain | awk '
  /^worktree /{p=substr($0,10); h=""; b=""; l=""}
  /^HEAD /{h=$2}
  /^branch /{b=substr($2,12)}
  /^locked/{l="1"}
  /^$/{if(p!="") printf "%s\t%s\t%s\t%s\n", p, h, b, l; p=""}
  END{if(p!="") printf "%s\t%s\t%s\t%s\n", p, h, b, l}')

# Write the backup and the cleanup script.
out=$top/branch-cleanup
mkdir -p "$out"
stamp=$(date +%Y-%m-%dT%H%M%S)
backup=$out/$stamp.tsv
script=$out/$stamp-cleanup.sh
: >"$backup"
{
  echo "#!/usr/bin/env bash"
  echo "# Generated by branch-cleanup plan.sh. Backup: $backup"
  echo "# Restore a branch: git branch <name> <sha>"
  printf 'cd %q || exit 1\n' "$main_wt"
  echo "git worktree prune"
  for p in "${wt_remove[@]}"; do
    printf 'git worktree remove %q && echo "removed worktree %s"\n' "$p" "$p"
  done
  for b in $(printf '%s\n' "${!del_reason[@]}" | sort); do
    printf '%s\t%s\t%s\n' "$b" "${tips[$b]}" "${del_reason[$b]}" >>"$backup"
    # Delete only if the branch has not moved since the plan.
    printf '[ "$(git rev-parse -q --verify refs/heads/%q)" = %s ] && git branch -D %q >/dev/null && echo "deleted %s" || echo "skipped %s (moved or checked out)"\n' \
      "$b" "${tips[$b]}" "$b" "$b" "$b"
  done
} >"$script"
chmod +x "$script"

# Report.
echo "Repo: $main_wt   default: $default   window: $days days"
echo
echo "DELETE branches (${#del_reason[@]}):"
for b in $(printf '%s\n' "${!del_reason[@]}" | sort); do
  printf '  %-50s %s%s\n' "$b" "${del_reason[$b]}" "${del_flag[$b]:+   !! ${del_flag[$b]}}"
done
echo
echo "REMOVE worktrees (${#wt_remove[@]}):"
for p in "${wt_remove[@]}"; do echo "  $p"; done
echo
echo "KEEP branches:"
for b in $(printf '%s\n' "${!keep_reason[@]}" | sort); do
  [[ ${keep_reason[$b]} == protected ]] && continue
  printf '  %-50s %s\n' "$b" "${keep_reason[$b]}"
done
if (( ${#wt_keep[@]} )); then
  echo
  echo "KEEP worktrees:"
  for w in "${wt_keep[@]}"; do echo "  $w"; done
fi
echo
echo "Backup:  $backup"
echo "Cleanup: $script"
