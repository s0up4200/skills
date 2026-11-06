# Research: does Claude Code read AGENTS.md?

Date: 2026-11-06

Done on 2026-11-06: `trim-agents-md` got a shorter form of the replacement text below, without the untested nested case. `setup-matt-pocock-skills` now writes `AGENTS.md`.

Scope: the claim in `skills/trim-agents-md/SKILL.md` line 20: "Codex reads `AGENTS.md`, and Claude Code reads `CLAUDE.md`. An `AGENTS.md` with no `CLAUDE.md` beside it is a finding." The sources are the Claude Code memory docs and glossary (read 2026-11-06), `CHANGELOG.md` on `anthropics/claude-code` `main` (head entry 2.1.318), and the bundled JS in an installed Claude Code 2.1.318 binary (read with `strings`, not run). "Source" lines give what a source says. "Inference" lines give my reading.

## Summary

- Yes. Since v2.1.277, Claude Code reads `AGENTS.md` by default, with no import and no setting. A built-in plugin, `cc-plugin-agents-md@builtin`, does it.
- The default is a fallback, not a merge. Claude reads `AGENTS.md` only when no `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` is in the working directory or above it. When one is there, Claude reads the `CLAUDE.md` files only.
- It reads `AGENTS.md` and `.claude/AGENTS.md` in the working directory and its ancestors at start, and a subdirectory's `AGENTS.md` lazily, on a Read in that directory. It does not read `AGENTS.override.md`, `AGENTS.local.md`, or `.agents/`.
- A `CLAUDE.md` that is a symlink to `AGENTS.md`, or that imports it with `@AGENTS.md`, loads the content once. The code drops a second file with the same path or the same trimmed content.
- `/init` still writes `CLAUDE.md`.
- The docs say an `AGENTS.md` alone now works. They recommend an `@AGENTS.md` import in `CLAUDE.md` when a repo also needs Claude-only text, a symlink when it does not, and the import over the symlink when anyone clones on Windows.
- Effect: line 20 is out of date. An `AGENTS.md` alone is no longer a finding. Two files with different content still are, and so is a nested `AGENTS.md` under a root `CLAUDE.md`.

---

## 1. Claude Code reads AGENTS.md by default since v2.1.277

Confidence: high.

Source:

- CHANGELOG 2.1.277: "Added AGENTS.md support: in a project with no CLAUDE.md, Claude Code reads AGENTS.md instead; change it under "Project instructions" in `/config`". https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- CHANGELOG 2.1.281: "Changed AGENTS.md support to also work on Amazon Bedrock, Google Vertex AI, Microsoft Foundry, LLM gateways, and sessions with telemetry disabled".
- Memory docs, section "AGENTS.md": "Claude Code can read `AGENTS.md` as your project instructions, so a repository already set up for other coding agents works without adding a `CLAUDE.md`, an import, or a setting." And: "Reading `AGENTS.md` directly requires Claude Code v2.1.277 or later." https://code.claude.com/docs/en/memory#agents-md
- Memory docs, "When AGENTS.md support is unavailable": Claude reads `CLAUDE.md` only when "You're on a Claude Code version before v2.1.277", when "You used `/plugin` to disable the built-in plugin that reads `AGENTS.md`", and "In some cases, it's your first session after you upgrade from v2.1.276 or earlier."
- Memory docs: the setting lives in `pluginConfigs` "under `cc-plugin-agents-md@builtin`, the ID of the built-in plugin that reads `AGENTS.md`", and Claude Code "ignores it in project and local settings files". "Before v2.1.285, the plugin's ID was `agents-md@builtin`".
- Binary 2.1.318: `var qUo=!0;var YUo=()=>an("tengu_agents_md_mod",qUo);var uvt="cc-plugin-agents-md";`, and the plugin text: "AGENTS.md as project instructions: by default loaded where the project has no CLAUDE.md".

Inference. It is on by default. A remote flag (`tengu_agents_md_mod`, default true) gates it too. A repo cannot turn it off for its users, because project settings do not carry the option.

## 2. Locations: ancestors at start, subdirectories lazily, no user-level file

