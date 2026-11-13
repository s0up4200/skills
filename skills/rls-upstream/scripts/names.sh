#!/usr/bin/env bash
# Prints the release names that a Go repository's tests use, one per line,
# for parse-diff.sh. It reads the quoted strings in *_test.go under the
# given directories and keeps the ones shaped like a release name. Some
# noise gets through; it only adds rows to the diff.
#
# Usage: names.sh <dir> [dir ...] > names.txt
set -euo pipefail

if (($# == 0)); then
  echo "usage: $0 <dir> [dir ...]" >&2
  exit 2
fi

grep -rhoE --include='*_test.go' '"[^"]{8,}"' "$@" |
  tr -d '"' |
  grep -E '^[^ ]*([. _][^. _]+){2,}' |
  grep -E '(S[0-9]{2}|[12][0-9]{3}|[0-9]{3,4}p|-[A-Za-z0-9]+$|^\[)' |
  grep -vE '(://|^magnet:|/|\\|\(#[0-9]+\)|^\[?[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|\.(go|json|mkv|mp4|nfo|srt|rar|torrent|txt|flac|epub)$)' |
  sort -u
