---
name: sync-upstream
description: Sync the copied skills in s0up4200/skills with a new upstream release. Asks about each change before it applies it, lists the repos that the migration notes affect, and recommends how the release changes the user's workflow.
disable-model-invocation: true
argument-hint: "[mattpocock|cursor, default mattpocock]"
---

# Sync upstream

Bring the copies in `skills/<source>/` up to upstream HEAD, with only the changes the user accepts, and tell the user what the release changes in how they work. Run it in `~/github/soup/skills`.

`UPSTREAM.md` is the source of truth for each source: the recorded upstream commit, the copied skills and their upstream paths, and the local changes. Read its section for the source before you start.

## 1. Read the release

Clone the upstream repository into the scratchpad. Read the `CHANGELOG.md` entries after the recorded commit. If upstream has no changelog (`cursor/plugins` has none), read `git log <recorded>..HEAD` for the copied paths instead. Then run the diff command from `UPSTREAM.md`. If HEAD is the recorded commit, tell the user that nothing is new and stop.

Then run `diff -ru` between each copied skill and its upstream path at HEAD. Sort each difference and each changelog entry into one of these kinds:

- An upstream change to a copied skill.
- A conflict: an upstream change and a local change that `UPSTREAM.md` records touch the same lines.
- Drift: a local difference that `UPSTREAM.md` does not record.
- A new, graduated, or removed skill.
- A migration note: a step the release asks of every repo that uses the skills, for example "rename `CONTEXT.md` to `GLOSSARY.md`". Search this repo for the old name, including the skills that are not copies (for example `findability`) and `~/.claude/CLAUDE.md`.

A local change that upstream did not touch stays as it is. It needs no question.

Change no file in this step.

## 2. Scan the usage

Run the script with the copied skills folder:

```sh
python3 scripts/usage.py skills/<source>
```

It reads all Claude Code and Codex sessions of the last 30 days. It counts slash commands, a `/name` typed inside a message, and Skill tool calls, and it names the top projects per skill. Use the full window: the last 25 sessions often cover only a few hours, and the user works across many repos.

## 3. Ask about each change

Call the Skill tool with "grilling". Each item from step 1 is one question, with your recommended answer:

- Upstream change: take it or skip it.
- Conflict: show both versions and your merge.
- Drift: record it as a local change, or replace it with upstream.
- New skill: copy it or not. Removed skill: delete the copy or keep it.
- Migration note: fix the references in this repo, and add the step to a copied setup skill if upstream asks users to migrate by hand.

Base each recommendation on the usage from step 2, for example "take it: you run `retro` in 21 sessions a month". Show the diff for a change of more than a few lines.

The step is done when every item has an answer and the user confirms the list.

## 4. Apply the accepted changes

Apply only the answers from step 3. Then update `UPSTREAM.md`: the full commit SHA, its date and version, the diff command, each new local change, and each upstream change that the user skipped, so that the next sync does not ask again.

The step is done when every remaining line of `diff -ru` is a recorded local change or a recorded skip.

## 5. Commit and install

Run the commit gate from the global `CLAUDE.md`. This repo commits straight to `main`. Then copy each changed skill folder to `~/.agents/skills/<name>` with `rsync -a --delete`, and make sure with `diff -rq` that the copies match. `~/.claude/skills` holds symlinks to `~/.agents/skills`, so one copy serves both tools.

The HTTPS push can wait on a credential prompt that has no terminal. If `git push` does not finish in 30 seconds, stop it and ask the user to run `! git -C ~/github/soup/skills push`.

## 6. Find the affected repos

An accepted migration note also applies to the user's other repos. Search `~/github`, `~/jobb`, and `~/Fiken` for the old name: files, and references in `docs/agents/`, `AGENTS.md`, and `CLAUDE.md`. Leave out git worktrees, clones of the upstream, and repos the user does not own. Do not change these repos in this skill. Each one needs its own branch, and some need a PR.

## 7. Report

Give the user:

1. The sync: the new upstream commit, the changes taken and skipped, and the local changes kept.
2. The workflow changes: link each accepted change to the usage numbers. A change to a skill that the user runs often matters most. A new step that belongs after a skill they run often, or a new skill that replaces a sequence they repeat, comes next. Name the numbers, for example "`code-review` ran in 324 sessions, `retro` in 21".
3. The migration: the affected repos from step 6, ranked by the sessions of the affected skills in each repo, from the top projects in step 2.

End with a "You need to do:" list: the push if it failed, and the migration batch with your pick of repos to start with.
