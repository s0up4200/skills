---
name: prove-review
description: Prove every claim in a /code-review or /pr-review-toolkit:review-pr report with a probe test, a mutation, or an exact quote, then attack the proved report with two fresh verifier agents each round until neither finds a problem. User-invoked only, as /prove-review [pr].
disable-model-invocation: true
argument-hint: "[optional: PR number or URL]"
---

# Prove review

A review finding is a claim, and the author of the code will argue with each one. A claim that loses that argument costs more than a claim that was never made: the author spends time on it, and the rest of the review loses credibility. This skill keeps a finding only when it has **proof**, and then attacks the proved report with fresh agents until they cannot break it.

Dropped findings are the normal result. A run on a real PR started with ten findings and posted six. Each round removed more wrong fixes, test recipes that did not work, and claims the PR body already disclosed. A report that shrinks is working as intended.

The skill is expensive. One run on a medium PR took four rounds and about 1.1M subagent tokens. The user asked for that cost when they typed the command.

Arguments: `/prove-review [pr]`. With no PR, use the PR named in the conversation. If the conversation names none, use the PR of the current branch. If the current branch has no PR, the target is the current branch against the merge-base with the default branch.

The agent briefs sit next to this file: `<skill base directory>/references/agents.md`.

## Proof

A claim has proof when one of these shows it:

- **Probe**: a test that passes on the reviewed head and shows the defect. Include the test code, the command, and the result.
- **Mutation**: one line changed in a throwaway copy, and the relevant test packages stay green. This proves that no test covers the line. The mutation must change behavior. A mutant that behaves the same as the original (an equivalent mutant) proves nothing.
- **Quote**: an exact quote with its `file:line`, from the code, the issue, the design document, or the PR body, that shows the fact directly.

Reasoning is not proof. A consequence claim ("this kills the connection after 15 s", "this makes X stale") needs a run that shows the consequence, even when a quote shows the cause.

A suggested fix and a suggested test recipe are claims too. A fix that names a field must name a field that exists. A recipe must pass on the head and fail under its matching mutation.

## 1. Find the reports and the target

Find the review reports in this conversation. Two kinds count:

- A `/code-review` report, with a `## Standards` section and a `## Spec` section.
- A `/pr-review-toolkit:review-pr` report, with findings grouped by severity (Critical, Important, Suggestions) and by agent.

If there is neither, stop and tell the user to run `/code-review` or `/pr-review-toolkit:review-pr` first. Do not run a review yourself. If more than one report of a kind exists and you cannot tell which one the user means, ask.

Record the target facts. For a PR:

```bash
gh pr view "$pr" --json number,title,body,headRefOid,baseRefName,author,closingIssuesReferences
git fetch origin "pull/$pr/head" "$base"
git merge-base "$head_sha" "origin/$base"
```

For a branch without a PR, the head is `HEAD` and the base is the merge-base with the default branch. Also note the spec sources: the linked issue, and each design document that the report or the PR body names.

Pin every proof to the head SHA. Proofs against an old head do not carry over.

## 2. Build one finding list

Merge the reports into one numbered list. Each finding gets one claim sentence, its `file:line` references, its suggested fix if any, and an axis:

- **Spec**: the finding compares the code with the linked issue or a design document.
- **Standards**: everything else. This covers the repository's rules, correctness, tests, comments, and type design.

If two reports name the same defect, keep one finding and the stronger evidence.

## 3. Prove each finding

Sort the findings into two groups.

A finding that a quote can prove: open the file, the issue, or the PR body, and find the exact text. If the quote shows the fact directly, the finding is proved. If it shows only the cause of a claimed consequence, move the finding to the second group.

A finding that needs a probe or a mutation: dispatch prover agents on Opus, in parallel, in one message. Give each agent the findings that touch one file or one package, so that one throwaway copy serves them all. The prompt names the repository path, the head SHA, the merge-base, the findings in full, and this instruction: "Read `<skill base directory>/references/agents.md`. Follow the Common rules section and the Prover section."

A finding without proof leaves the list. Keep it in a dropped list with one reason: refuted (with the evidence), equivalent mutant, no proof found, or needs a real host.

## 4. Write the report

Write the report to `prove-review-report.md` in the scratchpad:

```markdown
## Standards

**1. <the claim, as a sentence>** `file:line`

<what is wrong and when it matters, in first person where you produced the evidence>

<the proof: probe code and result, the mutation and the test command with its result, or the quote>

<the suggested fix, if any>

## Spec

...
```

If an axis has no proved findings, write "No findings." under its heading.

If no finding survived step 3, stop. Tell the user that nothing was proved, and print the dropped list.

## 5. Verification rounds

Before each round, compare the PR head with the pinned SHA (`gh pr view "$pr" --json headRefOid`). If it moved, stop and tell the user.

Each round, dispatch two new Opus agents in parallel, in one message: the **factual verifier** and the **author's advocate**. Use new agents every round, never a resumed one. A resumed agent checks its own old findings again, and a new one finds new classes of problems. Round 2 of the first run found a test recipe that failed on the head. Round 3 found consumers that could not use the proposed interface. Neither was in round 1.

Each prompt names the repository path, the head SHA, the merge-base, the PR number if any, the spec sources, the report path, the findings that are new or changed since the last round (from round 2 on), and this instruction: "Read `<skill base directory>/references/agents.md`. Follow the Common rules section and the <role> section."

When both agents return, take each finding in turn:

1. Confirm it at the code before you change the report. Open the file, run the grep, or rerun the command. The verifiers are right most of the time, but a wrong change puts a wrong claim under the user's name.
2. If it holds, change the report: correct the claim, narrow a word, fix the recipe, move the finding to the other axis, or drop the finding. Put each dropped finding on the dropped list with its reason.
3. If it does not hold, keep the report as it is, and write down the evidence. If a later round raises the same point again, stop and ask the user. A disagreement that comes back twice is a judgment for the user, not for you.

After each round, print one status line:

```text
Round N: factual F, advocate A; applied X, refuted Y, dropped Z. Left: S Standards, P Spec.
```

The loop stops when both agents end with `NO FINDINGS` in the same round. There is no round limit.

## 6. Report

Print the full final report. Then print:

- The head SHA that every proof is pinned to.
- The round status lines.
- The dropped list: each dropped finding in one line, with its reason.
- The next step: if the user wants to post the review, `/post-review` uses this report.

Remove every throwaway copy that the agents made, if one remains: `ls /var/tmp/prove-review/` must show nothing for this head SHA.
