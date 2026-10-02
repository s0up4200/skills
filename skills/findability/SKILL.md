---
name: findability
description: Retro over the last N coding-agent sessions in a repo (Claude Code and Codex). Finds where agents took too long to find information or followed stale docs, and proposes navigation fixes.
disable-model-invocation: true
argument-hint: "[number of sessions, default 10] [focus]"
---

# Findability

A retrospective on the repo, not on one session. Read the newest agent sessions that ran in this repo and find the **friction**: the places where an agent spent many calls to find one fact, or acted on a doc that was wrong. Each finding becomes a fix to the repo's **navigation**: a pointer, a corrected doc, or a check.

The report is read-only. Change files only after the user picks the fixes.

## 0. Load `/retro`

This skill is a focused run of Matt Pocock's `retro` skill (github.com/mattpocock/skills). `retro` is user-invoked, so the Skill tool cannot load it. Read its file instead: `~/.claude/skills/retro/SKILL.md`, `~/.agents/skills/retro/SKILL.md`, or the plugin copy (`find ~/.claude/plugins -path '*/retro/SKILL.md'`). Its **Navigation** and **Information access** categories are the scope of this run, and its Reference section (implementation vs review, and which file a fix belongs in) governs every fix in step 3. If the file is missing, stop and tell the user to install it with `npx skills@latest add mattpocock/skills` or `claude plugins install mattpocock-skills`.

## 1. Collect the sessions

The repo is the main worktree of the current directory (`git worktree list | head -1`). Sessions from its other worktrees count too; the script finds them.

```bash
python3 <skill-dir>/scripts/sessions.py <repo> -n 10 --out <scratchpad>/findability
```

It reads Claude Code transcripts (`~/.claude/projects`) and Codex rollouts (`~/.codex/sessions`), newest first. It skips subagent threads as sessions, but a Claude session's digest includes its subagents' calls. For each session it writes `<id>.txt` and prints one line: span, tool calls, `searches`, `calls-before-first-edit`, `failed-results`, and the first prompt.

A digest line is one of:

- `USER:` / `ASSISTANT:` text, clipped.
- `#N SEARCH <tool>: …`: a call that only looks for or reads information.
- `#N TOOL <tool>: …`: any other call.
- `-> …` or `FAIL …`: the clipped result. `FAIL` marks an error, an empty match, or a missing file.

The raw transcript path is on the first line of each digest. Use `jq` or `grep` on it only where the digest clips a key moment.

Drop a session that was itself a retro over sessions: its searches are reading transcripts, not the repo. Say which sessions you dropped and why. If fewer than N sessions remain, say so and go on.

Done when you have a list of kept sessions with the user's first prompt for each.

## 2. Analyse each session in a subagent

The digests are large (up to about 150 KB each), so the analysis runs in subagents. Give each subagent about 150 KB of digests: one large session alone, or several small ones together. Run all subagents in one turn. Use the session's model; do not choose a smaller one, because this work is judgement over long text.

The script's last line names the repo's **memory**: the Claude auto-memory directory, or `none`. Agents read memory as if it were docs, but Codex, subagents, and other checkouts do not see it.

Before you send them, get the default branch and its HEAD (`git rev-parse --short origin/HEAD` or the local `develop`/`main`). Put both in the prompt.

Prompt for each subagent (fill in the brackets):

