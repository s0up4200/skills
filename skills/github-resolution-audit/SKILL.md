---
name: github-resolution-audit
description: Use when auditing GitHub Issues or Discussions for open feature requests that may have shipped, bugs that may already be fixed, stale reports, or duplicates, especially when the user wants direct links to the resolving work.
---

# GitHub resolution audit

Audit read-only. A keyword match is only a lead.

## Scope

Accept `owner/repo`, repository, `/issues`, category, or individual URLs. Use the narrowest supplied scope.

- A repository or `/issues` URL means open Issues by default. Exclude pull requests.
- A Discussion category means every open Discussion in it by default. Keep answered-but-open items in scope. Use closed Discussions only as evidence or when requested, and count them separately as excluded.
- Follow pagination. Record the inspected count and any coverage gap.
- Use existing authentication, including private repositories, without requesting broader access.

## Establish proof

Read each body, comments, answers, and cross-references. Trace both directions through Issues, Discussions, merged PRs, commits, releases, documentation, upstream projects, tests, and current code. Start with explicit references, then search distinctive behavior, errors, and symbols.

Map the request or reproduction to the evidence. Strong proof needs a merged artifact, release, exact current-code behavior, authoritative documentation or maintainer decision, upstream resolution, or canonical duplicate. An unsupported "fixed" claim belongs in `needs confirmation`. Similar wording is not proof.

Use commit-pinned URLs for source lines. Treat a partial implementation as `needs confirmation` and name the missing part.

## Classify results

| Status | Meaning |
|---|---|
| `released` | The fix is present in a published release. |
| `merged` | The fix is on the default branch but is not proven released. |
| `duplicate` | A canonical item covers the same behavior. Link both and include its fix when resolved. |
| `resolved without code` | Documentation, configuration, an upstream fix, or a maintainer decision resolves the item. |
| `needs confirmation` | Evidence is plausible but incomplete, including partial work or an unsupported maintainer claim. |

Keep unsupported items out of detailed results but include them in the counts.

## Report

Return Markdown grouped in this order: `released`, `merged`, `duplicate`, `resolved without code`, `needs confirmation`. Within each group, put the oldest item first.

Start with scope, audit date, inspected, excluded-closed, confirmed, uncertain, and still-open counts, plus any coverage gap. Then use:

| Item | Status | Fix or evidence | Availability | Recommended action | Why it matches |
|---|---|---|---|---|---|
| [Request title](https://github.com/OWNER/REPO/issues/123) | merged | [PR #456](https://github.com/OWNER/REPO/pull/456) | Default branch, unreleased | Close as completed | The PR implements the requested behavior. |

Every row needs direct item and evidence URLs. Recommend `close as completed`, `close as duplicate`, `mark answered`, or `verify before closing`. Do not mutate GitHub.

## Common mistakes

- A closed PR or unmerged branch is not an implementation.
- An accepted answer is a lead, not automatic proof.
- A fix on the default branch is not necessarily in the latest release.
- A duplicate needs a canonical URL, not only similar symptoms.
