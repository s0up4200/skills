---
name: release-announcement
description: Write a Discord release announcement for the repo in the working directory (qui, mkbrr, or another autobrr project) by analyzing everything on main since the latest release tag, using a workflow of Opus agents that read PR bodies and code. Use whenever the user wants to announce a release, write release notes or highlights, post to Discord about a new version, or says "release announcement", "announce the release", "discord post", or is preparing to ship a new version. Also use right after develop is merged into main when a release is imminent.
---

# Release Announcement

Produce a polished Discord announcement for a new release of the repo in the working directory. The announcement covers everything on `main` since the latest release tag, so the flow starts by getting `main` into its final shape, then a workflow of Opus agents digs through the PRs, and finally you write the announcement in the established voice.

The user confirms every step that touches the remote. Never push anything without an explicit yes from this session.

## Repos

`gh` takes the repo from the working directory. Get its name once, and use it wherever this skill says `<owner/repo>` or `<name>`:

```bash
gh repo view --json nameWithOwner,name
```

| Repo | Users | Title emoji |
|---|---|---|
| `autobrr/qui` | self-hosters who manage qBittorrent instances | `:qui:` |
| `autobrr/mkbrr` | people who create, inspect, check, and modify torrent files with the CLI, the GUI, or batch mode | none |

For a repo that is not in the table, ask the user for the users line and the emoji before Step 5.

## Step 1: Sync state

```bash
git fetch origin main
git fetch origin develop   # only if the repo has a develop branch
git describe --tags --abbrev=0 origin/main      # latest release tag
git log --oneline <tag>..origin/main | wc -l    # already on main since tag
git log --oneline origin/main..origin/develop | wc -l   # pending on develop, if it exists
```

If the working tree is dirty, that's fine as long as you don't need to check out main (see Step 2 mechanics).

## Step 2: Ask about merging develop into main

Skip this step when the repo has no `develop` branch: announce what is on main.

Otherwise always ask, every run, even if develop has zero pending commits (then just say so and skip ahead). Use AskUserQuestion with these options:

1. **Merge develop into main and push** — the normal release path.
2. **Main is already where I want it** — skip the merge, announce what's on main now.
3. **Preview against develop, push nothing** — dry-run the announcement over `<tag>..origin/develop` without touching main. Useful for drafting before the merge actually happens.

Merge mechanics: a repo with a develop branch keeps main as a fast-forward of develop (linear history, no merge commits). To avoid touching the working tree, prefer pushing develop directly onto main:

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

A breaking change always goes in **Analyze**, whatever its type. Find them by label, since a `chore` or `docs` PR can still break a setup. qui and mkbrr use the `BREAKING CHANGE` label:

```bash
gh pr list --state merged --label "BREAKING CHANGE" --limit 100 --json number,title
```

Keep the PR numbers from that list that are also in the range. Also treat a commit subject with `!` before the colon (`feat!:`, `fix(api)!:`) as breaking. The Step 5 agents catch the rest from the PR body.

Then collect the contributors, sorted by commit count. Use `main` or `develop` as the end ref (the API takes branch names, not `origin/...`); it returns at most 250 commits, more than any release so far:

```bash
gh api repos/{owner}/{repo}/compare/<tag>...<end> --jq '.commits[].author.login // empty' \
  | sort | uniq -c | sort -rn | grep -v 's0up4200\|\[bot\]'
```

