# Research: additive bias in agent-written code and rules

Date: 2026-10-26

Done on 2026-10-26: fix 1 (`022aef1`) and fix 2 in the gate mods.

Scope: the question "LLMs add lines and seldom remove them. How does this affect this repo and the other repos?" Part 1 gives the primary sources. Part 2 measures the effect in this repo, in `s0up4200/dotfiles` (`agents/`), in the gate mods, in `autobrr/qui`, and in `autobrr/mkbrr`. "Source" lines give what a source says. "Inference" lines give my reading. The measured heads are skills `5ba3db6`, dotfiles `cc46925`, qui `origin/develop` `3f06a4ef`, and autobrr `origin/develop` `58bad4f7`.

## Summary

- The bias is real in people and in LLMs. People find a subtractive fix less often when no cue tells them to look for one. A 2026 study found the bias stronger in GPT-4 and GPT-4o than in people. Agents on SWE-bench add more lines and remove fewer than the human patch.
- In the code, the effect is smaller than expected. In qui, the code lines deleted per code line added went up from 0.31 (2025 H2) to 0.45 (2026). Most of the growth in fix commits is tests. 70 % of the 2026 qui fix commits add a test, against 17 % in 2025 H2. That is the regression-test rule at work.
- Fix commits did get more additive. The share of fix commits that delete less than a quarter of what they add went from 17 % (autobrr, 2021 to 2023) to 34 % and 36 % (autobrr and qui, 2026). Some of these patch a symptom next to a known cause (section 6).
- The agent rules grow fastest. On 2026-10-06, a cut took `GLOBAL.md` from 2,743 to 801 words. It grew back to 2,591 words in 19 days. Of the 34 commits after the cut, 1 removed more lines than it added. The qui `AGENTS.md` shows the same cycle: 947 words on 2026-08-10, 2,275 words now. `verify-review` grew from 1,510 to 4,027 words in 5 weeks.
- The tools that push back look at code diffs. No gate runs a subtraction review on `GLOBAL.md` or `CODING_STANDARDS.md`. The commit gate skips `ponytail-review` for `.md` files, and the docs gate does not match those two file names.
- Top fix: make the docs gate mod cover `GLOBAL.md` and `CODING_STANDARDS.md`, and run `trim-agents-md` on `GLOBAL.md`, `verify-review`, and `field-test`. Both use tools that exist now.

---

## Part 1: primary sources

## 1. People default to additive changes, and a cue to subtract helps

Confidence: high.

Source:

- Adams, Converse, Hales, Klotz, "People systematically overlook subtractive changes", Nature 592, 258–261, 7 April 2021. Abstract: "people systematically default to searching for additive transformations, and consequently overlook subtractive transformations. Across eight experiments, participants were less likely to identify advantageous subtractive changes when the task did not (versus did) cue them to consider subtraction, when they had only one opportunity (versus several) to recognize the shortcomings of an additive search strategy or when they were under a higher (versus lower) cognitive load." https://www.nature.com/articles/s41586-021-03380-y
- Supplementary Information, Exp. 1, a Lego structure where the best answer removes one brick: "In the control condition, 41% produced a subtractive transformation and in the subtraction-cue condition 61% produced a subtractive transformation". Study S2, ideas to improve a university: "70 (11%) were subtractive ... and 581 (89%) were additive". Meta-analysis: "cognitive load significantly reduced the likelihood of subtracting, total N = 1,594, OR = 0.72". https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-021-03380-y/MediaObjects/41586_2021_3380_MOESM1_ESM.pdf
- Extended Data Fig. 4, Exp. 4: "no-cue = 21%, cue = 48%" listed at least one subtractive idea.

Inference. The cheapest fix is a cue at the time of the change. In these tasks, one sentence that asked for subtraction raised it by half or more. A long rule set raises the load, and load lowers subtraction.

## 2. LLMs carry the bias, sometimes more than people

Confidence: medium. I read the abstract verbatim. The table numbers came through a summary of the paper, not a full read.

Source:

- Uhler, Jordan, Buder, Huff, Papenmeier, "Influence of solution efficiency and valence of instruction on additive and subtractive solution strategies in humans, GPT-4, and GPT-4o", Communications Psychology 4:41, 28 January 2026. Abstract: "Across both studies, a general addition bias emerged, more pronounced in the LLMs than in humans." "These findings indicate that addition bias has been transferred to LLMs, which can replicate and, depending on context, amplify this human bias." https://pmc.ncbi.nlm.nih.gov/articles/PMC12954086/
- Additive share of answers: study 1, humans 57 % and GPT-4 71 %. Study 2, humans 54 % and GPT-4o 96 %.

## 3. Agent patches add more and remove less than human patches

Confidence: medium-high for the measurement. The cause is mixed.

