---
name: release-announcement
description: Write a qui Discord release announcement by analyzing everything on main since the latest release tag, using a workflow of Opus agents that read PR bodies and code. Use whenever the user wants to announce a release, write release notes or highlights, post to Discord about a new version, or says "release announcement", "announce the release", "discord post", or is preparing to ship a new qui version. Also use right after develop is merged into main when a release is imminent.
---

# Release Announcement

Produce a polished Discord announcement for a new qui release. The announcement covers everything on `main` since the latest release tag, so the flow starts by getting `main` into its final shape, then a workflow of Opus agents digs through the PRs, and finally you write the announcement in the established voice.

The user confirms every step that touches the remote. Never push anything without an explicit yes from this session.

## Step 1: Sync state

```bash
git fetch origin main develop
git describe --tags --abbrev=0 origin/main      # latest release tag
git log --oneline <tag>..origin/main | wc -l    # already on main since tag
git log --oneline origin/main..origin/develop | wc -l   # pending on develop
```

If the working tree is dirty, that's fine as long as you don't need to check out main (see Step 2 mechanics).

## Step 2: Ask about merging develop into main

Always ask, every run, even if develop has zero pending commits (then just say so and skip ahead). Use AskUserQuestion with these options:

1. **Merge develop into main and push** — the normal release path.
2. **Main is already where I want it** — skip the merge, announce what's on main now.
3. **Preview against develop, push nothing** — dry-run the announcement over `<tag>..origin/develop` without touching main. Useful for drafting before the merge actually happens.

Merge mechanics: qui keeps main as a fast-forward of develop (linear history, no merge commits). To avoid touching the working tree, prefer pushing develop directly onto main:

```bash
git push origin origin/develop:main
```

This only succeeds as a fast-forward, which is exactly the constraint we want. If it's rejected because main has diverged, stop and show the user; don't force anything.

## Step 3: Determine the announcement range and version

The range is `<latest-tag>..origin/main` (or `..origin/develop` in preview mode).

Infer the next version with the same rules as the `/release-tag` skill: parse the latest tag, bump **minor** if any commit in the range is a `feat` or clearly adds functionality, otherwise **patch**. Never bump major. Confirm the version with the user via AskUserQuestion, offering both the recommended bump and the alternative. The version appears in the title and the changelog URL, so it must be settled before writing.

## Step 4: Collect the changes

```bash
git log <tag>..<end> --oneline --no-merges
```

Extract PR numbers from the `(#NNNN)` suffixes. Sort commits into two buckets:

- **Analyze**: features, fixes, and anything plausibly user-visible.
- **Skip**: `chore(deps)` bumps, CI-only changes, docs-only changes. Don't spend agents on these; at most they get a passing mention if something notable hides in them (a security bump users should know about, for example).

## Step 5: Analyze with a workflow of Opus agents

Spawn one agent per analyzed PR via the Workflow tool. Each agent reads the PR body and the actual diff, because PR bodies alone often undersell or oversell what changed, and the announcement needs concrete facts (exact option names, version requirements, real numbers).

Two reliability rules learned the hard way: keep the schema to plain string/boolean/number fields (string arrays in workflow schemas get mangled), and inline the PR list and range as literals in the script rather than passing them via the Workflow `args` parameter (args can arrive JSON-stringified, which makes `args.prs` undefined and kills the run).

Script skeleton (fill in the PR list and range literals):

```javascript
export const meta = {
  name: 'release-announcement-analysis',
  description: 'Understand user-facing impact of each PR in the release range',
  phases: [{ title: 'Analyze PRs', model: 'opus' }],
}
const range = 'vX.Y.Z..origin/main'  // literal, not args
const prs = [
  {num: 2113, subject: 'fix(dirscan): align injected torrent paths to on-disk layout'},
  // ... one entry per analyzed PR
]
phase('Analyze PRs')
const SCHEMA = {
  type: 'object',
  properties: {
    pr: { type: 'number' },
    user_facing: { type: 'boolean', description: 'would a qui user notice this change at all' },
    area: { type: 'string', description: 'one of: torrents, cross-seed, automations, i18n, sse/realtime, backend/db, api, ui-polish, other' },
    summary: { type: 'string', description: '2-4 sentences: what changed from the USER perspective, the problem it solves, who hit it' },
    facts: { type: 'string', description: 'concrete details worth quoting: option/setting names as they appear in the UI, version requirements (e.g. needs qBittorrent 5.1+), measured numbers, issue/discussion refs. Empty string if none.' },
  },
  required: ['pr', 'user_facing', 'area', 'summary', 'facts'],
}
const results = await parallel(prs.map(p => () =>
  agent(
    `You are analyzing PR #${p.num} ("${p.subject}") in autobrr/qui for a user-facing release announcement.\n` +
    `1. Read the PR body: gh pr view ${p.num} --repo autobrr/qui --json title,body,labels\n` +
    `2. Read the actual change: find the commit for #${p.num} in \`git log ${range} --oneline\` and inspect it with git show. Read enough of the touched code to know what really changed, not just what the body claims.\n` +
    `3. Report the change as a qui USER would experience it. qui users are self-hosters managing qBittorrent instances; they care about what they can now do, what stopped breaking, and any requirements. Internal refactors, test changes, and code structure are irrelevant unless they change behavior.`,
    { label: `pr-${p.num}`, model: 'opus', schema: SCHEMA }
  )
))
return results.filter(Boolean)
```

Also mention the working directory in the agent prompt (agents start without repo context). Commits without a PR number get an agent too, pointed at `git show <sha>` instead of `gh pr view`.

## Step 6: Write the announcement

You write it yourself in the main conversation, from the agent findings. Do not delegate the writing; voice matters more than anything here.

### Template

```markdown
# New qui release: `vX.Y.Z`! :qui:

