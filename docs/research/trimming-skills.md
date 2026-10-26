# Research: how to trim a long skill safely

Date: 2026-10-26

Scope: the question "How do you trim a long Claude Code skill (a `SKILL.md` plus its reference files) with only methods that have evidence behind them?" The targets are `skills/verify-review/SKILL.md` (4,027 words, 203 lines) and `skills/field-test/SKILL.md` (3,001 words, 122 lines). [additive-bias.md](additive-bias.md) gives why and how fast these files grew. This note does not repeat it.

Each method has an evidence level:

- (a) Measured: an eval or a study, with its numbers.
- (b) First-party: Anthropic guidance, stated without published data.
- (c) Practice: what a maintained repo does.

"Source" lines give what a source says. "Inference" lines give my reading. I read the docs on 2026-10-26. The heads are this repo `a65188e`, `anthropics/skills` `dbd4588` (2026-10-09), and `mattpocock/skills` `5beb35b` (2026-10-19, the commit that `UPSTREAM.md` records).

## Summary

- No source measures what happens when you trim a skill. The studies measure long prompts in general. Anthropic gives limits and a deletion test, but publishes no data for them. For one skill, the only proof is an eval run of the old version against the trimmed version.
- Studies show that more instructions and more tokens lower instruction following. Up to a point, models drop late instructions more often than early ones. This supports "shorter is safer" and "put the important part first". It gives no word target. (a)
- After auto-compaction, Claude Code keeps only the first 5,000 tokens of a skill. By a bytes/4 estimate, `verify-review` has about 5,600 tokens, and the cut falls near line 182, inside step 6 ("Report"). In a long session, the agent can then lose steps 7 and 8. (b) for the rule, an estimate for the size.
- Anthropic's deletion test: "Does Claude really need this explanation?" and "Would removing this cause Claude to make mistakes? If not, cut it." A rule that must hold every time moves to a hook. (b)
- Anthropic's check: snapshot the old skill, run the same eval prompts on both versions in fresh contexts, and compare pass rate, time, and tokens. The `skill-creator` skill automates this. This repo already has 5 eval cases for `verify-review`. (b) for the method, (a) for the existing benchmark.
- Matt Pocock's `writing-for-agents` agrees on the deletion test. It disagrees on the check. Its docs page says "There is no automated eval." (c)

---

## Part 1: the sources

## 1. Measured: length and instruction count lower instruction following

Evidence level: (a). Confidence: high that the effect is real, low that the numbers transfer to one skill.

Source:

- Jaroslawicz et al., "How Many Instructions Can LLMs Follow at Once?" (IFScale), arXiv 2507.11538, 15 July 2025. The benchmark has 500 keyword-inclusion instructions in one report-writing task, 20 models, and 5 runs each. Abstract: "even the best frontier models only achieve 68% accuracy at the max density of 500 instructions." Table 1, claude-opus-4 accuracy at 10 / 50 / 100 / 250 / 500 instructions: 100.0 % / 100.0 % / 94.6 % / 67.9 % / 44.6 %. Reasoning models "maintain near-perfect performance through moderate densities (100-250 instructions) before degradation". On order, primacy effects "start low at minimal instruction densities ..., peak around 150-200 instructions, then level off or decrease at extreme densities". On error type: "Models overwhelmingly err toward omission errors as instruction density increases." https://arxiv.org/abs/2507.11538
- Levy, Jacoby, Goldberg, "Same Task, More Tokens", arXiv 2402.14848v2, 10 July 2024. The authors padded the same reasoning questions with irrelevant text. "LLMs quickly degrade in their reasoning capabilities, even on input length of 3000 tokens ... (on average over all tested models, a drop in accuracy from 0.92 to 0.68)." Also: "with longer inputs models tend not to follow specific instructions in the input". The models were GPT-4, GPT-3.5, Gemini Pro, Mistral, and Mixtral. https://arxiv.org/abs/2402.14848
- Du et al., "Context Length Alone Hurts LLM Performance Despite Perfect Retrieval", arXiv 2510.05381, 6 October 2025. 5 models, on math, QA, and code. "even when models can perfectly retrieve all relevant information, their performance still degrades substantially (13.9%–85%) as input length increases". This holds "even when the irrelevant tokens are replaced with minimally distracting whitespace". The closed models (GPT-4o, Claude 3.7 Sonnet, Gemini 2.0) "experience a smaller drop". The inputs go up to 30K tokens. https://arxiv.org/abs/2510.05381
- Liu et al., "Lost in the Middle", arXiv 2307.03172v3, 20 November 2023 (TACL 2024). "performance is often highest when relevant information occurs at the beginning or end of the input context". With the answer in the middle, GPT-3.5-Turbo did worse than with no documents at all (closed-book, 56.1 %). https://arxiv.org/abs/2307.03172

