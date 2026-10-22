#!/usr/bin/env bash
# Print the whole discussion of a GitHub pull request as plain text, with each
# body in full: the PR body, each conversation comment, each review body, and
# each inline review comment. Each item starts with a "=====" header line that
# gives the kind, author, and date. A review header adds the state and id. An
# inline comment header adds path:line, the comment id, and the in_reply_to id.
# Usage: pr-discussion.sh <pr-number> [owner/repo]
# Without owner/repo, gh uses the repo of the current directory.
set -euo pipefail
# A mise-managed gh wrapper prints status lines to stdout, which breaks jq.
export MISE_QUIET=1
pr="${1:?pr number}"; repo="${2:-{owner\}/{repo\}}"

gh api "repos/$repo/pulls/$pr" | jq -r '
  "===== PR #\(.number) body by \(.user.login) at \(.created_at)", (.body // "")'
gh api --paginate "repos/$repo/issues/$pr/comments" | jq -rs 'add[]
  | "===== Conversation comment by \(.user.login) at \(.created_at), id \(.id)", (.body // "")'
gh api --paginate "repos/$repo/pulls/$pr/reviews" | jq -rs 'add[]
  | "===== Review by \(.user.login) at \(.submitted_at), \(.state), id \(.id)", (.body // "")'
gh api --paginate "repos/$repo/pulls/$pr/comments" | jq -rs 'add[]
  | "===== Inline comment by \(.user.login) at \(.created_at), \(.path):\(.line // .original_line), id \(.id), in_reply_to \(.in_reply_to_id // "none")",
    (.body // "")'
