---
name: review-retro
description: Retro over a repo's PR review history. Groups the team's repeated review feedback into themes, then proposes a check for each mechanical theme and a review standard for each judgement call. Suggests only.
disable-model-invocation: true
argument-hint: "[owner/repo] [--team login,login]"
---

# Review retro

A retrospective on the repo's review history, not on one session. Read what the team said on pull requests, find the **themes** (feedback the team gives again and again), and turn each theme into a fix to the repo's **environment**: a check that a machine runs, or a standard that the reviewer agent applies.

The report is read-only. Change files only after the user picks the fixes.

## 0. Load `/retro`

This skill is a focused run of Matt Pocock's `retro` skill (github.com/mattpocock/skills). `retro` is user-invoked, so the Skill tool cannot load it. Read its file instead: `~/.claude/skills/retro/SKILL.md`, `~/.agents/skills/retro/SKILL.md`, or the plugin copy (`find ~/.claude/plugins -path '*/retro/SKILL.md'`). Its **Coding standards**, **Automated checks**, **Global AGENTS.md**, and **No-ops** categories are the scope of this run. Its Reference section (implementation vs review, and which file a fix belongs in) governs every fix. If the file is missing, stop and tell the user to install it with `npx skills@latest add mattpocock/skills`.

## 1. Build the corpus

The repo is the argument, or the `origin` remote of the current directory.

```bash
python3 -I <skill-dir>/scripts/corpus.py <owner/repo> --out <scratchpad>/review-retro [--team login,login]
```

The script reads every PR in the repo and keeps the comments of **team** members, with no bot comments. It keeps a team member's comment on their own PR only when the comment replies to a bot finding. It writes `corpus.json` and `chunk-<n>.json` files of about 190 KB each, and prints the counts, the date range, the kept reviewers, and the humans it dropped. A repo with 1,600 PRs takes some minutes, because review bodies need one call per PR.

Read the kept and dropped reviewer lists. The default team is `author_association` OWNER, MEMBER, or COLLABORATOR. That is wrong when a maintainer shows as CONTRIBUTOR, or when a dropped login reviews often. In that case, ask the user for the team and run again with `--team`.

Done when the chunk files exist and the user accepts the team.

## 2. Find themes in subagents

The corpus is too large for one context: 812 kept items in a 1,600-PR repo came to 750 KB. Send one subagent per chunk, all in one turn, on Opus. Theme work is judgement over long text, so a smaller model misses the repeats.

Prompt for each subagent (fill in the brackets):

```text
Review retro, read-only. Do not write files.
Read <scratchpad>/review-retro/chunk-<n>.json, all of it (use offset/limit when it is large).
It holds team PR review feedback on <owner/repo> (<one line: what the repo is and its languages>).
Fields: kind (inline / pr_comment / review), u (reviewer), pr, pr_author, date, url, path, body.
An item with reply_to_bot and bot_body is a team member answering a bot finding. Sort each one:
- AGREED: the member accepted it (fixed, good catch, addressed). The finding counts toward a theme.
- REFUTED: the member rejected it. Record the bot's claim and the member's reason as calibration.
Skip status chatter (LGTM, thanks, merged, rebased, CI notices, release talk, user support) unless it carries a request about the code.

Group the feedback into themes. For each theme return:
- name
- distinct PR count, PR numbers (up to 8), and the date of the newest item
- 2-3 verbatim quotes (at most 200 characters each) with PR number and reviewer
- the damage when it was missed: a bug that shipped, data loss, a broken build, or review time only
- MECHANICAL or JUDGEMENT. Mechanical means a machine can decide it: a fixed syntax pattern, a banned API, a file location, a file that must stay in sync with another, or an invariant a test can enumerate (for example "every X is registered in Y").
- for MECHANICAL: the concrete check (linter and rule name, grep CI step, pre-commit hook, or the test)
Then the REFUTED bot claims, grouped by claim, with PR numbers and one quote each.
Then single-occurrence items, only when severe (data loss, security, migrations, auth).
Plain text, no preamble, under 1200 words.
```

Done when every subagent has returned.

## 3. Merge and check against the repo

Get the default branch and its HEAD first. Check every proposal against that commit, not against memory of the repo.

1. **Merge** themes across chunks. A theme needs 2 or more distinct PRs. A single severe item stays as its own line.
2. **Recency.** Give each theme the date it was last seen. A theme with no item in the last 12 months goes to "Dropped" unless the code still has the pattern today.
3. **Already covered.** Read the repo's check setup: linter config, pre-commit config, CI workflows, the `Makefile` or `package.json` scripts, and the existing tests. A theme that a check already catches goes to "Already covered" with the check's name. A theme that still recurs although a rule or check exists is its own finding: the check is not wired, or the rule is unclear, or the reviewer does not read it.
4. **Baseline** each mechanical proposal. Run its grep, or count the matches, on the current tree. Zero matches: enforce it on the whole repo. Some matches: fix them first, or enforce on added lines only and say how many existing matches stay. The team will not merge a check that fails on old code on day one.
5. **Rank by damage**, not by count. A rule that would have stopped data loss ranks above one that saves review time.
6. **Calibration.** Bot claims that the team refuted in 2 or more PRs become a `known-false-positives` standards file, which the reviewer reads before it reports.
7. **Wiring.** Find where the standards files go: an existing `CODING_STANDARDS.md` or `docs/`. Check `.gitignore` for that path. Check the configs of the AI reviewers in the repo (for example `.coderabbit.yaml` `knowledge_base.code_guidelines.filePatterns`) and propose that they read the same files.
8. **Steering files.** Apply retro's Global AGENTS.md and No-ops categories to `AGENTS.md` / `CLAUDE.md`: move the review rules to the standards files, and delete the lines that a linter enforces or that the model obeys by default.

Done when each theme is a proposal, "Already covered", or "Dropped", with a reason.

## 4. Report

Use this structure:

```markdown
# Review retro: <owner/repo>

<PRs scanned>, <comments fetched>, <team items kept>, <date range>. <REFUTED count> of <bot replies> bot findings refuted. Checked against <branch> at <sha>.

## Part 1: Mechanical, build the check
1. **<check>** (<missing | prose only | unwired>). <What to add, where, and the baseline count>.
   > <one quote> (#<pr>)
   PRs: #a, #b, #c

### Already covered
- <theme>: <the check that catches it>

## Part 2: Judgement calls, proposed standards layout
<the tree: CODING_STANDARDS.md as an index of pointers, then docs/<dir>/<area>.md, one comment line per file>
<the .gitignore and AI reviewer wiring>

### <area>.md
1. <rule as one sentence>. PRs: #a, #b
   > <quote> (#<pr>)

## Part 3: AGENTS.md trims
- Move to standards: <section names>
- Delete as no-ops: <lines>

## Dropped
- <theme>: <reason>
```

Leave out an empty section. Then ask the user which fixes to apply. The corpus stays in the scratchpad. Copy it into the repo only when the user asks.

## 5. Apply the chosen fixes

Put the standards files in one PR. Put each new check in its own PR, so that a noisy check can be reverted alone.