Source:

- Yang et al., "SWE-agent", arXiv 2405.15793v3, 11 November 2024, Appendix B: "models tend to generate "larger" edits (e.g., more lines added, hunks, and files) than the corresponding gold solution ... The source of this increase for agent-generated solutions can largely be attributed to additional reproduction code." Table 11 medians: the Claude 3 Opus agent added 11 lines and removed 1. The human patch for the same tasks added 6 and removed 2. https://arxiv.org/pdf/2405.15793
- Chen and Jiang, arXiv 2410.12468v2, 27 December 2024, 4,892 patches from 10 agents. Some agents "tend to over-modify the code, leading to significant increases in net code size", and others "demonstrate closer alignment with the gold patches". https://arxiv.org/pdf/2410.12468
- GitClear, "Coding on Copilot", 16 January 2024, 153 million changed lines from 2020 to 2023: "the percentage of "added code" and "copy/pasted code" is increasing in proportion to "updated," "deleted," and "moved" code." Moved lines fell from 24.8 % (2021) to 16.9 % (2023). Deleted lines rose a little, from 19.0 % to 21.1 %. https://www.gitclear.com/coding_on_copilot_data_shows_ais_downward_pressure_on_code_quality (PDF read at https://gwern.net/doc/ai/nn/transformer/gpt/codex/2024-harding.pdf)

Inference. GitClear compares years, not AI lines with human lines, and it sells analysis tools. Its data does not show a fall in deletion. The firm signal is the drop in moved code. That means less refactoring, and more new code next to the old code.

## 4. Anthropic tells Claude to keep changes minimal

Confidence: high.

Source:

- Prompting best practices, section "Overeagerness": "Claude Opus 4.5 and Claude Opus 4.6 have a tendency to overengineer by creating extra files, adding unnecessary abstractions, or building in flexibility that wasn't requested." The sample prompt: "Avoid over-engineering. Only make changes that are directly requested or clearly necessary." "Don't add error handling, fallbacks, or validation for scenarios that can't happen." https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices (read 2026-10-26)
- Claude Code best practices: "Chasing every finding leads to over-engineering: extra abstraction layers, defensive code, and tests for cases that can't happen." On CLAUDE.md: "Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook." https://code.claude.com/docs/en/best-practices

---

## Part 2: the repos

## 5. Code: more fix commits are pure additions, but most growth is tests

Confidence: medium. The split between agent work and human work is weak. See Method.

Method. A `Co-Authored-By: Claude` trailer is on 8 of 1,963 qui commits, and on 0 commits in this repo, mkbrr, and the gate mods. Thus I split by time, not by author. qui had a `CLAUDE.md` on its second day (2025-08-03), so it has no period before agents. As a baseline before agents, I used `autobrr/autobrr` from 2021 to 2023. Other authors wrote most of those commits (Ludvig Lundgren 208, ze0s 197, soup 103), so it is a weak baseline. I counted `git log --no-merges --numstat` on the default branch. I left out lock files, generated files, locales, SVG, and Markdown, and I counted tests apart from code. A commit is "mostly additive" when it deletes less than a quarter of the code lines that it adds. Both repos squash-merge, so one commit is one PR. The scripts were throwaway and are not in the repo.

Source (measured on the heads above):

| Repo, era, commits | Median code lines added / deleted | Code deleted per added | Mostly additive | Commits with a test |
|---|---|---|---|---|
| autobrr 2021–2023, all (848) | 18 / 5 | 0.50 | 31 % | 12 % |
| autobrr 2021–2023, fix (339) | 5 / 3 | 0.68 | 17 % | 7 % |
| autobrr 2026, fix (86) | 18 / 6 | 0.65 | 34 % | 55 % |
| qui 2025 H2, all (680) | 51 / 14 | 0.31 | 38 % | 17 % |
| qui 2026, all (1,077) | 45 / 13 | 0.45 | 39 % | 60 % |
| qui 2025 H2, fix (266) | 20 / 8 | 0.50 | 26 % | 17 % |
| qui 2026, fix (498) | 29 / 10 | 0.49 | 36 % | 70 % |

- mkbrr has 186 commits in the window, too few for a trend. Its code deleted per added fell from 0.35 (2025 H1) to 0.13 (2026), mostly because of the GUI feature `d89efe2`.
- Test lines are 60 % of the lines that 2026 qui fix commits add, against 30 % in 2025 H2.
- The qui file with the most 2026 fix commits is `internal/services/crossseed/service.go`. It had 101 fix commits and has 13,494 lines now. In 2025 Q4 it gained 10,751 lines and lost 1,657. In 2026 Q4 it gained 1,057 and lost 2,347.

