---
name: trim-agents-md
description: Audit every AGENTS.md and CLAUDE.md in a repo for stale and conflicting claims, restructure them at three levels (prune, disclose, index) in parallel subagents, and ship the level the user picks as one PR.
disable-model-invocation: true
argument-hint: "[path to one steering file, default: all in the repo] [--sessions]"
---

# Trim AGENTS.md

An always-loaded steering file costs context on every turn of every task, and a stale line in it sends every agent the wrong way. This skill finds the stale and conflicting lines first, then cuts the cost in three variants of rising depth. Each variant gives a **reason** for every line it removes, so the user can review the cut line by line. The user picks one variant, and only that one ships.

## 0. Load `writing-for-agents`

Call the Skill tool with `writing-for-agents`. Its terms govern this run: no-op, cache, sediment, context pointer, progressive disclosure, single source of truth.

## 1. Map the set

The **set** is every steering file in the repo (`git ls-files '*AGENTS.md' '*CLAUDE.md'`), plus the docs they point to, one hop deep. With a path argument, the set is that file and the docs it points to. A pointed doc that is not steering (a design doc, an ADR) gets the audit only, never a restructure. Collect these facts before any subagent starts, because each subagent needs all of them:

- **Readers.** For each file, record whether it is a symlink, an import (`@AGENTS.md`), or a real file. Codex reads `AGENTS.md`, and Claude Code reads `CLAUDE.md`. An `AGENTS.md` with no `CLAUDE.md` beside it is a finding. A nested file loads only when the agent works in its directory, and Codex reads only the files on the path from the repo root to its working directory. So a nested file is the place for rules about that area alone, and the root file keeps a pointer to it.
- **Enforcers.** The linter configs, pre-commit config, CI workflows, and `Makefile` or `package.json` scripts. A line that one of these enforces is a no-op. A lint rule enforces only at error level, or when CI fails on warnings.
- **Standards home.** An existing `CODING_STANDARDS.md` or `docs/` folder. Use the layout of the `review-retro` skill when nothing exists: `CODING_STANDARDS.md` as an index of pointers, and the rules in `docs/standards/<area>.md`. Check `.gitignore` for that path.
- **Size.** Lines and bytes of each file (`wc -lc`). Estimate tokens as bytes / 4.
- **Base.** The default branch and its HEAD SHA.

With `--sessions`, also run `python3 -I ~/.agents/skills/findability/scripts/sessions.py <repo> -n 10 --out <scratchpad>/trim-sessions`. Read the digests for two signals: a rule that agents broke anyway (it needs a check, not a sentence), and a rule that no session touched (a no-op candidate, not proof).

The set can be outside a repo, for example a global instructions file. In that case, there is no PR. Step 5 shows the diff, and the user applies it.

Done when every fact above is written down.

## 2. Audit the claims

Stale lines are facts, not a level, so every variant fixes the same ones. Audit once, before the variants. When the set is larger than about 40 KB, split it over subagents by file.

1. List every **checkable claim** in the set: a path, a command, a `make` target, a script name, a flag, an environment variable, a config key, a version, a type or function name, and every statement of how the code behaves.
2. Check each claim against the base SHA. Run the command with `--help` or a dry run, open the path, grep for the name, read the code for a behaviour claim.
3. Check the configs that repeat steering text, for example `.coderabbit.yaml` path instructions or a reviewer prompt. A stale claim there gets the same fix.
4. Compare the files with each other. A nested file that repeats a root line is a duplicate. A nested file that contradicts a root line, or two lines that contradict each other, is a **conflict**.

Record each finding as: file:line, the claim, the evidence, and the fix. Do not resolve a conflict yourself, because only the user knows which side is the current rule. Mark it for the user.

Done when every checkable claim is marked true, stale, or conflict.

## 3. Three variants in parallel

Make three detached worktrees at the base SHA: `git -C <repo> worktree add --detach <path>/<level> <sha>`. Do not use `isolation: "worktree"`, because it copies the session's repo at its current HEAD, not the target repo at the base. Send three subagents in one turn, one per worktree, on Opus. Give each one the same prompt with a different level:

