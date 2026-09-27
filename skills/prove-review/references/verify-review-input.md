# Input: a /verify-review report

A `/verify-review` report gives each AI review thread on a PR a verdict: `confirmed`, `wrong`, `stale`, or `judgment`. It gives the evidence for each verdict, and for a judgment it gives a recommendation. The user acts on these verdicts. A `wrong` verdict becomes a public refutation under the user's name, and an accepted risk stays in the code. The claims to prove are the report's own statements: the verdicts, the facts under them, and the fixes the report proposes.

Every thread stays in the report. The user must decide on each one, so no thread can disappear.

## Step 2: build the claim list

Make one entry for each thread and each review-body item, in the order of the report. Each entry holds:

- The location of the thread and the bot's claim in one sentence. Read the first comment of the thread (`gh api repos/<owner>/<repo>/pulls/<pr>/comments`), so that the claim is the bot's own and not the report's paraphrase.
- The verdict and each fact it rests on.
- For a judgment, each fact under the recommendation, and each claim that the proposed fix makes, including its edge cases.

## Step 3: what proves each verdict

- `confirmed`: a probe that shows the flagged behavior at the head, in the bot's scenario.
- `wrong`: proof that the code handles the bot's scenario, with the bot's inputs and order of events. Proof about a neighbouring scenario (the other order, a different caller, a case the guard does cover) is not proof.
- `stale`: the commit that removed the behavior, and a probe or a quote that shows the behavior is gone at the head.
- `judgment`: as for `confirmed`, plus each fact and fix claim listed in step 2.

A verdict without proof becomes `judgment`, marked "not proved" with the reason. A fact without proof leaves the argument. If the recommendation rested on that fact, say that it lost that support. Put each change in a changed list, which takes the place of the dropped list.

## Step 4: the report shape

Write the report to the same file as in SKILL.md step 4. Keep the shape of the `/verify-review` report, so that `/verify-review` can go on from it:

1. A table with one row per thread: location, claim, verdict, proof.
2. One section per thread: the claim, the proof, and for a judgment the proved facts, the recommendation, and the fix plan.
3. "What a real run would write", updated to the proved verdicts.
4. "Decisions for you", with one numbered question per judgment and your recommendation.

## Step 5: the rounds

Z counts the entries that this round added to the changed list:

```text
Round N: factual F, advocate A; applied X (M material), refuted Y, changed Z. Verdicts: C confirmed, W wrong, S stale, J judgment.
```

## Step 6: the next step

Tell the user to answer the decisions. `/verify-review` then goes on with the proved verdicts, which replace the ones in its own table.
