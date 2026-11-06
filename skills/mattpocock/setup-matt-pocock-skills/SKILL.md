---
name: setup-matt-pocock-skills
description: "Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, domain doc layout, module design rules, and check command in AGENTS.md. Run in a new project or before first use, or rerun to upgrade an existing setup."
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Configure or upgrade the per-repo configuration that the engineering skills assume:

- **Issue tracker**: where issues live (GitHub, GitLab, Forgejo, or local Markdown)
- **Triage labels**: the strings used for the six canonical triage roles
- **Domain docs**: where `GLOSSARY.md` and ADRs live, and the consumer rules for reading them
- **Module design**: the deep-module rules that every agent in the repo writes code by
- **Check**: the one command that gates a commit

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config`: which host and repository does this clone use? Read any recorded tracker choice.
- `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, and `CLAUDE.local.md` at the repo root: which exist, and is each a real file, a symlink, or a `CLAUDE.md` that only imports `@AGENTS.md`? Is there already an `## Agent skills`, `## Module design`, or `## Check` section?
- Does the repo have code yet? `git ls-files` shows source files beyond docs and config.
- The check command: the command that CI runs on each push (`.github/workflows/`, `.forgejo/workflows/`, `.gitlab-ci.yml`), a root `check.sh`, or a `check` target in the `Makefile` or `package.json` scripts.
- `GLOSSARY.md` and `GLOSSARY-MAP.md` at the repo root. A `CONTEXT.md` or `CONTEXT-MAP.md` there is the same file under its old name: the skills read only the `GLOSSARY` names.
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/`: does this skill's prior output already exist?
- `.scratch/`: a sign that a local-markdown issue tracker convention is already in use
- Is the `triage` skill installed? (a `triage` skill folder alongside this one, or `triage` in your available skills.) This decides whether Section B runs at all.
- Monorepo signals: a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. These are present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.

If `docs/agents/` already has this skill's files, this run is an upgrade. Keep the recorded choices and any custom text in those files. In step 2, ask only about a convention that is missing or that conflicts with the files. In step 3, show only the changes, not full drafts. If nothing is missing, say so and change nothing.

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order. One section, one answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when `triage` isn't installed, Section C when there's no monorepo).

**Section A: Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets`, `triage`, and `to-spec` read from and write to it. They need to know whether to call `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: these skills were designed for GitHub. If a `git remote` points at GitHub, propose that. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. If the existing tracker document identifies Forgejo, keep that choice. An unfamiliar remote host alone does not identify its forge. Otherwise (or if the user prefers), offer:

- **GitHub**: issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **GitLab**: issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
- **Forgejo**: issues live in the repo's Forgejo issues (uses the `fj` CLI)
- **Local markdown**: issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
- **Other** (Jira, Linear, etc.): ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

Record the choice in `docs/agents/issue-tracker.md`. The GitHub, GitLab, and Forgejo templates carry a "PRs as a request surface" flag, defaulted **off**. Leave it off and don't raise it: a user who wants external PRs in the triage queue can flip the flag in the file later.

A GitHub, GitLab, or Forgejo tracker needs a reachable repo. When the user picks one and no `git remote` points at that host, get the repo URL from them and wire it up (`git init` if needed, `git remote add origin <url>`) before going further. Done when `gh repo view` / `glab repo view` / `fj repo view` prints the project from inside this directory; if it can't, stop and tell the user what's missing.

**Section B: Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't installed (exploration told you), since an uninstalled skill needs no labels.

If it is installed, ask exactly one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are the six canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, `needs-grilling`. On **yes**, write them as-is. Only if the user says no, usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`), collect the overrides so `triage` applies existing labels instead of creating duplicates.

The other skills apply existing labels. This setup creates missing labels after confirmation. Read the existing labels with the selected tracker's commands: `gh label` for GitHub, `glab label` for GitLab, or the Forgejo template's **Label setup** operation. List each missing label in the step 3 draft. When the user confirms, create only those labels with the same tracker. Local Markdown stores roles as text and needs no label creation.