Inference. The deletion ratio of the code did not fall after agents came in. In qui it went up. The size of a fix went up, and most of the extra lines are tests. `CODING_STANDARDS.md` asks for a regression test that goes red, so that growth is wanted. Against the old baseline, the share of fix commits that only add code doubled. The net shrink of `service.go` in 2026 Q4 shows that a planned refactor works here. The bias shows in single fixes, not in the totals.

## 6. Code: fixes that patch the symptom next to the cause

Confidence: medium. I picked two examples by hand from the 55 qui fix commits in 2026 that delete one code line or none. I did not classify all 55.

Source:

- qui `1ee78f70`, "log repeated size-mismatch rejections at trace". It adds an unbounded `sync.Map` and a function that lowers the log level of repeats. Its comment gives the cause, "RSS retries the same doomed pair every run until it leaves the feed", and says "In-memory and unbounded on purpose". The retry stays.
- qui `5db6c058`, "keep libtorrent's unknown HTTP error out of Unregistered". The unregistered list in `internal/qbittorrent/tracker_statuses.go` has the bare substring `"unknown"`. The fix keeps it, and adds `strings.ReplaceAll(message, "(unknown HTTP error)", "")` before the match.
- Counter-examples from the same set: `54806b8b` replaces the parse of a full path with `path.Base` and adds no branch. `d53e3223` adds two characters to an existing normalizer.

Inference. In both examples, the comment names the cause, and the fix goes around it. A fix at the cause would stop the doomed retry, or narrow the bare `"unknown"`. Each choice can have a reason, for example a tracker that sends "unknown torrent", but the commit does not record one. The `ponytail-review` step of the commit gate reads only the diff, so it does not see the `"unknown"` entry or the retry loop.

## 7. Agent rules: cut once, then they grow back

Confidence: high.

Source (word counts from `wc -w` at each commit):

- dotfiles `agents/GLOBAL.md` had 1,285 words on 2026-08-27 and 2,743 at `69fc986` (2026-10-06). Then `9922181` "cut no-ops from the global instructions" and `c6b80a7` "move task-specific rules to agents/docs" took it to 801 words at `94d0614`. It had 1,972 words on 2026-10-19 and has 2,591 at `cc46925`. Of the 34 commits since 2026-10-10, one removed more lines than it added.
- dotfiles `agents/CODING_STANDARDS.md` started with 800 words on 2026-10-06 and has 1,522 now. Of its 12 commits, 1 is a net shrink.
- dotfiles `agents/docs/*.md` has 3,618 words in 8 files. With `GLOBAL.md` and `CODING_STANDARDS.md`, the rule set has 7,731 words. `GLOBAL.md` loads in each session.
- qui `AGENTS.md` had 978 words on 2026-02-17, 1,415 on 2026-05-19, 947 on 2026-08-10, 2,059 on 2026-10-20, and has 2,275 at `3f06a4ef`.
- After the cut, almost all `GLOBAL.md` commit subjects say "add", "keep", or "use". Two remove a rule: `9a33266` "drop the worktree overlap check" and `07130bc` "stop ending each reply with a yes/no question".
- `writing-for-agents` names this failure: "Without a pruning discipline the default fate is **sediment**: stale layers that settle because adding feels safe and removing feels risky".

Inference. Each new rule comes from a real failure, so each addition looks right. Nobody asks which old line the new rule makes redundant. The cut on 2026-10-06 was one event, not a habit, and 19 days undid it.

## 8. Skills: a few grow fast, few repeat each other

Confidence: high for the counts, medium for the stale example.

Source:

- No `SKILL.md` is near the 500-line cap of `check.sh`. The largest are `mobile-adapt` (261 lines), `release-announcement` (233), and `verify-review` (203).
- A line count is too low for prose, because one line is one paragraph. `verify-review/SKILL.md` grew from 95 lines and 1,510 words (2026-09-19) to 203 lines and 4,027 words (2026-10-23), in 30 commits. `field-test/SKILL.md` grew from 2,384 to 3,001 words in 13 commits, and its folder has 10,140 words.
- Over its history, this repo added 20,136 lines and deleted 8,585 in 203 commits. 100 of the commits are mostly additive. `focus` is the exception, with 318 lines added and 197 deleted in 16 commits, because a rewrite replaced it.
- Rules from `GLOBAL.md` seldom repeat in skills. 6 skill files name the prose skills, and 4 name the commit gate, mostly as a pointer ("Run the commit gate from the global `CLAUDE.md`").
- A stale rule: `sync-upstream/SKILL.md` step 5, last changed 2026-10-11, says "copy each changed skill folder to `~/.agents/skills/<name>` with `rsync -a --delete`". dotfiles `agents/docs/skills.md`, from `bc29852` (2026-10-14), says "The installed skills are links", and "If `~/.agents/skills/<name>` is a copy and not a link, replace it with a link". On this machine, 55 of the 60 entries in `~/.agents/skills` are links.

