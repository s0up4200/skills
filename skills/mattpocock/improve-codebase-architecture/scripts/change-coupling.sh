#!/bin/sh
# List the file pairs that change in the same commits.
# Usage: change-coupling.sh [since]   (for example 6.months; no argument reads all history)
# Columns: shared commits, degree, file A, file B. The degree and the limits
# (5 shared commits, commits of 30 files or fewer) follow code-maat.
git log ${1:+--since="$1"} --format='@%h' --name-only | awk '
/^@/ { flush(); n = 0; next }
NF   { f[++n] = $0 }
END  { flush()
       for (p in shared) { split(p, x, SUBSEP)
         if (shared[p] >= 5) printf "%d\t%d%%\t%s\t%s\n", shared[p], 200*shared[p]/(revs[x[1]]+revs[x[2]]), x[1], x[2] } }
function flush(  i, j) {
  if (n > 30) return
  for (i = 1; i <= n; i++) { revs[f[i]]++
    for (j = 1; j <= n; j++) if (f[i] < f[j]) shared[f[i], f[j]]++ } }
' | sort -rn | head -20