**Section C: Domain docs.** Default to **single-context** (one `GLOSSARY.md` + `docs/adr/` at the repo root). This fits almost every repo; write it without asking.

If exploration found `CONTEXT.md` or `CONTEXT-MAP.md`, rename it with `git mv` to `GLOSSARY.md` or `GLOSSARY-MAP.md`. Then update every reference to the old name in `docs/agents/`, `AGENTS.md`, and `CLAUDE.md`. Include the rename in the draft of step 3.

Offer **multi-context** (a root `GLOSSARY-MAP.md` pointing to per-context `GLOSSARY.md` files) only when exploration found monorepo signals. Then confirm which layout they want.

**Section D: Module design.** In a repo with no code yet, write the section without asking. In a repo with code, ask exactly one question:

> Add the module design rules to the instructions file? (recommended: **yes**)

Ask because existing code can break the rules, for example an interface with one implementation, and a later agent then reads the rules as a call to refactor that code.

**Section E: Check.** When exploration found exactly one gate command, write the `## Check` section with it. When it found several, ask which one gates a commit. When it found none, leave the section out: a placeholder is a stale line on every turn, and a rerun adds the section once the command exists.

### 3. Confirm and edit

Show the user a draft of:

- The file change from step 4: a new `AGENTS.md`, or the proposed `git mv CLAUDE.md AGENTS.md`
- The `## Check`, `## Module design`, and `## Agent skills` sections for the instructions file
- The contents of `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and `docs/agents/triage-labels.md` (the last only when `triage` is installed)

Let them edit before writing.

### 4. Write

**Pick the file to edit.** Write the instructions to `AGENTS.md`, so that every coding agent reads one file. Codex reads only `AGENTS.md`. Claude Code v2.1.277 and later reads `AGENTS.md` when no `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` is in the working directory or above it ([docs](https://code.claude.com/docs/en/memory#agents-md)).

- Neither file exists: create `AGENTS.md`.
- `AGENTS.md` is the real file: edit it. A `CLAUDE.md` that is a symlink to it, or that imports `@AGENTS.md`, stays as it is.
- Only `CLAUDE.md` exists: propose `git mv CLAUDE.md AGENTS.md` in the step 3 draft. On a yes, move it and edit `AGENTS.md`. On a no, edit `CLAUDE.md`.
- `CLAUDE.md` is the real file and `AGENTS.md` is a symlink to it: edit `CLAUDE.md`, because the Edit tool refuses to write through a symlink.
- Both are real files with different text: each tool reads only one of them. Show the user the difference and ask which to keep, then write to that one.

If a `CLAUDE.local.md` sits next to `AGENTS.md`, tell the user that Claude Code then reads `CLAUDE.md` files only and skips `AGENTS.md`.

If a section already exists in the chosen file, update its contents in place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The sections, in this order. Leave out `## Check` and `## Module design` when Sections D and E left them out:

```markdown
## Check

Run `<command>` before you commit.

## Module design

- Build deep modules: a lot of behaviour behind a small interface. Before you
  add a wrapper or helper, apply the deletion test: keep it only if deleting
  it would spread complexity across its callers.
- Add a seam only where two adapters vary across it, usually production
  plus a test fake.
- Pass dependencies in, and return results.
- Use a reducer when state is several flags that can contradict each other.
- The interface is the test surface. After you deepen a module, replace the
  tests of its old shallow parts with tests at the new interface.

## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout: "single-context" or "multi-context"]. See `docs/agents/domain.md`.
```

Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section B ran. When it isn't, both are omitted.

Then write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md): GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md): GitLab issue tracker
- [issue-tracker-forgejo.md](./issue-tracker-forgejo.md): Forgejo issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md): local-markdown issue tracker
- [triage-labels.md](./triage-labels.md): label mapping (only if `triage` is installed)
- [domain.md](./domain.md): domain doc consumer rules + layout

For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files. Mention they can edit `docs/agents/*.md` directly later; rerun this skill after a skill update to upgrade the setup.
