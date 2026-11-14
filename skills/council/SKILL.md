---
name: council
description: Send a review or a question to three models from three providers in parallel. For a review, fix the findings that you accept, and run fresh rounds until no blocking finding is left, for at most 3 rounds.
disable-model-invocation: true
argument-hint: "[what to review or ask] [optional: named members, non-blocking members]"
---

# Council

A **council** is three delegates, one strong model from each of three providers. Each provider has different blind spots, so a finding that two of them make is a strong signal, and a disagreement shows where the judgment call is.

## 1. Prepare a review

Skip this step for a question. Before a review, give the council the current implementation, not one with known defects:

- Leave the open review threads on the pull request to `verify-review`. Do not read, fix, or answer them in this skill.
- Fix the known issues and run the relevant checks.
- If the user wants to discard the implementation and explore new ideas, skip the fixes to the code that goes away.

## 2. Pick the members

Outside T3 Code, use the subagent tool of the harness, and start each member with a fresh context window. Some harnesses, for example Codex, fork the parent conversation by default, and a fork carries your reasons. If the harness reaches only one provider, as the `Agent` tool of Claude Code does, report that the council cannot meet.

In T3 Code, call `orchestrator_capabilities` first, also when the user names the members. Use only provider instances with `canRunChildTask: true`. A member on a provider other than yours also needs `canRunCrossProviderChildTask: true`.

If the user names the members, resolve each name to a `providerInstanceId` and a model. Otherwise take the newest version of these three models: Claude Opus, Codex GPT Sol, and Muse Spark Contributor. The list leaves some models out, so call `orchestrator_capabilities` with `search` when the model that you want is not in it. The three must come from different `driverKind` values, because two instances of one driver count as one provider.

Set the reasoning option (`effort` or `reasoningEffort`) to `high`, because most providers default to `low` or `medium`. Set Muse Spark Contributor to `xhigh`.

If fewer than three providers can run a child, or a named member is not available, tell the user which one is missing and stop. A substitute from the same provider shares the blind spots that the council is there to find.

## 3. Start a round

Start the members in parallel with `delegate_task`: one call for each member, `role: "review"` for a review, `isolation: "shared"`, and the `providerInstanceId`, model, and option from step 2. Keep each `taskId`. Steps 3 and 4 name the T3 Code tools. Outside T3 Code, use the tools of the harness that start a subagent, wait for its result, and answer its question, with the same model, option, and brief.

A delegate gets no parent history, and it can run on a provider without the user's skills. So the `task` brief carries all that it needs:

- The request in the user's words, and its scope, so that each finding outside the scope is labelled as a follow-up.
- Where the work is: the checkout path, the branch, and the diff command. Fetch the base branch first, because a local default branch is often stale. Use `git diff <base>...HEAD` for committed work, `git diff HEAD` for uncommitted work, and `git diff $(git merge-base <base> HEAD)` for both. `git diff` leaves out untracked files, so list the new files from `git status --short`.
- The paths of the files that document how to write code: in this repo, for example `CODING_STANDARDS.md`, `CONTRIBUTING.md`, and `CLAUDE.md`, and each coding standards file that the user's global instructions name.
- The spec: the text of the issue. With no issue, give the part of the pull request body that says what the change must do.
- For a review or feedback: "Read only. Do not edit files, commit, push, or post on GitHub." A narrow `runtimeMode` asks for approval but does not block writes, so the brief is the guard.
- Leave out your reasons for the code, the pull request body and its discussion, and the findings of earlier rounds. A reviewer that reads the reasons judges the reasons, not the code.

For a code review, paste these rules into the brief:

> Report each place where the diff breaks a documented standard (cite the file and the rule), each requirement of the spec that is missing or wrong, and each behavior that the spec did not ask for. Before you report a finding, read the callers, guards, and tests that reach the changed code, and drop the finding if they rule it out. Label each finding as an old defect or as a regression from this change, and as blocking or not. Report nothing when you find nothing. Give a score out of 10 for the work as it stands.

Each full review pass is one **round**. A fresh review after fixes is a new round with new `delegate_task` calls, never a `t3_thread_send` to an old delegate.

## 4. Act on each result as it arrives

Follow the `next` of each running delegate. Do not poll with `task_status`, `sleep`, or a watcher.

When a result arrives, check each finding against the code at once, and decide what to fix while the other delegates run. Do not edit files while a blocking member still reads the checkout, because it then reviews a moving target. Make the fixes when the last blocking member of the round is done.

If a member fails or is cancelled, report it, write `no score` for it, and do not start a substitute. If a member asks a question, answer it with `t3_pending_request` on its `childThreadId`, from the request, or ask the user first.

Do not wait for a non-blocking member. Its late result can describe code that changed since it read it, so check each finding against the current code, and treat it as feedback. Do not record its score.

## 5. Go again or stop

A question gets one round, then the report.

For a review, make the fixes that you accept, and run the checks. Fight scope creep: a finding outside the request becomes a follow-up in the report, not a change. Stop at the first of these that applies, and go to step 6:

- A blocking member failed or was cancelled in this round. The council is incomplete, so report it and ask the user whether to run the round again.
- No member reports a blocking finding. If you made fixes in this round, say that no member reviewed them.
- You rejected every blocking finding in 2 rounds in a row. You may only be defending the code, so list each finding with your reason.
- 3 rounds are done. List the findings that are still open, say that no member reviewed the fixes of the last round, and ask the user whether to run another round.

Otherwise start the next round (step 3).

## 6. Report

```markdown
**owner/repo#123** · the plan, diff, or question that the council read · 2 rounds
**Status:** one of: no blocking finding left, incomplete because a member failed, stopped because I rejected every finding, stopped at 3 rounds, or waits for you.
**Scores:** Claude Opus 7 → 9 · GPT Sol 8 → 10 · Muse Spark 7 → no score

**Answer**
- For a question: the conclusion that the members support, checked at the code.

**Fixed**
- A finding that you fixed, by its effect on the app, and which members made it.

**I rejected**
- A finding, and the reason, checked at the code.

**The members disagree**
- The point, and what each member says.

**Follow-ups:** findings outside the request.

**Reply with** what the user can answer, or leave this line out when nothing waits.
```

With no pull request or issue, the first line names the repo and the branch. Leave out an empty section. If a member gives no score, write `no score`. Do not invent one.

If the work ends in a pull request, put the scores in its body:

```markdown
## Council review

Rounds: 2

| Delegate | Round 1 | Round 2 |
| --- | --- | --- |
| Claude Opus | 7/10 | 9/10 |
| GPT Sol | 8/10 | 10/10 |
| Muse Spark | 7/10 | no score |
```

Read the live body with `gh pr view <n> --json body --jq .body`. Replace the old section, or add the section at the end, above a closing model or harness line if the body has one. Save the new body to a scratch file, and write it back with `gh pr edit <n> --body-file <file>`. Change no other part of the body, and do not post a comment for this. Then read the live body again, and make sure that `diff` against the old body shows changes only in the `## Council review` section. If there is no pull request, put the report in the final reply only.
