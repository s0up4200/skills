# Upstream: mattpocock/skills

The skills in `skills/mattpocock/` are copies of skills from [mattpocock/skills](https://github.com/mattpocock/skills). This file records the upstream commit of the copies, so that you can compare them with upstream later.

**Upstream commit:** `d81f3a183412e71a5b1e84ca21bc1a35eea03a60` (2026-09-29)

## Copied skills

Each skill is in `skills/mattpocock/<name>` here. The upstream path is:

- `skills/engineering/<name>`: ask-matt, code-review, codebase-design, diagnosing-bugs, domain-modeling, grill-with-docs, implement, implement-spec, improve-codebase-architecture, pr, prototype, research, retro, setup-matt-pocock-skills, tdd, to-spec, to-tickets, triage, wayfinder, wizard
- `skills/productivity/<name>`: grilling, handoff, teach, writing-for-agents

## Local changes

- `code-review`: the frontmatter adds `effort: high`. Step 6, "Act on the findings", comes from [mattpocock/skills#1044](https://github.com/mattpocock/skills/issues/1044). If upstream merges that issue, keep the upstream text.
- `pr`: the skill uses the PR template of the repository. The default body is one sentence. The evidence section lists only checks that CI cannot see. The prose goes through `simple-english` and `unslop`.

Upstream refers to some skills that are not copied here, for example `grill-me`, `to-questionnaire`, and `wait-what` in `ask-matt`.

## Compare with upstream

To see the upstream changes since the recorded commit (add `--stat` for a summary):

```sh
git clone https://github.com/mattpocock/skills.git /tmp/mattpocock-skills
cd /tmp/mattpocock-skills
git diff d81f3a18..HEAD -- skills/engineering skills/productivity/grilling skills/productivity/handoff skills/productivity/teach skills/productivity/writing-for-agents
```

Apply the changes that you want. Then update the upstream commit in this file.

## License

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