Confidence: high for the docs text. Medium for the user-level point.

Source:

- Memory docs, "When Claude Code reads AGENTS.md": "At session start: every `AGENTS.md` and `.claude/AGENTS.md` in your working directory and the directories above it." "As Claude works in subdirectories: a subdirectory's `AGENTS.md`, when Claude opens a file there with the Read tool and that subdirectory has none of the three `CLAUDE.md` files of its own." "Inside each `AGENTS.md`: `@path` imports are expanded, `claudeMdExcludes` patterns apply". "Not read: `AGENTS.local.md`, `AGENTS.override.md`, or anything under a `.agents/` directory".
- Memory docs, for comparison: a subdirectory `CLAUDE.md` loads "once Claude reads, writes, or edits another file in that subdirectory".
- CHANGELOG 2.1.290: "Fixed a subdirectory's AGENTS.md not being attached when a file under it is @-mentioned".
- Binary 2.1.318: `var Bmn=["AGENTS.md",".claude/AGENTS.md"];var mvt=["CLAUDE.md",".claude/CLAUDE.md","CLAUDE.local.md"];`
- Memory docs, the files that do not stop the fallback: "your `~/.claude/CLAUDE.md`, your organization's managed `CLAUDE.md`, and `.claude/rules/` files".

Inference. The docs name no user-level `AGENTS.md`, and the plugin has no `~/.claude/AGENTS.md` entry. But the ancestor walk looks for `.claude/AGENTS.md` in each directory above the working directory. For a repo under `~`, that walk can reach `~/.claude/AGENTS.md`. Unsettled: I did not run a session to test it. A nested `AGENTS.md` loads on a Read only. A `CLAUDE.md` also loads on a write or an edit.

## 3. Both files: the default reads CLAUDE.md only, and a link or import loads once

Confidence: high for the docs. Medium-high for the code reading.

Source:

- Memory docs, table: "An `AGENTS.md` and a `CLAUDE.md` or `CLAUDE.local.md` in your working directory or above it" → "Your `CLAUDE.md` files only". "A `CLAUDE.md` that already imports `AGENTS.md`" → "Your `CLAUDE.md`, with `AGENTS.md` included through the import".
- Memory docs, "Choose which instruction files load", the values of **Project instructions**: `claude-md-or-agents-md` ("This is the default"), `claude-md-and-agents-md` ("each directory's `CLAUDE.md` files first and its `AGENTS.md` after them. Claude Code skips an `AGENTS.md` it has already loaded, so one that your `CLAUDE.md` imports or symlinks to isn't read twice"), `claude-md`, and `managed-only`.
- Memory docs, "Remove an earlier AGENTS.md workaround": "A `CLAUDE.md` containing `@AGENTS.md`: you can leave it. Keeping the import never makes Claude read `AGENTS.md` twice, whichever **Project instructions** value you use." "A `CLAUDE.md` symlinked to `AGENTS.md`: nothing, or delete the symlink. Either way Claude reads the content once." "A `SessionStart` hook that prints `AGENTS.md`: remove it. Once Claude reads `AGENTS.md` directly, the hook adds a second copy to the context."
- Memory docs, a trap: "Because `CLAUDE.local.md` counts, adding one to keep your own uncommitted instructions in a project that relies on `AGENTS.md` stops Claude from reading `AGENTS.md` for you."
- Binary 2.1.318, the dedupe (`unseenFiles`): `function jmn(t,o){let e=new Set(o.map((i)=>oPe(i.path))),n=new Set(o.filter(pvt).map((i)=>i.content.trim())),...if(!(e.has(s)||m!==""&&n.has(m)))e.add(s),r.push(i)}`

Inference. The code drops an `AGENTS.md` whose path or trimmed content matches a project `CLAUDE.md` that is already loaded. So a symlink in either direction loads once. This repo has a real `CLAUDE.md` and `AGENTS.md` → `CLAUDE.md`, so the default mode reads `CLAUDE.md` only, and the content loads once. From the docs, in the default mode, a root `CLAUDE.md` also stops a nested `AGENTS.md` that has no `CLAUDE.md` beside it, because the subdirectory rule applies only "When none count". I did not test that case in a session.

