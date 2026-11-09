# Upstream sources

This file records the upstream commit, the local changes, and the license of each copied skill, so that you can compare the copies with upstream later.

## mattpocock/skills

The skills in `skills/mattpocock/` are copies of skills from [mattpocock/skills](https://github.com/mattpocock/skills).

**Upstream commit:** `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` (2026-10-31, v1.3.2 and 3 commits)

### Copied skills

Each skill is in `skills/mattpocock/<name>` here. The upstream path is:

- `skills/engineering/<name>`: ask-matt, code-review, codebase-design, diagnosing-bugs, domain-modeling, grill-with-docs, implement, implement-spec, improve-codebase-architecture, pr, prototype, research, retro, setup-matt-pocock-skills, tdd, to-spec, to-tickets, triage, wayfinder, wizard
- `skills/productivity/<name>`: grill-me, grilling, handoff, teach, writing-for-agents
- `skills/in-progress/<name>`: chief-of-staff, software-factory

### Local changes

- `research` runs `git check-ignore -v` on the note and reports whether git tracks it. In autobrr/qui, `docs/*` is ignored, and on 2026-11-03 two of five research agents said so while three did not.
- `code-review`: step 6, "Act on the findings", comes from [mattpocock/skills#1044](https://github.com/mattpocock/skills/issues/1044). If upstream merges that issue, keep the upstream text.
- `pr`: the skill uses the PR template of the repository. The default body is one sentence. The evidence section lists only checks that CI cannot see. After it opens a pull request, it calls the tool of the `compact` mod, whose `then` prompt starts `verify-review` on the pull request with a fresh context. The tool sends `then` also when it skips the compaction, so `verify-review` always starts. Without the tool, it runs `verify-review` in the same context. `verify-review` waits for the first bot review and compacts the session when it stops. The step applies also when the user types `/pr`, so that a long session gets the same fresh context as after `implement`.
- Glossary entries and ADRs are Domain Docs in the plan until implementation. `domain-modeling`, `grill-with-docs`, `wayfinder`, and `improve-codebase-architecture` record them in the ticket resolution or the spec. `triage` records them in the agent brief. `to-spec` has a Domain Docs section, and `to-tickets` adds each entry to the ticket whose code it describes. `implement` and `implement-spec` write them on the implementation branch with the code.
- `implement` tells the agent to call the Skill tool for `code-review`, so the departures step names `code-review` without a slash.
- `implement` uses the latest Agent Brief comment on an issue as the spec, and a later `Brief amendment` comment overrides it. The issue body and the other comments are context only.
- `implement` reads the parent issue in full for the decisions that apply to the ticket, and builds only what the ticket asks for. `to-tickets` writes into each ticket every decision of the source that applies to it, because the Spec reviewer of `code-review` checks the code against the ticket only.
- `implement` posts each spec decision that the user makes as a `Brief amendment` comment on the issue, so that the Spec reviewer of `code-review` sees the decision. The comment states each decision as an edit to the spec, not as a question and answer. A spec question that the agent answers itself stays a departure. The Spec reviewer lists each amendment that it used, so that the user can see an amendment that does not match an answer.
- `implement` lists each departure from the spec before the commit. It posts all of them on the issue in one `Brief amendment (agent decision)` comment without an ask, and commits without a wait for the user. The user checks the departures on the issue. Before 2026-10-26, the agent asked the user about each departure and waited for the answers. A subagent of a coordinator sent each changed requirement to the coordinator. The user almost never changed a departure, so the wait cost time and gave no value.
- `implement` runs the test gate of the agent's instructions at the end, in place of the full test suite. It runs the full suite only when the instructions define no test gate.
- `implement` gives each measured cost in absolute time with its unit next to the percent, and judges the absolute cost before it tries a fix or a second measurement. A report with only a percent made the user ask for the unit, and a second measurement ran for a cost that the user then accepted.
- `implement` and `implement-spec` call `field-test` on a local rig when the spec names a live proof, the repo instructions ask for a live run, or the change is visible in the UI. `implement` calls it before `code-review`. `implement-spec` calls it once on the integration branch, in the main agent, after the code-review fixes, because parallel rigs compete for ports and browser tabs and only the main agent can ask the user. A run on the production host needs the PR image from CI, so it comes after the push. A fresh implementer subagent fixes the live-run failures, as upstream does for each ticket and for the code-review fixes.
- `implement` does the checks that the PR template and the agent's instructions ask for before a pull request, for example the performance measurements of autobrr/qui, before the commit. Before 2026-10-29, the agent found these checks only in `/pr`, after the context was full. It runs `field-test` and each measurement in a subagent with a fresh context window, so that the main context stays small. A regression that one fix does not remove stops the run before the pull request, and the agent asks the user.
- `implement` calls `pr` after the commit in the same turn, with no compaction before it. It stops before the pull request only when the agent's instructions say that the pull request waits for the user, for example a slowdown that the user must accept, a visual change with no captures, or a repo that the user does not own or maintain, and then it does not compact. Before 2026-11-06, `implement` compacted after the commit and added the `pr` step to the compaction only when the instructions let finished work open a pull request without an ask. In 4 of 5 recent runs in autobrr/qui that compacted, the agent left out the step, and the user had to type `/pr`. The compaction also dropped the context that the pull request step needs. Each measurement subagent saves its full report to a file outside the repo, and the PR body gets the short form from `pr`. Before 2026-11-03, the agent kept the report word for word for the PR body, and autobrr/qui#3767 got three full benchstat tables for a result within noise.
- `implement` finishes the live run of a visual change only after it saved a before and an after capture, and its final reply lists their paths. The capture rule was only in `field-test`. On 2026-10-29, a rook run reported correct colors with no captures, and `/pr` built both versions again to take them.
- `implement` calls `perf-review` after `code-review` when the diff changes an SQL statement, or adds a loop over database rows or over a list from a request or a caller. `code-review` checks only the standards and the spec. In autobrr/brrbin#92, `implement` wrote a `DELETE` with a correlated subquery over a bound list, and one sweep of 5,000 accounts took 12 seconds.
- `implement` finds the open children through the tracker document's Child ticket operation, and asks the user which child to implement. When no operation is recorded on a tracker without native sub-issues, it keeps the legacy `Part of #<n>` and `## Tickets` lookup. The selected child is the spec and gets the Brief amendment.
- `code-review` picks the fixed point in three cases. If the fixed point is the default branch, it fetches the branch and diffs against `<remote>/<branch>`. If the user names a pull request, it stops when the working tree has changes. Otherwise it checks the pull request out (`gh` on GitHub, `fj` on Forgejo) and diffs against `<remote>/<base>`. If the work is not committed, it diffs against `HEAD`. `<remote>` is `origin`, or the remote of the parent repository in a fork clone. If no remote points at the parent, it adds one named `upstream`. The Spec sub-agent gets only the spec and the diff, not the author's reasons for a departure. For an issue, the spec is the body and every comment, and a later Agent Brief or `Brief amendment` comment overrides earlier text.
- `code-review` reads the PR discussion (body, conversation comments, reviews, and inline review comments) in full, and marks each finding that a comment requested, answered, or raised before. The sub-agents do not get the discussion, because it holds the author's reasons.
- `code-review` reads the PR discussion through `scripts/pr-discussion.sh`, which writes plain text with each body whole. The old snippet wrote two JSON documents into one file, and jq could not parse the file.
- `code-review` records the current branch before it checks out a pull request, and switches back to it after the report when the working tree is clean. When the tree has changes, it names the current branch and gives the command that goes back.
- `code-review` checks at the source each severity claim that depends on a runtime default, a configuration value, or the behaviour of a caller, before the finding becomes the worst finding or a decision for the user. A sub-agent called a failed read "silent at the default log level", but DEBUG was the default level of the app, so the headline was wrong.
- `to-tickets` slices a feature into dormant tickets and one last gate ticket when the repo has the `no-ui-yet` label, so that users of the branch that each ticket merges into see no half-done feature. A dormant ticket changes nothing for a user without the new data, and its issue gets the label, which the `labels` skill copies to the PR. The gate ticket adds every way in, deletes each switch, and has no label.
- `code-review` starts the report with one sentence that gives the count of findings and the worst finding on each axis, before the two reports.
- `code-review` lists under `## Questions for you` each question that the PR body or a comment asks the reviewer and that no reply answers. In autobrr/qui#3596, the author asked for an OK on the extra cost of each delete, and no step of the skill put the question in the report, because it was not a finding.
- `code-review` starts 2 or 3 fresh sub-agents that try to refute each finding before it offers `/post-review` on a pull request from another person.
- `tdd`: a seam that the existing tests of the area already use counts as confirmed, so the agent asks only about a new seam. Upstream `implement` runs tdd "at pre-agreed seams" without a stop, and upstream `tdd` tells the agent to confirm each seam with the user first. Upstream issue: [mattpocock/skills#479](https://github.com/mattpocock/skills/issues/479). If upstream fixes it, keep the upstream text. No comment is on #479 yet. After a `/retro` measures the effect of the line, post the result on #479. If the line does not help, revert it.
- `tdd` has a "Real sleeps" anti-pattern. It comes from the test rules in autobrr/qui#3520.
- `setup-matt-pocock-skills` includes a Forgejo tracker template. It records membership in a `## Sub-issues` task list and blockers as native dependencies, with `fj` commands. Label setup uses the selected tracker. `to-tickets` delegates child linking to the tracker document and permits only the required parent membership update. GitHub keeps its existing template and fallback.
- `setup-matt-pocock-skills` treats a rerun as an upgrade. It keeps the recorded choices and custom text, and asks only about a convention that is missing or that conflicts. `ask-matt` tells the user to rerun it after a skill update.
- `setup-matt-pocock-skills` renames an old `CONTEXT.md` or `CONTEXT-MAP.md` to the `GLOSSARY` name with `git mv`, and updates the references to it in `docs/agents/`, `AGENTS.md`, and `CLAUDE.md`. Upstream only offers the rename in its explore step, and updates `docs/agents/domain.md` only.
- `setup-matt-pocock-skills`: the check for a reachable repo also covers a Forgejo tracker, with `fj repo view`. Upstream has no Forgejo tracker.
- `setup-matt-pocock-skills` writes the instructions to `AGENTS.md`, which Codex and Claude Code v2.1.277 and later both read. It creates `AGENTS.md` when no instructions file exists, and proposes `git mv CLAUDE.md AGENTS.md` when only `CLAUDE.md` exists. Upstream edits whichever file exists, and asks which one to create.
- `setup-matt-pocock-skills` writes a `## Module design` section with the deep-module rules of `codebase-design`, so that an agent without that skill also writes code by them. In a repo with code it asks first, because the rules can contradict the existing code. It also writes a `## Check` section when it finds exactly one gate command, and asks when it finds several.
- A sixth triage role, `needs-grilling`, marks the maintainer's own idea that is parked until a `/grill-with-docs` session. `setup-matt-pocock-skills` adds it to `triage-labels.md` and creates each mapped label that the repo does not have. `ask-matt` tells the agent to file an own idea with this label, and to create the label in a repo that was set up before this change. `to-spec` writes the spec into the grilled issue, or closes the grilled issue after it publishes the spec as a new issue.
- `codebase-design` has a new `GUARDING.md`, and its "Going deeper" list points to it. The step applies when a session settles the seam of a deep module that hides an importable dependency. A background sub-agent finds the lint rule that blocks a bypass of the module, and the agent asks the user about it. `grilling` has one line that sends the agent to read `GUARDING.md` by its path, so `grill-with-docs` gets it too. When the line pointed only to `codebase-design`, an agent loaded that skill but did not open `GUARDING.md`, and a spec shipped with no guard. `GUARDING.md` prefers a lint rule to making the hidden code private, because the rule's message names the module, it covers calls inside the module's own package, and an agent often exports a private name again.
- `grilling` tells the agent to read the current reference of an external API, library, or tool before it recommends a design that depends on how it behaves, also when the repo already uses it. Without the line, the agent recommended a deprecated endpoint only because the repo code already used it.
- `grilling` tells the agent to replay a proposed rule against the history of a live system before it recommends the rule, when the rule changes what the system filters, grabs, deletes, or moves. The question gives the result. Without the line, the agent recommended a duplicate check on a live autobrr filter from a code reading alone, and a later replay against the history of the filter showed that the advice was wrong.
- `to-spec` replaces the body of the grilled source issue with the spec, and removes its triage-role label whatever the role, when the spec covers the whole issue and the issue has no sub-issues. It posts no comment on that issue. A new spec issue and a "Specced in" comment made two issues and a comment for one piece of work, and the user deleted the comment as noise. It closes each other issue that the spec covers in full with "Covered by #<spec>". When the spec covers only part, the issue stays open with the triage role that the session decided for the rest. It gives each follow-up issue that the session filed the triage role that the session decided, and adds a blocked-by edge from each follow-up that depends on the spec. A grilled issue with sub-issues is a map: it stays open, the spec becomes one more child, and its triage-role label goes. A follow-up that the grilled issue blocks gets that edge moved to the spec, because the map closes only after its children.
- `codebase-design`: "Designing for testability" has an item that puts state changes in a pure reducer or a state machine when the state is several flags that can contradict each other, or when the events that are allowed depend on the current state. No upstream skill has this yet. If upstream adds similar guidance, keep the upstream text.
- `codebase-design`: the Depth entry credits John Ousterhout, _A Philosophy of Software Design_ (1st edition, 2018), ch. 4, for depth as functionality against interface cost. The line-ratio bullet in Rejected framings no longer credits Ousterhout: the book never defines depth as a ratio of lines, and ch. 2 says that lines of code are a poor measure of complexity. Principles has four more lines from the book: the three questions for a somewhat general-purpose interface (ch. 6), when to pull complexity down (ch. 8), errors defined out of existence only when no caller needs them (ch. 10), and no split for length alone (ch. 9). A new `RED-FLAGS.md` lists the book's red flags that the skill did not have, each with a test, and the three symptoms of complexity. Only `improve-codebase-architecture` loads it, through the brief of its explorer sub-agent. Upstream issue: [mattpocock/skills#1397](https://github.com/mattpocock/skills/issues/1397). If upstream fixes the credit, keep the upstream text.
- `to-spec` reports the test seams in the final reply and asks only about a seam that the session did not discuss. Upstream tells the agent not to interview the user and also to check the seams with the user, so the two lines disagreed after a grilling session that had settled the seams.
- `to-spec`: Testing Decisions names the live proof of the change, or `None` with the reason. Without the line, the agent asked how to prove a change only in `field-test`, after the code existed, and a backend change with no repo rule got no live run. The idea comes from a post by the upstream author. No run has measured the effect yet.
- `to-spec`: the spec template starts with a Branch section that tells the implementer to create the feature branch, because `implement` commits to the current branch. When the session ran on a feature branch, for example in a worktree, the section names that branch and asks for a rebase.
- `grill-with-docs` offers `/to-spec` after the user confirms the shared understanding, and posts a resolution comment only when the session ends without a spec. Without the line, the agent posted the Domain Docs as a comment and then put them in the spec too.
- `triage`: an open design question moves a `ready-for-agent` issue back to `needs-triage`.
- `retro`: each candidate in the report starts with the repo and the file of its fix in bold.
- `grilling` starts each question with a short scenario with concrete values, and says what the user sees under each option. Without the line, a round asked about field names such as `groupId`, and the user could not answer it.
- `pr` has a Parent issue section: when the PR closes the last open sub-issues of a parent, the body closes the parent too. It skips a `wayfinder:map` parent, because a map can list work that has no ticket yet. Without it, a spec split into tickets stayed open after its last ticket merged.
- `pr` has a Title section: a fix names the symptom that users see, as wide as the fix. The description names the title too. A title named only SQLite for a fix that covered both databases.
- `pr` has a Performance section: a conclusion sentence, one table of base → head for each measured path, and one line with the workload, environment, method, and revisions. The raw tool output goes in a collapsed `<details>` block only when the template or the repo instructions ask for it, as go-qbittorrent's template does. A section with no performance risk follows the template: keep it with one sentence, or delete it.
- `pr` puts the Merge danger line in every body. If the template has no section for risk, the line goes at the end of the section that describes the change. Before, the line was only in the default template, and 1 of 30 PRs on a repo with its own template had it.
- `grilling` finds each fact that the tree depends on before the first round, and for a security question it traces each path to the asset first. Each round opens with one line that gives the goal and the settled decisions, and names each earlier recommendation that a new fact changed. Without these lines, a session on a signing-key change found the facts one round at a time, reversed two recommendations inside new questions, and the user lost the goal.
- `grill-me` asks one question at a time, not a round. Since 2026-07-16, upstream `grilling` asks each round in full. Its docs page gives a global `CLAUDE.md` line that goes back to one question at a time. The local `grill-me` uses that line only when the user types `/grill-me`. Thus `grilling` and the skills that run it keep the rounds.
- `wizard` gives the user the command to run the script in their own terminal (`bash <path>`), because a Claude Code `!` command gets no keyboard input and the wizard stops at its first prompt. `template.sh` writes `${e}[Enter keeps current]` in `ask()`, so that the template passes shellcheck (SC1087).
- `diagnosing-bugs`: Phase 1 has a paragraph on network throughput bugs: a sustained-load loop, one path segment at a time.
- `diagnosing-bugs`: the description says to use the skill before the agent names a cause, and adds a question about why a failure happens and a pasted log or stack trace of one. With the upstream description, a local eval on 2026-11-06 fired 0 of 3 times on a report of an intermittent failure with a log. With the new description, it fired 3 of 3 times, and 0 of 3 times on a question that reports no bug.
- `improve-codebase-architecture` finds hot spots with a count of changes per file over six months, or over all of the history when that window has fewer than about 50 commits. Upstream `git log --oneline` lists no files. A bundled `scripts/change-coupling.sh` lists the file pairs that change in the same commits, with the code-maat degree and limits. The brief of the explorer sub-agent carries the scope, the vocabulary, the glossary, and the ADRs, because a sub-agent sees none of what the main agent loaded. The main agent checks the facts of each card before the badge, and reads `DEEPENING.md` by its path for the dependency category. After the report, the agent files each picked candidate as a `needs-grilling` issue, plus the repo's refactor label, for a later grilling session. A rejection ADR is written at once when the user says yes, because no code waits for it. The agent serves the report on the tailnet with `tailscale serve` on a free HTTPS port, through a local `http.server`, because `tailscale serve` sends a file only as root. It opens the file locally only when the host has no tailnet, and offers to stop serving. `HTML-REPORT.md` loads the Tailwind v4 browser CDN, follows the system dark mode in Tailwind and in Mermaid, and drops `securityLevel: "loose"`. The Mermaid example colours the leak edge with `linkStyle` and writes edge labels in the quoted pipe form, because an inline label breaks on a period (upstream [#1256](https://github.com/mattpocock/skills/issues/1256)). The Tone examples use "module" where they said "wrapper" or "layer". The sources are in `docs/research/improve-codebase-architecture.md`. If upstream fixes #1256 or [#651](https://github.com/mattpocock/skills/issues/651), keep the upstream text.
- `improve-codebase-architecture`: the brief of the explorer sub-agent gives the path of `codebase-design/RED-FLAGS.md`, and treats the red flags as friction prompts, not as a checklist. The Problem of each card names the red flag and its symptom. A coupled pair with no import between the files is labelled back-door leakage. Before, a card described a leak only as "leaks across seams", and it did not say why the friction cost time.
- `chief-of-staff`: the Wiki section keeps the upstream rule that looks for a shared wiki first, and then keeps the wiki in the notes vault that the user's instructions name, and the vault's rules win where they conflict. Without the line, the agent gets two sets of rules for one folder. The Subagents section keeps each step that asks the user in the chief session, because a subagent cannot talk to the user. Without that line, each goal had to find the split again. The Subagents section also has each subagent commit only the paths that it names, because subagents in one repo share one staging area. On 2026-10-24, one vault commit took the staged deletions of another agent. For a large chunk of work, the Procedures section asks the user whether to build the tickets with `implement-spec` or one at a time with `implement`, because the user wants to pick. Upstream always runs `implement-spec`. Upstream keeps the skill in `skills/in-progress`, so expect changes at each sync. If upstream moves it, update the path above.
- `code-review` carries a lowered-bar list in step 3: a threshold moved to the easier side, a test made easier, a new `nolint` or `t.Skip`, a stub or an empty catch, or a new entry in an exception or allow list. A hit is a required fix, a third kind of finding next to hard violations and judgement calls, unless the diff or a commit message gives a reason. The Standards sub-agent gets the commit list with the full messages, because `--oneline` hides a reason in the commit body. The Spec sub-agent keeps `--oneline`, because it must not see the author's reasons.
- `code-review` has four more smells in the baseline: Moved Complexity, Bolted-on Conditional, Near-Copy, and Silent Fallback. The baseline no longer says that all of its smells come from Fowler.
- `code-review` tells both sub-agents to read the callers, guards, and tests before they report a finding, to label an old defect apart from a regression from this change, and to report nothing when they find nothing. It says "regression" because step 5 uses "new" for a finding that no PR comment touched. The sentences in the severity check and in step 6 no longer say that a sub-agent sees only the diff.
- `code-review` has five more smells in the baseline: Information Leakage, Temporal Decomposition, Overexposure, and Conjoined Methods from Ousterhout's _A Philosophy of Software Design_, and Symptom Patch, which reads the whole function around each new branch. Silent Fallback flags only a fallback that hides a failure that a caller or the user needs to know about, because the book says to mask an error at a low level when no caller can act on it. Vague Name, Pass-Through Method, and Comment Repeats Code stay out, because Mysterious Name, Middle Man, and the user's comment rule cover them. The smell list moved from step 3 to `SMELLS.md`, because with the new smells the body went over the 15,000-byte limit of `check.sh`. Step 3 tells the agent to read the file in full and paste it into the Standards brief.
- `implement` calls `data-review` after `code-review` when the diff touches SQL or another store, a call to another system, a background loop, a cache, a stored or wire format, or a delete of files or rows. `code-review` and `perf-review` do not check whether two writers, a failed call, or old data break the change. `implement` and `implement-spec` run `perf-review` and `data-review` each in a subagent with a fresh context window, as `code-review` runs its reviewers, because the agent that wrote the code agrees with its own reasons for each line.
- `implement-spec` step 7 computes one fixed point, the merge base of the default branch and the integration branch, and passes it to `code-review`, `perf-review`, and `data-review`. In a fork, the default branch comes from the parent remote, as in `code-review`. It runs `perf-review` and `data-review` under the same triggers as `implement`. Upstream step 7 passes no fixed point, so `code-review` asked the user for one, and the integration branch got no performance or data review.
- `code-review` has nine more smells from Evans's _Domain-Driven Design_, in a "Domain language" section of `SMELLS.md`: Off-Glossary Name, Drifted Meaning, False Cognate, Scattered Rule, Mutable Identity, Leaked Insides, Silent Rewrite, Dry-Run Flag, and Incidental Reliance. Symptom Patch also flags a second fix on the same rule, with `git log -L` on the function as the test. Step 3 pastes each `GLOSSARY.md` of the repo into the Standards brief, with `GLOSSARY-MAP.md` and the glossary of each changed path in a repo with several contexts, and Off-Glossary Name applies only then. The credit line names Evans. Scattered Rule and Dry-Run Flag state in their own text how they agree with _A Philosophy of Software Design_.
- `domain-modeling` records two things in the plan: which rule wins when two rules act on one object, from a scenario where both apply, and a glossary entry for each concept that the user names and the code has no type or function for. Both come from Evans, ch. 1 and ch. 9.
- `codebase-design`: `DEEPENING.md` has "The port speaks the app's terms" for remote and third-party dependencies: the foreign model stays inside one adapter, and a field-for-field mirror type is a pass-through. Its testing strategy adds recorded payloads at an external seam, with each secret and customer value replaced before the save, and one contract suite that runs against each adapter. `RED-FLAGS.md` Pass-through method says when a wrapper around a foreign API is not a pass-through. All three come from Evans, _Domain-Driven Design_, ch. 10 and ch. 14.
- `tdd`: `mocking.md` feeds a mock from recorded responses with fake secrets and customer values and runs one contract suite against each implementation of an interface. `tests.md` writes an output checker first for a selector or a solver. They come from Evans, _Domain-Driven Design_, ch. 9, 10, and 14.
- `to-tickets`: the first slice after the prefactoring exercises the core domain logic end to end, so that a wrong core shows before the settings and the plumbing merge. The switch that users cannot set stays in the ticket whose logic it guards. A wide refactor keeps its expand–contract order. It comes from Evans, _Domain-Driven Design_, ch. 15, "Project Risk Management".
- `handoff` records each verification command with its result, the state of the working tree, and each approval still pending. A later session counts an approval only when the handoff or the tracker records it.
- `to-tickets` removes the triage-role label from the parent issue when it publishes the tickets as children. On 2026-11-09, autobrr/qui#3941 (the spec from `to-spec`) and its first ticket both had `ready-for-agent`, so an implementer could build the work twice.
- `improve-codebase-architecture` writes the report to the session scratchpad when the harness names one. A rejection ADR goes in the spec's Domain Docs when the same session writes a spec. Otherwise, in a repo whose default branch takes no direct commit, it gets its own docs pull request. On 2026-11-09, the qui session had to choose between these two places for the ADR, and the user picked the spec.

### Skipped upstream changes

- `setup-matt-pocock-skills/SKILL.md`: upstream tells the agent to create each missing triage label with `gh label create` or `glab label create`. The local step already creates the missing labels after the user confirms, so the upstream line is not copied.

Upstream refers to some skills that are not copied here, for example `to-questionnaire`, and `wait-what` in `ask-matt`.

### Send a change upstream

mattpocock/skills accepts pull requests only from collaborators, so `gh pr create` fails. Push the change to a branch of the fork [s0up4200/skills-1](https://github.com/s0up4200/skills-1), and open an issue or a discussion with a compare link to that branch. The upstream rules are: no em dashes, one changeset for each change, and a new sync of the docs page when a skill is promoted.

### Compare with upstream

To see the upstream changes since the recorded commit (add `--stat` for a summary):

```sh
git clone https://github.com/mattpocock/skills.git /tmp/mattpocock-skills
cd /tmp/mattpocock-skills
git diff 4ae2317..HEAD -- skills/engineering skills/productivity/grill-me skills/productivity/grilling skills/productivity/handoff skills/productivity/teach skills/productivity/writing-for-agents skills/in-progress/chief-of-staff skills/in-progress/software-factory
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

**Upstream commit:** `2776ddd2355d6d6c8747d3964600f28daf62f049` (2026-11-05)

### Copied skills

- `pstack/skills/unslop` is at `skills/cursor/unslop`.

### Local changes

- `unslop`: the frontmatter drops `disable-model-invocation: true`, so that the model can load the skill by itself.

### Compare with upstream

```sh
git clone https://github.com/cursor/plugins.git /tmp/cursor-plugins
cd /tmp/cursor-plugins
git diff 2776ddd2..HEAD -- pstack/skills/unslop
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

- `simple-english` keeps the meaning of the source: an optional "should" becomes "you can", a guess keeps its certainty, and terms that the project defines stay as they are. The self-check compares each claim, condition, limit, option, and level of certainty of a rewrite with the source. The modal ladder in `references/rule-catalog.md` and the incident-report example in `references/use-cases.md` follow the same rules. Upstream deletes an optional "should" and maps every modal to can, will, or must, so a guess in an issue or a spec read as a fact, and an option got lost.

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

## cloudflare/security-audit-skill

`skills/security-audit` is our own skill, not a copy. Parts of its checklists and its run tracking are adapted from [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill).

**Upstream commit:** `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` (2026-09-14)

### Adapted parts

- The checklists `area-logic.md`, `area-data.md`, `area-availability.md`, `area-ai.md`, `area-native.md`, `area-messaging.md`, and `area-local.md` are shorter forms of `ATTACK-CLASSES.md` and the matching upstream companion files. They use the verdicts of our skill, and some have added Go notes. The sections added to `area-access.md`, `area-browser.md`, `area-supply-chain.md`, and `area-deployment.md` come from the other companion files.
- `prior-runs.md` and `coverage.md` are a small form of the upstream coverage ledger and its rules for prior runs. Upstream uses JSON and Node validators. We use Markdown, with no validator and no coverage critic agents.

### License

The adapted parts use the license of the upstream repository:

```
MIT License

Copyright (c) 2025-2026 Cloudflare, Inc.

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

## addyosmani/agent-skills

`skills/refute` is our own skill, not a copy. It rewrites one idea from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills). Other skills and the local evals rewrite more ideas from that repo. No skill is copied.

**Upstream commit:** `301b02b12bff98e4688e6984af6556802322bbde` (2026-11-01)

### Adapted parts

- `refute` comes from `doubt-driven-development`: a fresh agent that gets the plan and the requirements but not the reasoning, four classes for the findings, and a limit of 3 rounds. Upstream applies it to each decision during the work and offers a second model. Our skill starts only when the user types it, attacks a finished plan, and has no question about a second model.
- The lowered-bar list of `code-review` comes from `constraint-driven-development`, which flags a loosened `CONSTRAINTS.md` in review. Our list works on any diff, with no `CONSTRAINTS.md`.
- The four new smells of `code-review` come from `code-review-and-quality`. So does the rule to read the callers, guards, and tests before a finding, to label old defects apart from regressions, and to allow zero findings.
- The delete, move, and overwrite rule in `security-audit/references/area-files.md` comes from `security-and-hardening`.
- The new rule of `handoff` comes from `context-engineering`.
- The local firing evals use the `tool_used` graders with `input_match` from `evals/plugin`.
- Three rules in the dotfiles repo of the user come from this repo too: the optimization rule from `performance-optimization`, the rule that a log line names what started a job from `observability-and-instrumentation`, and the crash and rollback rule from `test-driven-development`.

### License

The adapted parts use the license of the upstream repository:

```
MIT License

Copyright (c) 2025 Addy Osmani

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
