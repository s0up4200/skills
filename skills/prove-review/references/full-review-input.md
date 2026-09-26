# Input: a /full-review run

`/full-review` gives you four reports on one PR head:

- A `/code-review` report.
- A `/pr-review-toolkit:review-pr` report.
- A design review, with `## Walkthrough`, `## Findings`, `## Follow-ups`, and `## Design questions` sections. Its findings are about the negative space (what else must change for a promise to hold) and the architecture.
- A `/verify-review --dry-run` report on the unresolved AI threads, or a note that there are none.

You also get `promises.md`: a numbered list of what the PR says it does. The review exists to show whether each promise holds.

Prove all of them in one run. The review findings follow SKILL.md. The threads follow `verify-review-input.md`, except where this file says otherwise.

## Step 2: build the list

Merge the findings from `/code-review`, `review-pr`, and the design review's `## Findings` into one list, as SKILL.md says. Tag each finding with the promise it breaks, or "no promise". A finding that breaks a promise goes under Spec. A finding that breaks no promise goes under Standards.

The walkthrough, the follow-ups, and the design questions are not claims to prove. Leave them out of the list. `/full-review` prints the walkthrough and the design questions. Copy the follow-ups, unproved, into a `## Follow-ups` section at the end of the report, marked as notes that are not posted.

Make one thread entry for each AI thread, as `verify-review-input.md` says. A `confirmed` thread is also a defect in the PR, so it goes on the finding list too:

- If a review finding names the same defect, keep that finding and add the thread location to its references.
- If no review finding names it, add a new finding from the thread's claim.

## Step 3: proof

A `confirmed` thread and its finding share one proof: the probe that shows the flagged behavior at the head proves both. If the verdict is not proved, it becomes `judgment` as `verify-review-input.md` says, and its finding goes on the dropped list with the reason "thread verdict not proved".

## Step 4: the report shape

Open the report with `## Promises`: one line for each promise in `promises.md`, marked holds, broken, or partly, with the numbers of the proved findings behind the mark. A promise with no proved finding against it holds. Then write `## Standards` and `## Spec` as SKILL.md says. Then write `## AI threads` in the shape that `verify-review-input.md` gives. A `confirmed` thread's section points to its finding number and does not repeat the proof. If there are no AI threads, write "No unresolved AI threads." under the heading.

If no finding survived and there are no AI threads, stop as SKILL.md says. If only threads are left, run the rounds on them.

## Step 5: the rounds

In each prompt, the kind of report is "a /full-review report: Standards and Spec findings, then an AI threads section". The advocate takes the author's side on the findings and the side each verdict ruled against on the threads.

A point that changes the status of a promise is material too.

The status line joins both forms:

```text
Round N: factual F, advocate A; applied X (M material), refuted Y, dropped Z, changed V. Left: S Standards, P Spec. Verdicts: C confirmed, R wrong, T stale, J judgment.
```

Z counts the findings dropped in this round. V counts the entries this round added to the changed list.

## Step 6: the next step

Print the report, the head SHA, the status lines, the dropped list, and the changed list. Leave the next step to `/full-review`, which asks the user.
