# Model choice for a task

Source: the video "I think I figured it out" by Theo (t3.gg), summarized on 2026-11-13. It is the opinion of one developer who had used Fable 5.2 for two days. It is not a guide from Anthropic.

The model names go stale when a new model ships. If a newer Opus or Fable is out, tell the user that this file is old.

## The rule

Start each row on Opus 5.5 at `high`. Opus checks everything and rarely misses a detail, so it fits work that a test, a build, or a diff can prove: a fix, a migration, a rewrite, a review.

Use Fable 5.2 at `high` for work that no test can prove: a design, an architecture, a new idea, a plan. Fable challenges the premise and knows when to stop, but it sometimes misses a small detail. In code review, it lets small findings pass, so keep reviews on Opus.

Use `high` effort. `medium` and `xhigh` also work. `low` misses too much, and `max` makes the model overthink: Fable scores lower on `max` than on `xhigh`.

Sonnet and Haiku get no row. Sonnet uses many tokens when the way to the fix is not clear, and Haiku is for classification in high volume, not for code.

Fable costs twice as much as Opus per token: $8 / $40 against $4 / $20 per million input / output tokens. On the $200 plan, Fable can use only half of the weekly limit.

## From a focus rank to a row

Let the facts of the task overrule this table.

| Next step | Model | What moves it to Fable |
|---|---|---|
| Review a PR (`/code-review`) | Opus, `high` | |
| Answer a teammate's question or plan (`/grilling`) | Fable, `high` | |
| Merge, or close a done issue | No session needed | |
| The user's PR with requested changes | Opus, `high` | The reviewer asks for a new design |
| The user's PR with unresolved threads (`/verify-review`) | Opus, `high` | A thread asks for a new design |
| A live run before a merge (`/field-test`) | Opus, `high` | |
| Refactor | Opus, `high` | The refactor needs a new design that no test can judge |
| Implement a `ready-for-agent` issue (`/implement`) | Opus, `high` | |
| A bug with no known cause (`/diagnosing-bugs`) | Opus, `high` | An earlier Opus session ran in circles on the bug |
| Triage (`/triage`) | Opus, `high` | |
| Challenge a feature request (`/challenge-request`) | Fable, `high` | |
| Grill a parked idea (`/grill-with-docs`) | Fable, `high` | |

## When the model falls short

1. Make sure that the model can check its own work with a test, a build, or a script.
2. If an Opus session runs in circles on one problem, start a new session on Fable. In Theo's example, Opus built the test rig for a slow thread, and Fable then found a fix that cut the data sent by about 150 times.
3. Raise the effort one level, to `xhigh` at most.

## A new model needs a new session

A prompt cache belongs to the model that wrote it, so the first turn after a switch pays the full write price. A model also cannot read the thinking of a model above it. Thus the user starts the task in a new session on the suggested model, not in the session that ran `/focus`. In Claude Code, `/model` sets the model. In T3 Code, `start` opens the new session.