```text
Findability retro, read-only. Do not edit, commit, or push anything.
Repo: <repo path> (<one line: what the repo is>). Default branch <branch> at <sha>.
Digests: <scratchpad>/findability/<id>.txt for sessions <ids, each with its first prompt>.
Memory: <memory dir, or "none">. Read it; it counts as a doc.
Digest format: "#N SEARCH|TOOL <tool>: <input>", then "-> <result>" or "FAIL <result>".
The first line of each digest gives the raw JSONL path. Use jq/grep on it only where the digest is clipped at a key point.

Find friction: places where the agent took too long to find information, or relied on information that was wrong. Look for:
1. Search runs: 4 or more SEARCH calls that hunt for one fact. Name the fact, count the calls, and say where the fact actually lives.
2. Stale docs: a doc, skill, comment, or memory the agent read (AGENTS.md, CLAUDE.md, docs/, ADRs, CONTEXT.md, README, skills) that disagreed with the code, named a removed file or command, or sent the agent the wrong way.
3. Missing pointers: the fact lived in a doc that nothing pointed the agent to, or in a file it found only by luck.
4. Late coupling: change X needed change Y elsewhere, and the agent learned that only from a failed check, a review, or the user.
5. Repeated lookups: the same fact looked up more than once in a session, or a command that failed and was retried in a different form.
6. User corrections: the user told the agent where something was, or that a doc was wrong.
7. Memory-only facts: a durable repo fact (layout, a rule, a gotcha) that lives only in memory, so Codex and subagents found it again the slow way. Also memory that is now stale.

Verify every candidate against <branch> at <sha>: read the doc, the code, or run the command. Drop a candidate that is already fixed, and say so in one line.

Return a list, most costly first. For each item:
- session id and digest call numbers (for example 54129a0c #12-#31)
- kind: search run / stale doc / missing pointer / late coupling / repeated lookup / memory-only fact
- evidence: the call count, or a quote of at most 2 lines
- where the information actually lives (file:line)
- fix: the exact line to add or change, and the file. A pointer goes where the agent first looked.
Then one line per finding that is outside navigation (CI, hooks, tooling, permissions), with no fix detail.
No other prose.
```

Done when every subagent has returned.

## 3. Merge and rank

- Merge findings that name the same fact or doc. A problem seen in 2 or more sessions ranks above any single-session problem.
- Rank by cost: a stale doc that made an agent do the wrong thing ranks above a slow lookup. A slow lookup ranks by its call count. A lookup that cost fewer than 4 calls in one session goes in "Smaller items" as one line.
- Check each fix against these rules. Change the fix when it breaks a rule.
  - **Correct at the source.** A stale doc gets corrected or deleted. Do not add a second doc that contradicts it.
  - **Point from where the agent looked.** The best pointer sits in the file or directory the agent opened first: a directory-level `AGENTS.md`, the top of the doc it read, or a comment beside the code. A line in the root `CLAUDE.md`/`AGENTS.md` is loaded for every task, so use it only for a fact that most tasks need.
  - **Cache only what a lookup cannot find.** A doc that copies a config file or a command's `--help` output goes stale. Point to the source of truth.
  - **Move memory into the repo.** A memory-only fact moves to the repo doc where agents look for it, and the memory file is deleted.
  - **Label fixes outside the repo.** A fix to a global skill, a memory file, or `~/.claude/CLAUDE.md` needs no PR. Mark it "(outside repo)".
  - **Prefer a check to a sentence.** When the agent learned a rule from a failed check, the check already works. When it learned the rule from a reviewer or the user, a lint rule or test can enforce it. Writing the rule down is the fallback.

## 4. Report

Use this structure:

```markdown
# Findability retro: <repo>

<N> sessions, <date range>: <one line per kind of work, for example "2 implements, 4 reviews, 1 triage">. Checked against <branch> at <sha>.

## Stale docs
1. **<doc> says X, but the code does Y.** <session ids and the cost, for example "sent 2 sessions to the wrong command">.
   Where: <file:line>. Fix: <exact change>.

## Slow lookups
1. **<fact> took <n> calls in <session>.** It lives in <file:line>.
   Fix: <pointer line and the file it goes in>.

## Smaller items
- <one line each: session, fact, where it lives, fix>

## Outside navigation
- <one line each>

## Dropped
- <candidate>: already fixed in <commit or file>.
```

Leave out an empty section. Then ask the user which fixes to apply.

## 5. Apply the chosen fixes

Follow the repo's own workflow for the change: its branch rule, its commit rules, and its PR template. Docs-only fixes usually fit in one PR. Put a check or code change in its own PR.
