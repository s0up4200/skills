#!/usr/bin/env bash
# Print every inline code span and fenced code block line in a Markdown file, one per line, sorted.
# Used before and after the prose passes to prove that no code span was rewritten.
set -euo pipefail
file="${1:?usage: code-spans.sh FILE}"
awk '
  /^```/ { inblock = !inblock; next }
  inblock { print; next }
  { while (match($0, /`[^`]+`/)) { print substr($0, RSTART, RLENGTH); $0 = substr($0, RSTART + RLENGTH) } }
' "$file" | sort -u