- **prune:** apply the audit fixes, and delete no-ops. Move nothing.
- **disclose:** prune, then move review-only rules to the standards home, move area rules from the root file to the nested file of that area, and move procedures that only one kind of task needs into a doc behind a pointer.
- **index:** disclose, then cut each file to pointers plus the facts that most tasks in its scope need. Aim for 40 lines or fewer per file.

Prompt (fill in the brackets):

```text
Restructure the steering files <set> at level <level>, in your worktree <path>. Work only there. Do not commit or push.
First call the Skill tool with writing-for-agents and apply it.
Facts: <the step 1 map: readers, enforcers, standards home, sizes, base SHA, and session signals when present>.
Audit: <the step 2 findings>. Apply every stale fix. Leave each conflict as it is and list it.
Levels: prune = audit fixes and no-op deletions, move nothing. disclose = prune, then move review-only rules to <standards home>, area rules from the root file to the nested file of that area, and single-task procedures into docs behind pointers. index = disclose, then keep only pointers plus the facts most tasks in each file's scope need, 40 lines or fewer per file.

Every line you delete or move gets exactly one tag:
- enforced: <config path and rule> (verify it: the rule is on, and it covers this case)
- default: the model does this without the line
- duplicate: <file:line> that says the same thing
- stale: <the audit finding>
- moved: <new path>
A line with no tag that you can prove stays where it is.

Write-time rules: a rule that prevents damage while code is written (data loss, real network calls in tests, editing migrations, secrets, destructive commands) must stay readable at write time. Keep it in a steering file, move it to the nested file beside the code it governs with a pointer from the root file, or propose a check that enforces it. Never delete it, and never move it to a file that only review reads.

Each pointer names the material and the condition for reading it, with the condition first. The Edit tool refuses to write through a symlink, so edit the real file.

Return:
1. lines and bytes of each file before and after, and of every file you created
2. the tagged list: file:line, original line (clipped to 100 characters), tag
3. the write-time rules and where each one went
4. any check you propose instead of a sentence, with its baseline count on the current tree
5. the worktree path
```

Done when all three subagents have returned.

## 4. Compare and verify

Verify the tags yourself. A wrong tag deletes a rule that agents still need.

1. For each `enforced` tag, open the config and confirm that the rule is on.
2. For each `duplicate` tag, open the other line.
3. For each `moved` tag, confirm that the text is in the new file and that a pointer reaches it.
4. Read the write-time list of each variant against the original files. A write-time rule that the variant dropped, or moved to a nested file with no pointer from the root file, disqualifies it until the rule is back.
5. Treat every `default` tag as a claim. Mark the ones that you doubt.

Then report:

```markdown
# Trim <repo>

Before: <files> files, <lines> lines, ~<tokens> tokens. Base <branch> at <sha>.

## Stale and conflicting
- <file:line> "<claim>": <evidence>. Fix: <fix>.
- Conflict: <file:line> says X, <file:line> says Y. Which is the rule?

| Level | Lines | ~Tokens | Deleted (enforced / default / duplicate / stale) | Moved | New files |
|---|---|---|---|---|---|

Recommended: <level>, because <one sentence>.

## Doubtful tags
- <level>: <file:line> "<line>" tagged <tag>: <why you doubt it>

## Proposed checks
- <check>: <baseline count>
```

Then ask the user which level to ship and how to settle each conflict. The user can also take one level and change single lines. The stale fixes can ship alone, without any level.

## 5. Ship one level

1. Follow the branch rule of the repo. Copy the chosen diff from its worktree onto the branch, with the conflicts settled as the user said.
2. Remove all three worktrees (`git worktree remove`), including the chosen one after the copy. Only the shipped change remains.
3. Open one PR with the template of the repo. Put the tagged list in a collapsed `<details>` block under a one-sentence summary, so that the reviewer reads one reason for each removed line. Put each proposed check in a separate PR, so that a noisy check can be reverted alone.