Inference. None of these studies tests a skill. IFScale instructions are single keywords, not procedural steps, and its models are from 2025. The padding studies add irrelevant text, and a skill adds relevant text. Two findings still transfer. First, each added instruction has a cost, and the cost shows as a dropped instruction, not a wrong one. Second, position matters, so put what must happen near the top. `verify-review` has about 204 sentences outside code blocks, and `field-test` has about 165. IFScale saw the first losses and the strongest primacy effect in that range, but the units differ. Treat this as a warning, not a measurement.

## 2. Anthropic: size limits and how a skill loads

Evidence level: (b). Confidence: high.

Source:

- Skill authoring best practices: "Keep the `SKILL.md` body under 500 lines for optimal performance. If your content exceeds this, split it into separate files using the progressive disclosure patterns". "once Claude loads it, every token competes with conversation history and other context." https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Agent Skills overview, loading table: metadata costs "~100 tokens per Skill" and is always loaded. Instructions are "Under 5k tokens" and load when the skill triggers. Resources cost "None until accessed". https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Claude Code skills docs: "Keep the body itself concise. Once a skill loads, its content stays in context across turns, so every line is a recurring token cost." On compaction: "Claude Code re-attaches the most recent invocation of each skill after the summary, keeping the first 5,000 tokens of each. Re-attached skills share a combined budget of 25,000 tokens." And: "put the most important instructions near the top of `SKILL.md`." https://code.claude.com/docs/en/skills
- The same page: the description and `when_to_use` text "is truncated at 1,536 characters in the skill listing". With `disable-model-invocation: true`, the table says "Description not in context, full skill loads when invoked".
- Claude Code memory docs, for `CLAUDE.md`: "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." https://code.claude.com/docs/en/memory
- Engineering blog, "Effective context engineering for AI agents", 29 September 2025: context is "a finite resource with diminishing marginal returns", and the goal is "the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome". It adds: "minimal does not necessarily mean short". https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

Inference. `check.sh` tests the 500-line cap, and both target skills pass it. The token figures are the limits that bind. The 5,000-token compaction rule is a mechanism, not advice. Text after that point can disappear in a long session. `verify-review` runs long sessions by design, because step 8 waits for the next bot review.

## 3. Anthropic: the deletion test

Evidence level: (b). Confidence: high.

Source:

- Best practices, "Concise is key": "Default assumption: Claude is already very smart. Only add context Claude doesn't already have. Challenge each piece of information: 'Does Claude really need this explanation?' 'Can I assume Claude has this information?' 'Does this paragraph justify its token cost?'"
- Claude Code best practices: "For each line, ask: 'Would removing this cause Claude to make mistakes?' If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions!" And: "Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook." https://code.claude.com/docs/en/best-practices
- Claude Code skills docs, "Claude stops following a skill": "Claude skipped a rule that must hold every time: move the rule into a hook."
- Prompting best practices: Opus 4.5 and 4.6 "are also more responsive to the system prompt ... The fix is to soften any aggressive language. Where you might have said 'CRITICAL: You MUST use this tool when...,' you can use more normal prompting". https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Prompting Claude Opus 4.8: "If you've added scaffolding to force interim status messages ... try removing it." Also, the model "does not silently generalize an instruction from one item to another ... If you need Claude to apply an instruction broadly, state the scope explicitly". https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8
- Blog, "Improving skill-creator", 3 March 2026: "If the base model starts passing your evals without the skill loaded, that's a signal the skill's techniques may have been incorporated into the model's default behavior." https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills

Inference. The Opus 4.8 note is a trap for a trim. If you replace three worked examples with one general rule, give the scope of the rule ("for each finding", "on every run"). Otherwise the model can apply it to one item only. Neither target skill has an all-caps MUST, NEVER, or ALWAYS, so the "soften" pass has nothing to do there.

## 4. Anthropic: move text out, do not only delete it

Evidence level: (b). Confidence: high.

Source:

