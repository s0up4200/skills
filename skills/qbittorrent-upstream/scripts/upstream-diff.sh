#!/usr/bin/env bash
# Collect the raw material for a qBittorrent upstream audit.
#
# Usage: upstream-diff.sh OUT_DIR [BASE] [HEAD]
#   BASE  defaults to the newest stable release-X.Y.Z tag (alpha/beta/rc skipped)
#   HEAD  defaults to origin/master (the fetched tip, not the local branch)
#   NO_FETCH=1  skip `git fetch`
#
# Writes into OUT_DIR:
#   summary.md   range, API_VERSION diff, lines added to WebAPI_Changelog.md
#                and Changelog between BASE and HEAD, commit list per watch path
#   api.patch    full patches for the WebAPI surface (controllers, serialize,
#                webapplication, websession, clientdatastorage)
#
# Commits already cherry-picked into BASE are dropped (--cherry-pick), so a
# fix that shipped in a 5.2.x point release does not show up as new.
set -euo pipefail

out="${1:?OUT_DIR required}"
cd "$HOME/github/oss/qBittorrent"
mkdir -p "$out"

if [[ -z "${NO_FETCH:-}" ]]; then
    git fetch -q origin master --tags
fi

base="${2:-$(git tag --list 'release-*' | grep -E '^release-[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)}"
head="${3:-origin/master}"
range="$base...$head"
log=(git log --cherry-pick --right-only --no-merges --format='%h %cd %s' --date=short "$range")

api_paths=(
    src/webui/api
    src/webui/webapplication.cpp src/webui/webapplication.h
    src/webui/websession.cpp src/webui/websession.h
    src/webui/clientdatastorage.cpp src/webui/clientdatastorage.h
)
webui_paths=(src/webui/www/private/scripts src/webui/www/private/views src/webui/www/private/index.html)

{
    echo "# qBittorrent upstream: $base -> $head ($(git rev-parse --short "$head"), $(git log -1 --format=%cd --date=short "$head"))"
    echo
    echo "## API_VERSION"
    git diff "$base" "$head" -- src/webui/webapplication.h | grep -E '^[-+].*API_VERSION' || echo "(unchanged)"
    echo
    echo "## API_VERSION bump commits"
    "${log[@]}" -G'API_VERSION' -- src/webui/webapplication.h
    echo
    echo "## WebAPI_Changelog.md: lines added between $base and $head (upstream-maintained, incomplete)"
    git diff "$base" "$head" -- WebAPI_Changelog.md | grep -E '^\+[^+]' | sed 's/^+//' || echo "(no change)"
    echo
    echo "## Changelog: lines added between $base and $head"
    git diff "$base" "$head" -- Changelog | grep -E '^\+[^+]' | sed 's/^+//' || echo "(no change)"
    echo
    echo "## Commits touching the WebAPI surface"
    "${log[@]}" -- "${api_paths[@]}"
    echo
    echo "## Commits touching the bundled WebUI"
    "${log[@]}" -- "${webui_paths[@]}"
    echo
} > "$out/summary.md"

git log --cherry-pick --right-only --no-merges -p --format='commit %h %cd %s' --date=short "$range" -- "${api_paths[@]}" > "$out/api.patch"

echo "wrote $out/summary.md and $out/api.patch"