Credit every login left, docs-only PR authors included even though Step 4 skips their PRs.

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
const repo = 'autobrr/qui'  // literal: <owner/repo>
const users = 'self-hosters who manage qBittorrent instances'  // literal: the Users column for the repo
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
    user_facing: { type: 'boolean', description: 'would a user notice this change at all' },
    area: { type: 'string', description: 'a short area name, for qui one of: torrents, cross-seed, automations, i18n, sse/realtime, backend/db, api, ui-polish, other' },
    summary: { type: 'string', description: '2-4 sentences: what changed from the USER perspective, the problem it solves, who hit it' },
    facts: { type: 'string', description: 'concrete details worth quoting: option/setting names as they appear in the UI, version requirements (e.g. needs qBittorrent 5.1+), measured numbers, issue/discussion refs. Empty string if none.' },
    breaking: { type: 'boolean', description: 'true if the PR has the BREAKING CHANGE label, or the body or diff shows a change that makes users act: removed or renamed option, changed default, changed API or config format, dropped support' },
    breaking_details: { type: 'string', description: 'if breaking: what breaks, who is affected, and what the user must do. Empty string if not breaking.' },
  },
  required: ['pr', 'user_facing', 'area', 'summary', 'facts', 'breaking', 'breaking_details'],
}
const results = await parallel(prs.map(p => () =>
  agent(
    `You are analyzing PR #${p.num} ("${p.subject}") in ${repo} for a user-facing release announcement.\n` +
    `1. Read the PR body: gh pr view ${p.num} --repo ${repo} --json title,body,labels\n` +
    `2. Read the actual change: find the commit for #${p.num} in \`git log ${range} --oneline\` and inspect it with git show. Read enough of the touched code to know what really changed, not just what the body claims.\n` +
    `3. Report the change as a USER would experience it. The users are ${users}. They care about what they can now do, what stopped breaking, and any requirements. Internal refactors, test changes, and code structure are irrelevant unless they change behavior.\n` +
    `4. Decide if the change is breaking. Check the labels for "BREAKING CHANGE" and the body for a breaking-change section or note, then confirm it in the diff. If it is breaking, say exactly what the user must change.`,
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
# New <name> release: `vX.Y.Z`! <emoji>

## Breaking changes
- **What changed.** Who it affects and what they must do before or after upgrading.

## Highlights
- **Theme lead-in.** One sentence on what users get, two at most.
- **Another theme.** ...
- **Fixes and polish.** The smaller items, named and comma-chained.

Thanks to **login1**, **login2**, and **login3** for contributing to this release.

Full changelog: https://github.com/<owner/repo>/releases/tag/vX.Y.Z
```

Leave out `<emoji>` when the repo has none.

### Contributors

List the Step 4 logins in that order, bold, as plain text: a `@login` on Discord looks like a broken ping because these are GitHub handles, not Discord ones. Names only, no per-person summaries.

### Breaking changes

Add this section only when an agent reported `breaking: true`. Leave it out when nothing breaks; do not write "None".

- One bullet per breaking change, not grouped by theme: each one can need its own action from the user.
- Lead with the bolded change, then the action the user must take, in one or two sentences. From the `breaking_details`, keep only what the user needs to act: the option name, the new value, the error text they will see.

  ```markdown
  - **A config file with a syntax error now stops startup.** If an agent stops after the update, fix the file named in the "failed to decode config file" error. The usual cause is an API key with a `"`, written by an older agent installer.
  ```
- No emojis, no warning icons, no all-caps shouting. The heading alone marks the section.
- A breaking change can also appear in Highlights when it brings a benefit, but do not repeat the migration steps there.

### How to build the Highlights

- **Group by theme, never by PR.** A theme bundles related PRs into one story ("Cross-seed matching fixes" might cover three PRs). Aim for 3-6 bullets. The last bullet is always **Fixes and polish.**, a comma-chained list of the small items, each named in a few words.
- **Order by impact.** The first bullet is the headline: the thing most users will feel. Big reliability or performance work usually outranks new toggles.
- **Lead each bullet with a bolded benefit phrase**, then one sentence, two at most. "Real-time updates that hold up under load." not "SSE refactor."
- **State the outcome**: what users can do now, or what stopped breaking. The mechanism, the old behaviour, test numbers, and edge cases belong to the changelog link. Name UI options in bold or quotes as they appear in the app.
- **Keep one fact per bullet**, the one a user acts on or remembers: a version requirement ("needs qBittorrent 5.1+"), an option name, a striking number ("~26x less data").
- **Honest hedging is fine**: "is hopefully gone" for a hard-to-reproduce fix reads better than overclaiming.

### Style rules

- Never use em dashes. Commas, periods, or parentheses instead.
- Discord markdown only: `#`, `##`, `**bold**`, `` `code` ``, lists. No tables, no links other than the changelog URL, no images.
- Aim for 1000 to 1500 characters, the length of the example below, plus a breaking-changes section when there is one. Discord posts are scannable; the changelog link carries the long tail. Count with `wc -m` on the draft (characters, not bytes, since `wc -c` overcounts anything non-ASCII). When a draft runs over, cut whole sentences from the longest Highlights first; the contributor line is not where the space comes from.
- The title emoji (such as `:qui:`) is a custom server emoji; keep it verbatim.

### Reference example (qui v1.21.0)

Use it for the voice and the length in every repo.

```markdown
# New qui release: `v1.21.0`! :qui:

## Highlights
- **Real-time updates that hold up under load.** Updates now arrive as small deltas (~26x less data), so big instances and background tabs stop stalling or going black.
- **Per-file download priority.** Set Normal, High, Maximum, or Do not download per file and folder in the Content tab.
- **Three more languages.** Italian, Korean, and Ukrainian, seven in total.
- **Smarter automations.** New tracker **Status** and **Message** conditions (needs qBittorrent 5.1+), and a **Year** condition parsed from the torrent name.
- **Cross-seed matching fixes.** TV searches return results on BTN and IPT again, and rootless single-file matches land in the right folder.
- **Fixes and polish.** Postgres hardening, a `GET /api/version` endpoint, all-instances exports to the right instance, and UI polish.

Thanks to **nitrobass24**, **jussaw**, **OlziYT**, **rodion981**, **luckylittle**, and **nasenov** for contributing to this release.

Full changelog: https://github.com/autobrr/qui/releases/tag/v1.21.0
```

## Step 7: Run the prose passes

Every draft goes through two passes before the user sees it, in this order:

1. Call the Skill tool with "simple-english" and apply its Document rules to the prose.
2. Call the Skill tool with "unslop" and apply it to the result. It runs last, so no later edit adds a tell back.

The passes change the sentences, not the template or the length. Keep the title, the headings, the bold lead-in on each bullet, the contributor line, and the changelog URL. Keep option names, version numbers, and other facts exact. The users know their own app, so its terms need no definition; when a pass splits a sentence, cut words so the bullet stays as short as before.

The step is done when both passes ran on the final draft. If you edit the draft after the unslop pass, run unslop again. Then count the characters again for Step 8.

## Step 8: Deliver and hand off

Print the finished announcement inside a fenced code block so the raw markdown can be copied straight into Discord (rendered markdown loses the formatting characters). State the character count next to it so the user can see it fits before pasting.

Then, if this was a real release run (not a preview), offer to cut the tag by invoking the `/release-tag` skill. That skill handles the signed tag and push with its own confirmation. The GitHub release page (and the changelog URL in the announcement) goes live once the tag is pushed and CI publishes the release.
