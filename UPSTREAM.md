# Upstream sources

This file records the upstream commit, the local changes, and the license of each copied skill, so that you can compare the copies with upstream later.

## mattpocock/skills

The skills in `skills/mattpocock/` are copies of skills from [mattpocock/skills](https://github.com/mattpocock/skills).

**Upstream commit:** `5beb35b040e3de97e54fa9e386d7e42d15c295c2` (2026-10-19, v1.3.1 with unreleased changesets)

### Copied skills

Each skill is in `skills/mattpocock/<name>` here. The upstream path is:

- `skills/engineering/<name>`: ask-matt, code-review, codebase-design, diagnosing-bugs, domain-modeling, grill-with-docs, implement, implement-spec, improve-codebase-architecture, pr, prototype, research, retro, setup-matt-pocock-skills, tdd, to-spec, to-tickets, triage, wayfinder, wizard
- `skills/productivity/<name>`: grill-me, grilling, handoff, teach, writing-for-agents

### Local changes

- `code-review`: step 6, "Act on the findings", comes from [mattpocock/skills#1044](https://github.com/mattpocock/skills/issues/1044). If upstream merges that issue, keep the upstream text.
- `pr`: the skill uses the PR template of the repository. The default body is one sentence. The evidence section lists only checks that CI cannot see. The prose goes through `simple-english` and `unslop` in a section before the template sections, so that the pass comes before the body is shown or posted. The skill offers to install them when they are missing.
- Glossary entries and ADRs are Domain Docs in the plan until implementation. `domain-modeling`, `grill-with-docs`, `wayfinder`, and `improve-codebase-architecture` record them in the ticket resolution or the spec. `triage` records them in the agent brief. `to-spec` has a Domain Docs section, and `to-tickets` adds each entry to the ticket whose code it describes. `implement` and `implement-spec` write them on the implementation branch with the code.
- `implement` tells the agent to call the Skill tool for `code-review`, so the departures step names `code-review` without a slash.
- `implement` uses the latest Agent Brief comment on an issue as the spec, and a later `Brief amendment` comment overrides it. The issue body and the other comments are context only.
- `implement` reads the parent issue in full for the decisions that apply to the ticket, and builds only what the ticket asks for. `to-tickets` writes into each ticket every decision of the source that applies to it, because the Spec reviewer of `code-review` checks the code against the ticket only.
- `implement` posts each spec decision that the user makes as a `Brief amendment` comment on the issue, so that the Spec reviewer of `code-review` sees the decision. The comment states each decision as an edit to the spec, not as a question and answer. A spec question that the agent answers itself stays a departure. The Spec reviewer lists each amendment that it used, so that the user can see an amendment that does not match an answer.
- `implement` lists each departure from the spec before the commit, and asks the user about each one with AskUserQuestion.
- `implement` runs the test gate of the agent's instructions at the end, in place of the full test suite. It runs the full suite only when the instructions define no test gate.
- `implement` and `implement-spec` call `field-test` on a local rig when the repo instructions ask for a live run, or the change is visible in the UI. `implement` calls it before `code-review`. `implement-spec` calls it once on the integration branch, in the main agent, after the code-review fixes, because parallel rigs compete for ports and browser tabs and only the main agent can ask the user. A run on the production host needs the PR image from CI, so it comes after the push.
- `implement` finds the open children of a ticket before it starts, and asks the user which child to implement. On a tracker without sub-issues, such as Forgejo, a child has `Part of #<n>` on its first line, and the parent shows no link to it. That child is the spec and gets the Brief amendment.
- `code-review` picks the fixed point in three cases. If the fixed point is the default branch, it fetches the branch and diffs against `<remote>/<branch>`. If the user names a pull request, it stops when the working tree has changes. Otherwise it checks the pull request out (`gh` on GitHub, `fj` on Forgejo) and diffs against `<remote>/<base>`. If the work is not committed, it diffs against `HEAD`. `<remote>` is `origin`, or the remote of the parent repository in a fork clone. If no remote points at the parent, it adds one named `upstream`. The Spec sub-agent gets only the spec and the diff, not the author's reasons for a departure. For an issue, the spec is the body and every comment, and a later Agent Brief or `Brief amendment` comment overrides earlier text.
- `code-review` reads the PR discussion (body, conversation comments, reviews, and inline review comments) in full, and marks each finding that a comment requested, answered, or raised before. The sub-agents do not get the discussion, because it holds the author's reasons.
- `code-review` reads the PR discussion through `scripts/pr-discussion.sh`, which writes plain text with each body whole. The old snippet wrote two JSON documents into one file, and jq could not parse the file.
- `code-review` records the current branch before it checks out a pull request, and switches back to it after the report when the working tree is clean. When the tree has changes, it names the current branch and gives the command that goes back.
- `code-review` checks at the source each severity claim that depends on a runtime default, a configuration value, or the behaviour of a caller, before the finding becomes the worst finding or a decision for the user. A sub-agent called a failed read "silent at the default log level", but DEBUG was the default level of the app, so the headline was wrong.
- `code-review` starts the report with one sentence that gives the count of findings and the worst finding on each axis, before the two reports.
- `tdd`: a seam that the existing tests of the area already use counts as confirmed, so the agent asks only about a new seam. Upstream `implement` runs tdd "at pre-agreed seams" without a stop, and upstream `tdd` tells the agent to confirm each seam with the user first. Upstream issue: [mattpocock/skills#479](https://github.com/mattpocock/skills/issues/479). If upstream fixes it, keep the upstream text. No comment is on #479 yet. After a `/retro` measures the effect of the line, post the result on #479. If the line does not help, revert it.
- `setup-matt-pocock-skills` treats a rerun as an upgrade. It keeps the recorded choices and custom text, and asks only about a convention that is missing or that conflicts. `ask-matt` tells the user to rerun it after a skill update.
- `setup-matt-pocock-skills` renames an old `CONTEXT.md` or `CONTEXT-MAP.md` to the `GLOSSARY` name with `git mv`, and updates the references to it. Upstream v1.3 tells users to do this rename by hand.
- A sixth triage role, `needs-grilling`, marks the maintainer's own idea that is parked until a `/grill-with-docs` session. `setup-matt-pocock-skills` adds it to `triage-labels.md` and creates each mapped label that the repo does not have. `ask-matt` tells the agent to file an own idea with this label, and to create the label in a repo that was set up before this change. `to-spec` closes the grilled issue after it publishes the spec.
- `codebase-design` has a new `GUARDING.md`, and its "Going deeper" list points to it. The step applies when a session settles the seam of a deep module that hides an importable dependency. A background sub-agent finds the lint rule that blocks a bypass of the module, and the agent asks the user about it. `grilling` has one line that points to this step, so `grill-with-docs` gets it too.
- `grilling` tells the agent to read the current reference of an external API, library, or tool before it recommends a design that depends on how it behaves, also when the repo already uses it. Without the line, the agent recommended a deprecated endpoint only because the repo code already used it.
- `grilling` tells the agent to replay a proposed rule against the history of a live system before it recommends the rule, when the rule changes what the system filters, grabs, deletes, or moves. The question gives the result. Without the line, the agent recommended a duplicate check on a live autobrr filter from a code reading alone, and a later replay against the history of the filter showed that the advice was wrong.
- `to-spec` closes the grilled source issue whatever its triage role, and removes that label, when the spec covers the whole issue. When the spec covers only part, the issue stays open with the triage role that the session decided for the rest. It gives each follow-up issue that the session filed the triage role that the session decided, and adds a blocked-by edge from each follow-up that depends on the spec.
- `codebase-design`: "Designing for testability" has an item that puts state changes in a pure reducer or a state machine when the state is several flags that can contradict each other, or when the events that are allowed depend on the current state. No upstream skill has this yet. If upstream adds similar guidance, keep the upstream text.
- `to-spec`: the spec template starts with a Branch section that tells the implementer to create the feature branch, because `implement` commits to the current branch.
- `triage`: an open design question moves a `ready-for-agent` issue back to `needs-triage`.
- `retro`: each candidate in the report starts with the repo and the file of its fix in bold.
- `grill-me` asks one question at a time, not a round. Since 2026-07-16, upstream `grilling` asks each round in full. Its docs page gives a global `CLAUDE.md` line that goes back to one question at a time. The local `grill-me` uses that line only when the user types `/grill-me`. Thus `grilling` and the skills that run it keep the rounds.
- `wizard` gives the user the command to run the script in their own terminal (`bash <path>`), because a Claude Code `!` command gets no keyboard input and the wizard stops at its first prompt. `template.sh` writes `${e}[Enter keeps current]` in `ask()`, so that the template passes shellcheck (SC1087).
- `diagnosing-bugs`: Phase 1 has a paragraph on network throughput bugs: a sustained-load loop, one path segment at a time.

### Skipped upstream changes

- `setup-matt-pocock-skills/SKILL.md`: upstream tells the agent to create each missing triage label with `gh label create` or `glab label create`. The local step already creates the missing labels after the user confirms, so the upstream line is not copied.
- `skills/in-progress/chief-of-staff`: the skill is in progress upstream. Copy it if it moves to `skills/engineering` or `skills/productivity`.

Upstream refers to some skills that are not copied here, for example `to-questionnaire`, and `wait-what` in `ask-matt`.

### Send a change upstream

mattpocock/skills accepts pull requests only from collaborators, so `gh pr create` fails. Push the change to a branch of the fork [s0up4200/skills-1](https://github.com/s0up4200/skills-1), and open an issue or a discussion with a compare link to that branch. The upstream rules are: no em dashes, one changeset for each change, and a new sync of the docs page when a skill is promoted.

### Compare with upstream

To see the upstream changes since the recorded commit (add `--stat` for a summary):

```sh
git clone https://github.com/mattpocock/skills.git /tmp/mattpocock-skills
cd /tmp/mattpocock-skills
git diff 5beb35b..HEAD -- skills/engineering skills/productivity/grill-me skills/productivity/grilling skills/productivity/handoff skills/productivity/teach skills/productivity/writing-for-agents
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

**Upstream commit:** `7c493a17e4d8c7c87941f82f1c2c3b286b23e51d` (2026-10-23)

### Copied skills

- `pstack/skills/unslop` is at `skills/cursor/unslop`.

### Local changes

- `unslop`: the frontmatter drops `disable-model-invocation: true`, so that the model can load the skill by itself.
- `unslop`: the frontmatter adds `model: sonnet`. In a test on one text, Sonnet removed the AI patterns as well as Opus, at a lower cost.

### Compare with upstream

```sh
git clone https://github.com/cursor/plugins.git /tmp/cursor-plugins
cd /tmp/cursor-plugins
git diff 7c493a17..HEAD -- pstack/skills/unslop
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

## AminBlg/SimpleEnglish

The skills in `skills/aminblg/` are copies of skills from [AminBlg/SimpleEnglish](https://github.com/AminBlg/SimpleEnglish).

**Upstream commit:** `a6fcb4fde098b33617cc1578d151ebf58774b883` (2026-10-05, version 2.1.1)

### Copied skills

- `skills/simple-english` is at `skills/aminblg/simple-english`.

Upstream also has hooks, an output style, a system prompt, and evals. They are not copied here.

### Local changes

None.

### Compare with upstream

```sh
git clone https://github.com/AminBlg/SimpleEnglish.git /tmp/simple-english
cd /tmp/simple-english
git diff a6fcb4fd..HEAD -- skills/simple-english
```

### License

The copied skills use the license of the upstream repository:

```
MIT License

Copyright (c) 2026 AminBlg

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