- Engineering blog, "Equipping agents for the real world with Agent Skills", 16 October 2025: "When the SKILL.md file becomes unwieldy, split its content into separate files and reference them. If certain contexts are mutually exclusive or rarely used together, keeping the paths separate will reduce the token usage." https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Best practices: "Keep references one level deep from `SKILL.md`". The reason: with nested references, "Claude might use commands such as `head -100` to preview content rather than reading entire files". Also: "For reference files longer than 100 lines, include a table of contents at the top."
- Best practices, on scripts: "Only the script's output consumes tokens".
- Best practices, "Observe how Claude navigates Skills": "Ignored content: If Claude never accesses a bundled file, it might be unnecessary or poorly signaled in the main instructions."

Inference. `verify-review` already does this for Forgejo and stacks. Its two pointers sit at the top and name the condition first. Repeat that pattern for the other branches.

## 5. Anthropic: check the trim with evals

Evidence level: (b) for the method. The only published number is (a), and it is about descriptions, not body length.

Source:

- Best practices, "Build evaluations first": identify gaps, "Build three scenarios", "Establish baseline", "Write minimal instructions", "Iterate". "Evaluations are your source of truth for measuring Skill effectiveness."
- Claude Code skills docs: "Collect a few realistic prompts, run each one in a fresh session with the skill available and again with it turned off, and compare the results. A fresh session matters because leftover context from authoring the skill will mask gaps in the written instructions."
- `skill-creator` `SKILL.md` (anthropics/skills `dbd4588`), for an existing skill, the baseline is "the old version. Before editing, snapshot the skill (`cp -r <skill-path> <workspace>/skill-snapshot/`), then point the baseline subagent at the snapshot. Save to `old_skill/outputs/`." Both arms run "in the same turn". The aggregation command is `python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>`. It writes pass rate, time, and tokens "with mean ± stddev and the delta". The skill also says: "Keep the prompt lean. Remove things that aren't pulling their weight. Make sure to read the transcripts, not just the final outputs". https://github.com/anthropics/skills/tree/main/skills/skill-creator
- `skill-creator`, blind comparison (`agents/comparator.md`): "give two outputs to an independent agent without telling it which is which".
- `skill-creator`, description tuning: `python -m scripts.run_loop --eval-set <path> --skill-path <path> --model <model-id> --max-iterations 5`. It "splits the eval set into 60% train and 40% held-out test", runs "each query 3 times", and picks `best_description` "by test score rather than train score to avoid overfitting". `scripts/run_eval.py` calls `claude -p` for each query.
- Agent Skills spec site, "Evaluating skills". Anthropic published the standard and links this page from the skills docs. "Keep the skill lean. Fewer, better instructions often outperform exhaustive rules. If transcripts show wasted work ..., remove those instructions. If pass rates plateau despite adding more rules, the skill may be over-constrained". The next words are "try removing instructions and see if results hold or improve." Also: "Remove or replace assertions that always pass in both configurations." https://agentskills.io/skill-creation/evaluating-skills
- Claude Code plugin evals: `claude plugin eval init` writes cases, and `claude plugin eval .` runs each case "three times by default", with and without the plugin, and reports `Δ`. "A single run is noisy, so confirm any change at the default three runs before you trust it." Shell commands run in a sandbox, with network access only to granted domains. https://code.claude.com/docs/en/plugin-evals
- Blog, "Improving skill-creator": description tuning gave "improved triggering on 5 out of 6 public skills". The post gives no method or numbers beyond that.

Inference. `claude plugin eval` compares a plugin with no plugin, not two versions of one skill. To use it for a trim, you run it twice, before and after. `skill-creator` compares the two versions directly with the `old_skill` arm. `verify-review` needs `gh` and the network, so `skill-creator` fits it better.

## 6. Where Anthropic's own sources disagree

Evidence level: (b) on both sides. Confidence: high that the texts conflict.

Source:

- Claude Code skills docs: "State what to do rather than narrating how or why".
- `skill-creator`: "Try hard to explain the **why** behind everything you're asking the model to do." The prompting guide: "Providing context or motivation behind your instructions ... can give Claude more information about your goals". Its example: "never use ellipses since the text-to-speech engine will not know how to pronounce them."
- Best practices, on iteration with Claude A and Claude B: Claude A "might recommend ... using stronger language such as 'MUST filter' instead of 'always filter'". `skill-creator` calls all-caps ALWAYS or NEVER "a yellow flag", and the prompting guide says to "soften any aggressive language".

