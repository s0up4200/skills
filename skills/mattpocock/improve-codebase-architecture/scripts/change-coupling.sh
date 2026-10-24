#!/bin/sh
# List the file pairs that change in the same commits.
# Usage: change-coupling.sh [since]   (for example 6.months; no argument reads all history)
# Columns: shared commits, degree, file A, file B. The degree and the limits
# (5 shared commits, commits of 30 files or fewer) follow code-maat.
# Lock files, translation files and generated files count toward the commit
# size but never join a pair, so they do not fill the top 20.
git log ${1:+--since="$1"} --format='@%h' --name-only | awk '
BEGIN { skip = "(^|/)(go\\.sum|[^/]*-lock\\.(json|yaml)|[^/]*\\.lock)$|(^|/)(locales?|translations|generated)/|\\.(gen|pb)\\.|_generated\\.|\\.po$" }
/^@/ { flush(); n = m = 0; next }
NF   { n++; if ($0 !~ skip) f[++m] = $0 }
END  { flush()
       for (p in shared) { split(p, x, SUBSEP)
         if (shared[p] >= 5) printf "%d\t%d%%\t%s\t%s\n", shared[p], 200*shared[p]/(revs[x[1]]+revs[x[2]]), x[1], x[2] } }
function flush(  i, j) {
  if (n > 30) return
  for (i = 1; i <= m; i++) { revs[f[i]]++
    for (j = 1; j <= m; j++) if (f[i] < f[j]) shared[f[i], f[j]]++ } }
' | sort -rn | head -20