## 4. `/init` writes CLAUDE.md

Confidence: high.

Source:

- Memory docs: "Run `/init` to generate a starting CLAUDE.md automatically." "Running `/init` reads other tools' instruction files and incorporates the relevant parts into the generated `CLAUDE.md`", with `AGENTS.md` in that list only "With `CLAUDE_CODE_NEW_INIT=1` set".
- Commands docs: "Run `/init` to generate a starter `CLAUDE.md`". https://code.claude.com/docs/en/commands
- Binary 2.1.318, the `/init` prompt: "Please analyze this codebase and create a CLAUDE.md file, which will be given to future instances of Claude Code to operate in this repository."
- Memory docs: "`/import` ... appends a one-time copy of instruction files such as `AGENTS.md` to the matching `CLAUDE.md`".

Inference. In a repo with only `AGENTS.md`, `/init` creates a `CLAUDE.md`. From then on, the default mode reads that `CLAUDE.md` and stops reading `AGENTS.md`.

## 5. What the docs recommend for a repo shared with other tools

Confidence: high.

Source:

- Glossary, "AGENTS.md": "If your repository has one and no CLAUDE.md, Claude reads it as your project instructions without you adding a second file." https://code.claude.com/docs/en/glossary#agents-md
- Memory docs, "Share one file with other coding tools": "When Claude isn't reading your `AGENTS.md` directly, you can still keep it as the one file every tool shares by putting an `@AGENTS.md` import in a `CLAUDE.md` next to it. Do this when your project also has a `CLAUDE.md`, when you've set **Project instructions** to `claude-md`, or in sessions that can't load `AGENTS.md`." "If you don't need Claude-specific content, a symlink also works: `ln -s AGENTS.md CLAUDE.md`".
- Same section, against the symlink: the Edit and Write tools "refuse to write through a symlink, and the refusal directs Claude to edit the link's target", and "if you or anyone who clones the repository works on Windows, use the `@AGENTS.md` import instead".
- "Remove an earlier AGENTS.md workaround": keep a `CLAUDE.md` with `@AGENTS.md` "if some of your sessions can't load `AGENTS.md` directly".

Inference. An `AGENTS.md` alone is now a supported setup. A `CLAUDE.md` with `@AGENTS.md` still helps for users on a version before v2.1.277, and for users with **Project instructions** set to `claude-md`. A `CLAUDE.md` with its own text next to an `AGENTS.md` with other text is the setup that splits the tools: Claude Code reads one file, and Codex reads the other.

---

## Effect on this repo

Line 20 of `skills/trim-agents-md/SKILL.md` is out of date. Replace the two sentences "Codex reads `AGENTS.md`, and Claude Code reads `CLAUDE.md`. An `AGENTS.md` with no `CLAUDE.md` beside it is a finding." with:

> Codex reads `AGENTS.md`. Claude Code v2.1.277 and later reads `AGENTS.md` too, but by default only where no `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` is in the working directory or above it. Otherwise it reads `CLAUDE.md` alone ([docs](https://code.claude.com/docs/en/memory#agents-md)). So an `AGENTS.md` alone is fine. A `CLAUDE.md` and an `AGENTS.md` with different text are a finding, because each tool sees only its own file. So is a nested `AGENTS.md` with no `CLAUDE.md` beside it under a root `CLAUDE.md`. The fix is a `CLAUDE.md` that starts with `@AGENTS.md`, or a symlink to it. Claude Code loads that content once.

An `AGENTS.md` with no `CLAUDE.md` beside it is no longer a finding by itself. It stays a finding in two cases: when a `CLAUDE.md` higher up the tree hides it from Claude Code, and when the repo must support Claude Code before v2.1.277.

Unsettled:

- Whether `~/.claude/AGENTS.md` loads through the ancestor walk for a repo under `~`. I read the code, and did not run a session.
- Whether a root `CLAUDE.md` stops a nested `AGENTS.md` in a session. The docs imply it. I did not test it.