Inference. The two positions fit if a reason stays only where it changes behaviour, for example where it lets the model handle a case that the rule does not name. A paragraph that tells history, such as which PR caused a rule, is the narration that the Claude Code docs cut. This repo's `CLAUDE.md` says "Explain why, not just what", so a trim keeps the reason and drops the story. Settle a disputed line with an eval, not by debate.

## 7. Matt Pocock: practice

Evidence level: (c). Confidence: high for what the repo says and does.

Source:

- `writing-for-agents` defines the no-op test: "does it change behaviour versus the default? ... settle it by running the document, not by debate. When a sentence fails, delete the whole sentence rather than trim words from it." It names sprawl: "a document simply too long, even when every line is live and unique." The copy in this repo is the same as upstream `5beb35b`.
- Its docs page, `docs/productivity/writing-for-agents.md`: "Agents told to 'streamline' optimise for length, because length is the thing they can see. The no-op test checks behaviour, not style". "There is no automated eval. You check by running the document by hand". Under "It's working if": "The document gets shorter as it gets better". And: "Updating for a new model is usually another no-op pass rather than a rewrite."
- `CHANGELOG.md`: `tdd` dropped its step-by-step Workflow, because "The red → green → refactor loop is anchored by leading words the model already holds, so the step-by-step Workflow was largely restating the loop." `review` got "single-sourced rules, and no-op cuts". `zoom-out` "went unused in practice, so it's been removed". On `wait-what`: "Concision skills fail by growing".
- Sizes at `5beb35b`: the 27 skills in `engineering/` and `productivity/` have a median `SKILL.md` of 574 words. The largest is `wayfinder`, with 2,075 words. Of 265 commits that change a `SKILL.md`, 40 make it shorter.
- `SCOPE.md`: an issue stays open only with an "Observed failure ... in a real session". A hypothetical improvement does not clear the bar.

Inference. The largest Pocock skill is about half the size of `verify-review`. His "Observed failure" bar is the same filter as Anthropic's "Identify gaps", applied to each addition. Practice and guidance agree on what to cut. They differ on proof. Pocock runs the document by hand, and Anthropic runs evals against a baseline.

## 8. The sources against `writing-for-agents`

| `writing-for-agents` | Anthropic | Verdict |
|---|---|---|
| No-op test, sentence by sentence | "Claude is already very smart", "Would removing this cause Claude to make mistakes?" | Agree. (b) |
| Settle a no-op "by running the document" | Evals against a baseline, in fresh sessions | Both run the document. Pocock's docs page says there is no automated eval. Anthropic gives `skill-creator` and `claude plugin eval`. |
| Progressive disclosure is "Not primarily a token optimisation" | Disclosure is about token cost: "reduce the token usage", "cost zero tokens" | Same move, different reason. Both reasons hold. |
| Branching test: inline what every branch needs | Put contexts that are "mutually exclusive or rarely used together" in separate files | Agree. (b) |
| Sprawl: too long even when every line is live | Context rot, "finite attention budget". IFScale and Levy measure it. | Agree. (a) and (b) |
| Prompt the positive, avoid negation | "Tell Claude what to do instead of what not to do" (format section) | Agree. (b) |
| Leading words | No Anthropic source | Practice only. (c) |
| No word or line target | 500 lines, under 5k tokens, 5,000 tokens kept after compaction | Anthropic is stricter. `writing-for-agents` does not mention compaction. |
| No rule on position | "put the most important instructions near the top", IFScale primacy, Lost in the Middle | A gap in `writing-for-agents`. |
| No rule for a line that must always hold | Move it to a hook | A gap in `writing-for-agents`. |

---

## Part 2: this repo

## 9. The two target skills now

Confidence: high for the counts, medium for the token estimate.

Source (measured at `a65188e`):

- `verify-review/SKILL.md` has 22,455 bytes. That is about 5,600 tokens at 4 bytes per token, and 5,000 to 6,400 tokens at 3.5 to 4.5 bytes per token. The 20,000th byte is at line 182, in step 6 ("Report"). Step 7 starts at line 185, and step 8 at line 189. The two reference files have 948 words.
- `field-test/SKILL.md` has 17,440 bytes, about 4,400 tokens. Its six reference files have 7,139 words. Two of them, `rigs.md` (2,876 words) and `browser.md` (2,049 words), are longer than the 100 lines at which Anthropic asks for a table of contents.
- `verify-review` has `evals/evals.json` with 5 cases on public `autobrr/qui` PRs, last changed 2026-10-13. Git does not track the file, because `.gitignore` has `evals/` and `*-workspace/`. The workspace has a `skill-creator` benchmark from 2026-09-19, when the skill had 1,510 words. Iteration 2 scored 97 % ± 5 % with the skill and 51 % ± 16 % without it, with 3 runs each on evals 0 to 2.
- `field-test` has no evals.
- `verify-review` does not set `disable-model-invocation`, but its description says "Run it only when the user names it". Its description is in context on every turn.

