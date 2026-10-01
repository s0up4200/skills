---
name: file-issue
description: Draft and file a GitHub issue in an upstream repository soup does not maintain. Use when the user says "file an issue", "report this upstream", "open an issue on <repo>", or asks whether a bug is worth reporting upstream.
---

# File issue

An upstream issue is public and read by maintainers who owe soup nothing. It names one bug in their code, carries its own proof, and passes their template and their bots on the first try. Nothing leaves this machine until soup reads the full draft and says "post it": that is the **post gate**.

## 1. Read the repository's rules

Read these from the repository's default branch before you write a word:

- `.github/ISSUE_TEMPLATE/`. For an issue form (`.yml`), each `label:` is a heading in the body, in order. Note the `labels:` key and every required field.
- `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`. If they restrict agent-filed issues, tell soup now. The default then becomes: soup files it, you hand over the text.
- Every workflow under `.github/workflows/` that triggers on `issues:`. Write down each check it runs and what it rejects (banned words in a field, missing labels, AI-style section names), and which events re-run it.
- Existing issues, open and closed: `gh search issues --repo <owner/repo> "<key terms>"`. A match ends the skill. Report its link instead.

Done when you can list every required field and every bot check.

## 2. Collect the evidence

Every required field gets a real value from a source you read: an API response, a log line, a version string. Reproduce on the repository's current default branch when the bug is in code you can build. Run the broken case, a control, and the fix if you have one, and record the timings or outputs side by side. Quote logs verbatim. Replace a private name with `<placeholder>` and change nothing else.

Done when no field holds a guess. Ask soup for any value you cannot read.

## 3. Draft

- Use the template headings, in order, and fill every required field.
- Describe only the upstream code path: the API call, the component, the event that misbehaves. Leave out soup's own tools and other third-party products.
- Put the upstream version number alone in the version field. Put branch names and build notes elsewhere, because bots match words like "develop" or "latest" there.
- Run `simple-english` and `unslop` on the prose.

Save the draft to the scratchpad and show it in full.

## 4. Post gate

Wait for soup to say "post it". Soup's edits restart this step. "Tell me what to do" means you give steps and a command soup runs with `!`, and you post nothing.

If the template adds labels, the web form is the only path that applies them. `gh issue create` files the issue with no labels, and some bots flag that. Say so and let soup choose the web form or `gh issue create --body-file`.

## 5. After posting

If step 1 found issue workflows, read the issue's labels and comments within two minutes. Report what each bot did, mapped to its check from step 1, with the exact fix. If a workflow triggers on `edited`, tell soup that a later body edit re-runs it.
