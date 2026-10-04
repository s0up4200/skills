# Upstream sources

This file records the upstream commit, the local changes, and the license of each copied skill, so that you can compare the copies with upstream later.

## mattpocock/skills

The skills in `skills/mattpocock/` are copies of skills from [mattpocock/skills](https://github.com/mattpocock/skills).

**Upstream commit:** `d81f3a183412e71a5b1e84ca21bc1a35eea03a60` (2026-09-29)

### Copied skills

Each skill is in `skills/mattpocock/<name>` here. The upstream path is:

- `skills/engineering/<name>`: ask-matt, code-review, codebase-design, diagnosing-bugs, domain-modeling, grill-with-docs, implement, implement-spec, improve-codebase-architecture, pr, prototype, research, retro, setup-matt-pocock-skills, tdd, to-spec, to-tickets, triage, wayfinder, wizard
- `skills/productivity/<name>`: grilling, handoff, teach, writing-for-agents

### Local changes

- `code-review`: the frontmatter adds `effort: high`. Step 6, "Act on the findings", comes from [mattpocock/skills#1044](https://github.com/mattpocock/skills/issues/1044). If upstream merges that issue, keep the upstream text.
- `pr`: the skill uses the PR template of the repository. The default body is one sentence. The evidence section lists only checks that CI cannot see. The prose goes through `simple-english` and `unslop`, and the skill offers to install them when they are missing.
- Glossary entries and ADRs are Domain Docs in the plan until implementation. `domain-modeling`, `grill-with-docs`, `wayfinder`, and `improve-codebase-architecture` record them in the ticket resolution or the spec. `to-spec` has a Domain Docs section, and `to-tickets` adds each entry to the ticket whose code it describes. `implement` and `implement-spec` write them on the implementation branch with the code.

Upstream refers to some skills that are not copied here, for example `grill-me`, `to-questionnaire`, and `wait-what` in `ask-matt`.
- `implement` uses the latest Agent Brief comment on an issue as the spec. The issue body and the other comments are context only.

### Compare with upstream

To see the upstream changes since the recorded commit (add `--stat` for a summary):

```sh
git clone https://github.com/mattpocock/skills.git /tmp/mattpocock-skills
cd /tmp/mattpocock-skills
git diff d81f3a18..HEAD -- skills/engineering skills/productivity/grilling skills/productivity/handoff skills/productivity/teach skills/productivity/writing-for-agents
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