## Highlights
- **Theme lead-in.** Two to four sentences expanding on it.
- **Another theme.** ...
- **Fixes and polish.** Catch-all for the smaller items, comma-chained.

Full changelog: https://github.com/autobrr/qui/releases/tag/vX.Y.Z
```

### How to build the Highlights

- **Group by theme, never by PR.** A theme bundles related PRs into one story ("Cross-seed matching fixes" might cover three PRs). Aim for 4-7 bullets. The last bullet is always **Fixes and polish.**, sweeping up everything real but small.
- **Order by impact.** The first bullet is the headline: the thing most users will feel. Big reliability or performance work usually outranks new toggles.
- **Lead each bullet with a bolded benefit phrase**, then explain. "Real-time updates that hold up under load." not "SSE refactor."
- **Write for users, not developers.** Name the problem they experienced ("stalls and black screens some users hit on big instances"), then what changed. UI option names in bold or quotes as they appear in the app. No internal jargon: "sync manager mutex" means nothing to a user, "large instances no longer freeze the UI" does.
- **Use the concrete facts the agents dug up**: real numbers ("~26x less data per tick"), version requirements ("needs qBittorrent 5.1+"), instance sizes ("18k+ torrents"). Specifics are what make the announcement feel substantial instead of generic.
- **Honest hedging is fine**: "is hopefully gone" for a hard-to-reproduce fix reads better than overclaiming.

### Style rules

- Never use em dashes. Commas, periods, or parentheses instead.
- Discord markdown only: `#`, `##`, `**bold**`, `` `code` ``, lists. No tables, no links other than the changelog URL, no images.
- Total length in the neighborhood of the example below (roughly 2500 characters). Discord posts should be scannable, not exhaustive; the changelog link carries the long tail.
- The `:qui:` emoji in the title is a custom server emoji; keep it verbatim.

### Reference example (v1.21.0)

```markdown
# New qui release: `v1.21.0`! :qui:

## Highlights
- **Real-time updates that hold up under load.** The server-sent-events stream introduced in v1.20 is now far more resilient on large and slow qBittorrent instances. Torrent updates are sent as small deltas instead of full page snapshots (~26x less data per tick), fixing the stalls and black screens some users hit on big instances or backgrounded tabs. A sync timeout that could permanently disconnect very large instances (18k+ torrents) until a restart is hopefully gone.
- **Per-file download priority.** You can now set download priority per file and per folder (Do not download / Normal / High / Maximum) right in the torrent Content tab, matching qBittorrent's WebUI. Previously only include/exclude was reachable, so High and Maximum were unavailable.
- **Three more languages, now seven total.** Added Italian, Korean, and Ukrainian, joining English, German, French, and Simplified Chinese, with improved French coverage and more previously-hardcoded strings cleaned up.
- **Smarter automations.** New tracker conditions match on tracker **Status** and **Message** (act on errored trackers or specific messages; needs qBittorrent 5.1+), a new **Year** condition filters by the release year parsed from the torrent name, and trackers configured on the Indexers page are now selectable in workflow rules even before any torrent uses them.
- **Cross-seed matching fixes.** TV searches no longer append a resolution token that made some indexers (BTN, IPT) return zero results, "and"/"&" connector-spelling passes now reuse the Torznab cache and re-query indexers that returned only junk, and rootless single-file torrents matched into a foldered release are filed into the correct folder so qBittorrent stops reporting missing files.
- **Fixes and polish.** Postgres hardening (fixed int4 sequence exhaustion in string interning and indexed `string_pool` columns so background GC stops timing out), all-instances exports now route to the owning instance, a new `GET /api/version` endpoint reports the running version, pprof binds to a configurable loopback address, and assorted UI polish (status bar back at the bottom, no more tab-indicator layout shifts).

Full changelog: https://github.com/autobrr/qui/releases/tag/v1.21.0
```

## Step 7: Deliver and hand off

Print the finished announcement inside a fenced code block so the raw markdown can be copied straight into Discord (rendered markdown loses the formatting characters).

Then, if this was a real release run (not a preview), offer to cut the tag by invoking the `/release-tag` skill. That skill handles the signed tag and push with its own confirmation. The GitHub release page (and the changelog URL in the announcement) goes live once the tag is pushed and CI publishes the release.
