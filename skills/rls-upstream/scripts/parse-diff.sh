#!/usr/bin/env bash
# Parses the same release names with two versions of github.com/autobrr/rls
# and prints each name whose exported Release fields differ.
#
# Usage: parse-diff.sh <workdir> <old-version> <new-version> < names.txt
#
# A version is anything `go get` accepts: a tag (v0.10.0), a pseudo-version
# from go.mod, or a commit hash. Names come from standard input, one per line.
# The output is one block per changed name: the name, then the fields that
# differ, with - for the old value and + for the new one. A field that is
# empty in both versions, or exists in only one and is empty there, is left
# out. The last line counts the names and the changes.
# Methods on Release (Absolute, Event, and the like) are not in the JSON.
set -euo pipefail

if (($# != 3)); then
  echo "usage: $0 <workdir> <old-version> <new-version> < names.txt" >&2
  exit 2
fi
work=$1 old=$2 new=$3
mkdir -p "$work"
names="$work/names.txt"
grep -v '^[[:space:]]*$' >"$names" || true

build() {
  local dir=$1 version=$2
  rm -rf "$dir"
  mkdir -p "$dir"
  cat >"$dir/main.go" <<'GO'
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"

	"github.com/autobrr/rls"
)

func main() {
	in := bufio.NewScanner(os.Stdin)
	in.Buffer(make([]byte, 1<<20), 1<<20)
	for in.Scan() {
		r := rls.ParseString(in.Text())
		b, err := json.Marshal(r)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		fmt.Println(string(b))
	}
}
GO
  (
    cd "$dir"
    go mod init parsediff >/dev/null 2>&1
    go get "github.com/autobrr/rls@$version" 2>get.log || { cat get.log >&2; exit 1; }
    go build -o parse .
  )
}

build "$work/old" "$old"
build "$work/new" "$new"
"$work/old/parse" <"$names" >"$work/old.jsonl"
"$work/new/parse" <"$names" >"$work/new.jsonl"

# fields prints one "Key: value" line per field that is set, so that a field
# one version lacks and the other leaves empty does not count as a change.
fields() {
  jq -r 'to_entries[]
    | select(.value != null and .value != "" and .value != 0
        and .value != false and .value != [])
    | "\(.key): \(.value | tojson)"' <<<"$1" | sort
}

total=0 changed=0
while IFS= read -r name <&3 && IFS= read -r a <&4 && IFS= read -r b <&5; do
  total=$((total + 1))
  [[ $(fields "$a") == "$(fields "$b")" ]] && continue
  changed=$((changed + 1))
  printf '### %s\n' "$name"
  diff -U0 --label old --label new <(fields "$a") <(fields "$b") |
    grep -v -e '^@@' -e '^---' -e '^+++' || true
  echo
done 3<"$names" 4<"$work/old.jsonl" 5<"$work/new.jsonl"
echo "$changed of $total names parse differently"