Inference. Duplication is not the problem here. The problem is that a few skills take each lesson as one more paragraph. The `sync-upstream` step shows the cost. A rule changed in one place, and the old instruction stayed in the skill that runs it.

## 9. What already pushes back, and the gaps

Confidence: high. I read each tool. I did not run them.

| Tool | What it catches | Gap |
|---|---|---|
| `ponytail` mode and `ponytail-review` (commit gate step 2) | Dead code, stdlib rewrites, and one-implementation abstractions in the diff. Ends with "net: -N lines possible". | Reads only the diff. It does not see the old guard or the cause that the new code goes around (section 6). |
| `ponytail-audit` | The same, for the whole repo. | Manual. Code only. |
| `simplify` | Reuse and simplification in the changed code. It applies the fixes. | Changed code only. |
| `code-review` (mattpocock) | Duplicated Code, Speculative Generality, and Middle Man in the change. | The same diff limit. |
| `fix-review` | "Apply the smallest fix at the shared cause." | Runs only on review findings. |
| `CODING_STANDARDS.md` | "Exploration ends in deletion." List each caller before a shared fix. | No line asks what a fix makes removable. |
| commit gate mod | Blocks the commit until `ponytail-review` ran. | `DOC = /\.(md|mdx|txt|rst|pdf)$|(^|\/)docs\//` skips the review for each `.md` file, so skills and rules get none. |
| docs gate mod | Loads `writing-for-agents` before an edit to `SKILL.md`, `AGENTS.md`, or `CLAUDE.md`, also through a link. | `isDocName` matches `(SKILL|AGENTS|CLAUDE)\.md`. The agent edits `GLOBAL.md` and `CODING_STANDARDS.md` at their real path, which matches neither name. |
| `writing-for-agents` | No-ops, duplication, relevance, sediment, and sprawl. | It loads, but no step asks for the removal check on each edit. |
| `trim-agents-md` | Stale, conflicting, duplicate, and no-op lines, with a reason for each cut. Takes one path. | Manual (`disable-model-invocation: true`). No run since the 2026-10-06 cut. |
| `unslop`, `simple-english` | Wordy sentences. | They shorten sentences, not rules. |
| `check.sh` | Name, manifest, shellcheck, and a `SKILL.md` under 500 lines. | Counts lines, and a prose line is a paragraph. `verify-review` has 4,027 words in 203 lines. |

Inference. The repos have good subtraction tools for code. The rule files, which grow fastest, get the weakest checks.

---

## 10. Fixes, smallest first

Each fix removes text or uses a tool that exists. None adds a rule file.

1. Delete the stale copy step. File: `skills/sync-upstream/SKILL.md`, step 5. Remove the `rsync` sentence and the `diff -rq` step, and keep "Run the commit gate". The install is a link, so a commit applies at once. Confidence: high.
2. Gate the two global rule files. File: the docs gate mod, `isDocName`. Change `(SKILL|AGENTS|CLAUDE)` to `(SKILL|AGENTS|CLAUDE|GLOBAL|CODING_STANDARDS)`, and add the two names to the test. Then `writing-for-agents`, with its sediment and no-op rules, loads before each edit to the files that grow fastest. Confidence: high that it closes the gap, medium that it stops the growth.
3. Run `trim-agents-md` now on three targets: `GLOBAL.md` (with the path argument, no PR), `skills/verify-review/SKILL.md`, and `skills/field-test/SKILL.md`. Section 7 shows that one cut does not last. Run it again when a file grows by about half after its last trim. This needs no change. Confidence: high.
4. Put the subtraction cue into the existing gate step. File: dotfiles `agents/CODING_STANDARDS.md`, commit gate step 2. Change "Give it the user's request in the user's words" to "Give it the user's request in the user's words, and ask it what the change makes removable outside the diff, for example an old guard, a special case, or a retry that the fix goes around." In section 1, a cue alone raised subtraction by half or more. Confidence: medium.
5. Count words in `check.sh`, not lines. File: `check.sh`. Replace the 500-line test with a word cap, for example 5,000 words, near the size of `verify-review` now. Change the matching line in `CLAUDE.md`. A line cap does not see a paragraph that gets longer. Confidence: medium. It warns late, so fix 3 matters more.

Not recommended: a CI gate on net line growth. Section 5 shows that most code growth is tests that the rules ask for, so a growth metric flags the wanted change. Also not recommended: a new "prefer deletion" rule in `GLOBAL.md`. The rule already exists in `ponytail`, in `writing-for-agents`, and in the Anthropic guidance. One more copy adds load, and section 1 says that load lowers subtraction.
