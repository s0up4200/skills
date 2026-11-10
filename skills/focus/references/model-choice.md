# Model choice for a task

Read on 2026-11-10 from "Which Claude model should you build with?": https://claude.dev/blog/which-claude-model-should-you-build-with/

The model names and the table go stale when a new model ships. If the article names newer models than this file, use the article and tell the user that this file is old.

## The rule

Start on Opus 5.5 at `medium` effort. Opus is the default in Claude Code, and the article says to use it when unsure. Move away from it only for a reason in the table.

A per-token price doubles at each step up: Sonnet 5.5 is $2 / $10 per million input / output tokens, Opus 5.5 is $4 / $20, and Fable 5.2 is $8 / $40. Haiku 5.5 is $0.10 / $0.50 for a prompt of 100K tokens or less.

## The article's table

| Task | Model | Effort |
|---|---|---|
| Everyday engineering, debugging, a feature of many PRs | Opus 5.5 | `medium`, then `high` |
| Well-scoped coding: a bug fix, a feature built against a spec | Sonnet 5.5 | `medium`, then `high` |
| Repeated agent tasks: investigation, review, drafting | Sonnet 5.5 | `medium` |
| Major refactor, migration, architecture, leading many subagents | Fable 5.2 | `medium`, then `high` |
| Deep research, scientific or quantitative analysis | Fable 5.2 | `medium`, then `high` |
| Classification, routing, tagging, extraction in high volume | Haiku 5.5 | `medium` |
| Subagents that search files, read logs, or summarize | Haiku 5.5 or Sonnet 5.5 | model default |
| Unsure | Opus 5.5 | `medium` |

A clear spec is not enough for Sonnet. The article names a migration and a performance optimization as work that can have a clear spec and still need Opus, or Fable when it is major.

## From a focus rank to a row

The article does not know the ranks of this skill. This mapping is a reading of its table, so let the facts of the task overrule it.

| Next step | Row | What moves it up |
|---|---|---|
| Review a PR (`/code-review`) | Repeated agent tasks: Sonnet, `medium` | A large diff, or a diff that touches a migration, concurrency, or a hot spot: Opus |
| Answer a teammate's question or plan (`/grilling`) | Unsure: Opus, `medium` | A question about architecture: Fable |
| Merge, or close a done issue | No session needed | |
| The user's PR with requested changes | Well-scoped coding: Sonnet, `medium` | The reviewer asks for a new design: Opus |
| Refactor | Everyday engineering: Opus, `medium` | A gate, or a refactor across many packages: Fable |
| Implement a `ready-for-agent` issue (`/implement`) | Well-scoped coding: Sonnet, `medium` | A feature of many PRs, a hard bug with no known cause, a migration, or a performance fix: Opus |
| Triage (`/triage`) | Repeated agent tasks: Sonnet, `medium` | |
| Grill a parked idea (`/grill-with-docs`) | Unsure: Opus, `medium` | The idea changes the architecture: Fable |

## When the model falls short

The article gives this order:

1. Make sure that the model can check its own work with a test, a build, or a script.
2. Raise the effort one level. Effort helps when the model must think longer or check more. It does not add skill that the model lacks.
3. Move to the next model up, at a lower effort than the smaller model used. Test Fable 5.2 before you raise Opus 5.5 past `high`.

## A new model needs a new session

A prompt cache belongs to the model that wrote it, so the first turn after a switch pays the full write price. A model also cannot read the thinking of a model above it. Thus the user starts the task in a new session on the suggested model (`/model` in Claude Code), not in the session that ran `/focus`.
