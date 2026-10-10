# Upstream sources

This file records the upstream commit, the local changes, and the license of each copied skill, so that you can compare the copies with upstream later.

## mattpocock/skills

The skills in `skills/mattpocock/` are copies of skills from [mattpocock/skills](https://github.com/mattpocock/skills).

**Upstream commit:** `b0618bc436ad893b3c5e84e55fba86586d34a404` (2026-10-08, v1.3.1 with unreleased changesets)

### Copied skills

Each skill is in `skills/mattpocock/<name>` here. The upstream path is:

- `skills/engineering/<name>`: ask-matt, code-review, codebase-design, diagnosing-bugs, domain-modeling, grill-with-docs, implement, implement-spec, improve-codebase-architecture, pr, prototype, research, retro, setup-matt-pocock-skills, tdd, to-spec, to-tickets, triage, wayfinder, wizard
- `skills/productivity/<name>`: grilling, handoff, teach, writing-for-agents

### Local changes

- `code-review`: step 6, "Act on the findings", comes from [mattpocock/skills#1044](https://github.com/mattpocock/skills/issues/1044). If upstream merges that issue, keep the upstream text.
- `pr`: the skill uses the PR template of the repository. The default body is one sentence. The evidence section lists only checks that CI cannot see. The prose goes through `simple-english` and `unslop` in a section before the template sections, so that the pass comes before the body is shown or posted. The skill offers to install them when they are missing.
- Glossary entries and ADRs are Domain Docs in the plan until implementation. `domain-modeling`, `grill-with-docs`, `wayfinder`, and `improve-codebase-architecture` record them in the ticket resolution or the spec. `triage` records them in the agent brief. `to-spec` has a Domain Docs section, and `to-tickets` adds each entry to the ticket whose code it describes. `implement` and `implement-spec` write them on the implementation branch with the code.
- `implement` tells the agent to call the Skill tool for `code-review`, so the departures step names `code-review` without a slash.
- `implement` uses the latest Agent Brief comment on an issue as the spec, and a later `Brief amendment` comment overrides it. The issue body and the other comments are context only.
- `implement` posts each spec decision that the user makes as a `Brief amendment` comment on the issue, so that the Spec reviewer of `code-review` sees the decision. The comment states each decision as an edit to the spec, not as a question and answer. A spec question that the agent answers itself stays a departure. The Spec reviewer lists each amendment that it used, so that the user can see an amendment that does not match an answer.
- `implement` lists each departure from the spec before the commit, and asks the user about each one with AskUserQuestion.
- `implement` finds the open children of a ticket before it starts, and asks the user which child to implement. On a tracker without sub-issues, such as Forgejo, a child has `Part of #<n>` on its first line, and the parent shows no link to it. That child is the spec and gets the Brief amendment.
- `code-review` diffs against `origin/<branch>` after a `git fetch` when the fixed point is the default branch, and against `HEAD` when the work is not committed. The Spec sub-agent gets only the spec and the diff, not the author's reasons for a departure. For an issue, the spec is the body and every comment, and a later Agent Brief or `Brief amendment` comment overrides earlier text.
- `tdd`: a seam that the existing tests of the area already use counts as confirmed, so the agent asks only about a new seam. Upstream `implement` runs tdd "at pre-agreed seams" without a stop, and upstream `tdd` tells the agent to confirm each seam with the user first. Upstream issue: [mattpocock/skills#479](https://github.com/mattpocock/skills/issues/479). If upstream fixes it, keep the upstream text. No comment is on #479 yet. After a `/retro` measures the effect of the line, post the result on #479. If the line does not help, revert it.
- `setup-matt-pocock-skills` treats a rerun as an upgrade. It keeps the recorded choices and custom text, and asks only about a convention that is missing or that conflicts. `ask-matt` tells the user to rerun it after a skill update.
- `setup-matt-pocock-skills` renames an old `CONTEXT.md` or `CONTEXT-MAP.md` to the `GLOSSARY` name with `git mv`, and updates the references to it. Upstream v1.3 tells users to do this rename by hand.
- A sixth triage role, `needs-grilling`, marks the maintainer's own idea that is parked until a `/grill-with-docs` session. `setup-matt-pocock-skills` adds it to `triage-labels.md` and creates each mapped label that the repo does not have. `ask-matt` tells the agent to file an own idea with this label, and to create the label in a repo that was set up before this change. `to-spec` closes the parked issue after it publishes the spec.
- `codebase-design` has a new `GUARDING.md`, and its "Going deeper" list points to it. The step applies when a session settles the seam of a deep module that hides an importable dependency. A background sub-agent finds the lint rule that blocks a bypass of the module, and the agent asks the user about it. `grilling` has one line that points to this step, so `grill-with-docs` gets it too.

### Skipped upstream changes

- `setup-matt-pocock-skills/SKILL.md`: upstream tells the agent to create each missing triage label with `gh label create` or `glab label create`. The local step already creates the missing labels after the user confirms, so the upstream line is not copied.
- `skills/in-progress/chief-of-staff`: the skill is in progress upstream. Copy it if it moves to `skills/engineering` or `skills/productivity`.

Upstream refers to some skills that are not copied here, for example `grill-me`, `to-questionnaire`, and `wait-what` in `ask-matt`.

### Compare with upstream

To see the upstream changes since the recorded commit (add `--stat` for a summary):

```sh
git clone https://github.com/mattpocock/skills.git /tmp/mattpocock-skills
cd /tmp/mattpocock-skills
git diff b0618bc..HEAD -- skills/engineering skills/productivity/grilling skills/productivity/handoff skills/productivity/teach skills/productivity/writing-for-agents
```

Apply the changes that you want. Then update the upstream commit in this file.

### License

The copied skills use the license of the upstream repository:

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## cursor/plugins

The skills in `skills/cursor/` are copies of skills from [cursor/plugins](https://github.com/cursor/plugins).

**Upstream commit:** `70b2dc8b4b85c8d5648624ca40d692c421fff32f` (2026-09-23)

### Copied skills

- `pstack/skills/unslop` is at `skills/cursor/unslop`.

### Local changes

- `unslop`: the frontmatter drops `disable-model-invocation: true`, so that the model can load the skill by itself.
- `unslop`: the frontmatter adds `model: sonnet`. In a test on one text, Sonnet removed the AI patterns as well as Opus, at a lower cost.

### Compare with upstream

```sh
git clone https://github.com/cursor/plugins.git /tmp/cursor-plugins
cd /tmp/cursor-plugins
git diff 70b2dc8b..HEAD -- pstack/skills/unslop
```

### License

The copied skills use the license of `pstack/LICENSE` in the upstream repository:

```
MIT License

Copyright (c) 2026 Lauren Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
