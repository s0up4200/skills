#!/usr/bin/env bash
# Checks each skill: shellcheck on its scripts, a name that matches its
# folder, a path in the plugin manifest, and a SKILL.md under 500 lines.
# CI runs it on each push.
set -euo pipefail
cd "$(dirname "$0")"

fail=0
find skills -name '*.sh' -print0 | xargs -0 shellcheck -S warning || fail=1

while read -r file; do
  dir=${file%/SKILL.md}
  name=$(sed -n 's/^name: *//p' "$file" | head -1)
  [[ $name == "${dir##*/}" ]] || { echo "$file: name '$name' does not match its folder"; fail=1; }
  grep -q "\"./$dir\"" .claude-plugin/marketplace.json || { echo "$dir: not in .claude-plugin/marketplace.json"; fail=1; }
  lines=$(wc -l <"$file")
  ((lines < 500)) || { echo "$file: $lines lines, keep it under 500"; fail=1; }
done < <(find skills -name SKILL.md | sort)

exit "$fail"