Inference. The benchmark tested a skill less than half the current size. The 2,500 words added after it have no benchmark. A trim cannot show that it kept their behaviour until an eval covers them.

---

## 10. Procedure: trim one skill (verify-review)

Each step uses only level (a) or (b) methods, and the tool names come from the sources.

1. Snapshot the skill: `cp -r skills/verify-review skills/verify-review-workspace/skill-snapshot/`. This is the `old_skill` baseline of `skill-creator`. (b)
2. Cover the branches before you cut. List each branch that the skill handles: Forgejo, stacks, `--fix`, the Codex rating, the report, the reply, and the wait loop. For each branch that the 5 cases miss, add a case to `evals/evals.json`. Keep the `--dry-run` form for cases that must not write. (b)
3. Delete the no-ops. For each sentence, ask "Would removing this cause Claude to make mistakes?" and "Does Claude really need this explanation?" If the answer is no, delete the whole sentence. If a rule must hold on every run, move it to a hook, not to more text. (b)
4. Cut the story and keep the reason. Keep a reason when it lets the model handle a case that the rule does not name. Delete history, such as which PR led to a rule. When several examples become one rule, state its scope ("for each finding"), because Opus 4.8 does not generalize on its own. (b)
5. Disclose by branch. Move text that only some runs need to a file in `references/`, one level deep. Put the pointer at the top, and name the condition first. Give each reference file over 100 lines a table of contents. Move a fixed command sequence to `scripts/`, so that only its output enters context. (b)
6. Order by importance. Put the steps that must survive a long session in the first 5,000 tokens. To see the size, run `/context` in a session that invoked the skill. (b) for the compaction rule, (a) for primacy.
7. Run both versions. In one turn, start a fresh subagent for each eval case with the trimmed skill, and one with the snapshot, 3 runs each. Grade with `agents/grader.md`. From the `skill-creator` directory, run `python -m scripts.aggregate_benchmark skills/verify-review-workspace/iteration-N --skill-name verify-review`. Open the viewer with `eval-viewer/generate_review.py`. (b)
8. Decide. Keep the trim if its pass rate is within the stddev of `old_skill`, and time and tokens did not go up. If two outputs both pass but differ, use the blind comparator. For each failed assertion, read the transcript. An ignored instruction can be ambiguous, and wasted work points to an instruction to remove. Remove assertions that pass in both arms, because they show nothing. (b)
9. If the description changed, check triggering. Write 20 queries: 8 to 10 that must trigger the skill, and 8 to 10 near misses. Run `python -m scripts.run_loop --eval-set <file> --skill-path skills/verify-review --model <session model id> --max-iterations 5`. If the skill runs only when the user names it, `disable-model-invocation: true` removes the description from context. Keep model invocation only if another skill must call it. (b)
10. After each model change, run step 7 again. If the run without the skill starts to pass, that part of the skill is no longer necessary. (b)

For a quick check without `skill-creator`, the Claude Code docs give the minimum. Run each eval prompt "in a fresh session with the skill available and again with it turned off", for example with `claude -p "<eval prompt>" --output-format json`. The `--bare` flag skips skills, unless you load them with `--add-dir` or `--plugin-dir`.

For `field-test`, step 2 comes first and takes longer, because the skill has no evals. Its runs start rigs and browsers, so the eval prompts must use a local rig, not the production host.

Two methods have no evidence, so this note does not recommend them. The first is a word cap as the only gate, because no source ties a word count to behaviour. The second is a trim that you judge by reading alone. Pocock's docs page names that failure: an agent told to streamline will "optimise for length".

## Sources I could not use

- Chroma, "Context Rot", 14 July 2025. The Anthropic context-engineering post links it for the term "context rot". I opened it. It tests 18 models and finds that "performance grows increasingly unreliable as input length grows". Its numbers are in charts only, so I did not use it as evidence. https://www.trychroma.com/research/context-rot
- Matt Pocock's posts and videos. The repo does not point to any on pruning or measuring skills, so I did not search for them.
