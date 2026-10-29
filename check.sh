#!/usr/bin/env bash
# Checks each skill: shellcheck on its scripts, a name that matches its
# folder, a path in the plugin manifest, a SKILL.md under 500 lines, and a
# body under 15,000 bytes, and other Markdown files under 20,000 bytes.
# After a compaction, Claude Code keeps only the first 5,000 tokens of a
# skill, and 15,000 bytes is about 5,000 tokens. A reference file has no
# compaction cap, but over 20,000 bytes (about 5,000 tokens) it costs more
# context than the one entry that the agent needs. Split it by section.
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
  # Remove a skill from this list when its body is under the cap.
  [[ $dir == skills/mobile-adapt ]] && continue
  bytes=$(awk 'f>=2; /^---$/ && f<2 {f++}' "$file" | wc -c)
  ((bytes < 15000)) || { echo "$file: body has $bytes bytes, keep it under 15000"; fail=1; }
done < <(find skills -name SKILL.md | sort)

# The *-workspace folders hold local eval output that git ignores.
while read -r file; do
  bytes=$(wc -c <"$file")
  ((bytes < 20000)) || { echo "$file: $bytes bytes, split it under 20000"; fail=1; }
done < <(find skills -name '*.md' ! -name SKILL.md ! -path '*-workspace/*' | sort)

exit "$fail"
