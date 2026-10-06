---
name: trim-agents-md
description: Restructure an AGENTS.md or CLAUDE.md at three levels (prune, disclose, index) in parallel subagents, compare them, and ship the level the user picks as one PR.
disable-model-invocation: true
argument-hint: "[path to AGENTS.md, default ./AGENTS.md] [--sessions]"
---

# Trim AGENTS.md

An always-loaded steering file costs context on every turn of every task. This skill cuts that cost in three variants of rising depth. Each variant gives a **reason** for every line it removes, so the user can review the cut line by line. The user picks one variant, and only that one ships.

## 0. Load `writing-for-agents`

Call the Skill tool with `writing-for-agents`. Its terms govern this run: no-op, cache, sediment, context pointer, progressive disclosure, single source of truth.

## 1. Map the target

The target is the argument, or `AGENTS.md` in the current directory. Collect these facts before any subagent starts, because each subagent needs all of them:

- **Readers.** Run `ls -la` on the target and every `AGENTS.md` and `CLAUDE.md` in the repo (`git ls-files '*AGENTS.md' '*CLAUDE.md'`). Record which file is a symlink to which, or which one imports the other (`@AGENTS.md`). Codex reads `AGENTS.md`, and Claude Code reads `CLAUDE.md`, so a nested file needs the same setup as the root file.
- **Enforcers.** The linter configs, pre-commit config, CI workflows, and `Makefile` or `package.json` scripts. A line that one of these enforces is a no-op.
- **Standards home.** An existing `CODING_STANDARDS.md` or `docs/` folder. Use the layout of the `review-retro` skill when nothing exists: `CODING_STANDARDS.md` as an index of pointers, and the rules in `docs/standards/<area>.md`. Check `.gitignore` for that path.
- **Size.** Lines and bytes of the target (`wc -lc`). Estimate tokens as bytes / 4.
- **Base.** The default branch and its HEAD SHA.

With `--sessions`, also run `python3 -I ~/.agents/skills/findability/scripts/sessions.py <repo> -n 10 --out <scratchpad>/trim-sessions`. Read the digests for two signals: a rule that agents broke anyway (it needs a check, not a sentence), and a rule that no session touched (a no-op candidate, not proof).

The target can be outside a repo, for example a global instructions file. In that case, there is no PR. Step 4 shows the diff, and the user applies it.

Done when every fact above is written down.

## 2. Three variants in parallel

Send three subagents in one turn, each with `isolation: "worktree"`, on Opus. Give each one the same prompt with a different level:

- **prune:** delete no-ops and fix stale lines. Move nothing.
- **disclose:** prune, then move review-only rules to the standards home, and move procedures that only one kind of task needs into a doc behind a pointer.
- **index:** disclose, then cut the target to pointers plus the facts that most tasks need. Aim for 40 lines or fewer.

Prompt (fill in the brackets):

```text
Restructure <target> at level <level>, in your worktree. Do not commit or push.
First call the Skill tool with writing-for-agents and apply it.
Facts: <the step 1 map: readers and symlinks, enforcers, standards home, size, base SHA, and session signals when present>.
Levels: prune = delete no-ops and fix stale lines, move nothing. disclose = prune, then move review-only rules to <standards home> and single-task procedures into docs behind pointers. index = disclose, then keep only pointers plus the facts most tasks need, 40 lines or fewer.

Every line you delete or move gets exactly one tag:
- enforced: <config path and rule> (verify it: the rule is on, and it covers this case)
- default: the model does this without the line
- duplicate: <file:line> that says the same thing
- stale: <evidence that the code or command no longer matches>
- moved: <new path>
A line with no tag that you can prove stays where it is.

Write-time rules: a rule that prevents damage while code is written (data loss, real network calls in tests, editing migrations, secrets, destructive commands) must stay readable at write time. Keep it in <target>, move it to a nested AGENTS.md beside the code it governs, or propose a check that enforces it. Never delete it, and never move it to a file that only review reads.

Each pointer names the material and the condition for reading it, with the condition first.

Return:
1. lines and bytes of <target> before and after, and of every file you created or changed
2. the tagged list: original line (clipped to 100 characters), tag
3. the write-time rules and where each one went
4. any check you propose instead of a sentence, with its baseline count on the current tree
5. the worktree path
```

Done when all three subagents have returned.

## 3. Compare and verify

Verify the tags yourself. A wrong tag deletes a rule that agents still need.

1. For each `enforced` tag, open the config and confirm that the rule is on.
2. For each `duplicate` tag, open the other line.
3. For each `moved` tag, confirm that the text is in the new file and that a pointer reaches it.
4. Read the write-time list of each variant against the original file. A write-time rule that the variant dropped disqualifies it until the rule is back.
5. Treat every `default` tag as a claim. Mark the ones that you doubt.

Then report:

```markdown
# Trim <target>

Before: <lines> lines, ~<tokens> tokens. Base <branch> at <sha>.

| Level | Lines | ~Tokens | Deleted (enforced / default / duplicate / stale) | Moved | New files |
|---|---|---|---|---|---|

Recommended: <level>, because <one sentence>.

## Doubtful tags
- <level>: "<line>" tagged <tag>: <why you doubt it>

## Proposed checks
- <check>: <baseline count>
```

Then ask the user which level to ship. The user can also take one level and change single lines.

## 4. Ship one level

1. Follow the branch rule of the repo. Copy the chosen diff from its worktree onto the branch. The Edit tool refuses to write through a symlink, so edit the real file.
2. Remove all three worktrees (`git worktree remove`), including the chosen one after the copy. Only the shipped change remains.
3. Open one PR with the template of the repo. Put the tagged list in the body, so that the reviewer reads one reason for each removed line. Put each proposed check in a separate PR, so that a noisy check can be reverted alone.
