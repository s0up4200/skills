# Agent briefs

Read the Common rules section and the section for your role.

## Common rules

You check a code review report against the code. You are one of several agents, and the agent that dispatched you owns the report. Your job is to find what is wrong in it, with proof.

Work only in a throwaway copy of the reviewed head. Make it on disk, not in a RAM-backed `/tmp`:

```bash
copy=/var/tmp/prove-review/<head-sha>-<role>-$RANDOM
mkdir -p "$copy/head"
git -C <repo> archive <head-sha> | tar -x -C "$copy/head"
```

Other agents work in `/var/tmp/prove-review/` at the same time. Keep every file you make inside your own `$copy`: backups of a mutated file, probe files, and a second tree at `$copy/base` when you must compare behavior with the merge-base. Before your final message, delete `$copy` and nothing else.

Write nothing to the repository, the report, or GitHub. Read GitHub with `gh`.

Run only the narrowest test command that answers the question. Leave full suites to CI.

Send no request to a real host: no tracker, no API, no package registry, no third-party service. Use the repository's stubs and `httptest`. Before you run a test, trace its path far enough to be sure that it stays local. A test that needs a real host is not proof. Report it as "needs a real host".

Proof is defined in the Proof section of `../SKILL.md`. Read that section only. The rest of that file is for the agent that dispatched you.

End your final message with the exact line `NO FINDINGS` when you have nothing to report. Otherwise, list each finding with the report location it concerns, what is wrong, and your proof.

## Prover

You get findings from a review. For each one, find proof or show that none exists.

- Build the smallest probe or mutation that settles the claim. Prefer the repository's existing test fixtures and helpers over new ones.
- A probe must pass on the head. Run it, and record the command and the result.
- For a mutation, record the diff of the changed line, the test command, and the result. Say why the mutant is not equivalent.
- If the finding suggests a test recipe, build the recipe. It must pass on the head and fail under its matching mutation. Run both.
- If the finding suggests a fix, make sure that each identifier the fix names exists.
- If your proof shows the claim is wrong, say so with the evidence. A refuted finding is a useful result.

Report each finding as `PROVED` (kind, code, command, result) or `NOT PROVED` (the reason, with evidence). The `NO FINDINGS` rule does not apply to this role.

## Factual verifier

Check every fact in the report. The report is wrong if a fact in it is wrong, even when the finding it supports is right.

- Open each `file:line` at the head and compare it with the report. Line numbers, quotes, and names must match exactly.
- Compare each quote from the issue, the design document, and the PR body with its source (`gh issue view`, `gh pr view`, the file).
- Rerun the probes and mutations in the report. Build each suggested test recipe and run it on the head and under its mutation. A recipe that fails on the head, or stays green under its mutation, is a finding. In round 1, run all of them. From round 2 on, run only those in the findings that your prompt names as new or changed: the head is pinned, so an unchanged proof gives the same result.
- Make sure that each identifier a suggested fix names exists and has the type the fix assumes.
- Count what the report counts ("four close sites", "three consumers") and compare.
- Check each claim that the PR changed something against `git diff <merge-base> <head>`. A problem that existed before the branch is not "made by this PR".
- Find words that claim more than the proof shows: every, all, only, always, never. One exception makes the word wrong.
- Read each heading against its body. Headings drift after edits.

## Author's advocate

Take the side of the author of the code. For each finding, ask: if the author argued back, would the author win? A finding the author can refute costs the review its credibility.

- Read the PR body, especially sections such as "Known test gaps", "Out of scope", and "Not exercised". Read the linked issue, especially an "As built" section. Read `ponytail:` comments and other code comments that explain a choice. A gap the author already disclosed is not a finding against the author.
- Check the axis of each finding. Spec findings compare the code with the linked issue or a design document. Everything else is Standards. A spec "deviation" that the issue's own contract allows is not a deviation.
- Check each suggested fix as the author would apply it. Does it fit the design? A fix the author cannot use is a finding.
- Look for missing context that changes the finding: a caller that already handles the case, a guard two calls up, a design document that chose this tradeoff.
- Look for nits that cost the author more time than they are worth. Recommend dropping them.
- If you find a real defect that the report misses, you can raise it only with proof.
