---
name: challenge-request
description: Challenge a feature request from Discord or GitHub, and give a verdict of yes, not now, already possible, no, or need more info.
disable-model-invocation: true
---

# Challenge request

A maintainer gets more feature requests than they can build. Each "yes" is a feature they support forever: more config, more tests, more support questions. This skill gives the maintainer the case for and against a request, and a verdict. "No is temporary": a request that loses today can win later, when the demand or the cost changes.

The output is for the maintainer. Write no reply to the requester.

## 1. Find the problem

Requesters usually ask for a solution. Find the problem under it: what the requester tries to do, and what stops them today. Ask "why" until the answer is a goal, not a feature.

Done when you can state the problem in one sentence that names no solution. If the request does not give enough to do this, the verdict is **need more info**. Go to step 4.

## 2. Check what already exists

Do this legwork yourself. Cite the file, doc page, or link for each result.

- **The code and docs.** Read the repository in the working directory. Look for a setting, a filter, an automation, an API endpoint, or a workaround that solves the problem now. If no repository is open and the request names the project, ask the user for the path.
- **Duplicates.** Search open and closed issues and discussions: `gh search issues --repo <owner/repo> "<key terms>"` for issues, and `gh api graphql` with `search(type: DISCUSSION, query: "repo:<owner/repo> <key terms>")` for discussions. Count the 👍 reactions and the comments that ask for the same thing. A duplicate is demand, not noise.
- **Past decisions.** A closed issue with a "won't fix" reason, or an ADR, already answers the request. Quote it.

Done when each of the three checks has a result with a source, or a statement that you searched and found nothing.

## 3. Weigh it

Steelman the request first: write the strongest case for it in two or three sentences. Then test it against each question below. Answer each with evidence from step 2, not with a guess.

- **Demand.** How many people need it? One DM is one data point. Five people in a public channel, or an issue with many 👍, is a signal.
- **Maintenance cost.** What does it add for every future release: options, code paths, test cases, support questions, docs? Price the cost to keep it, not the cost to build it.
- **Fit.** Does it serve what the project is for? A request for a different tool inside this one fails here.
- **Other paths.** Can the requester get the result with a script, a webhook, an external tool, or their own PR?
- **Reversibility.** Can the maintainer ship a small version behind a flag and remove it if nobody uses it?

## 4. Give the verdict

Pick one:

- **Yes.** The problem is real, the demand is there, and the cost is fair. Give the smallest version that solves the problem.
- **Not now.** Good idea, low demand or high cost today. Say what would change the verdict (for example, "five more people ask" or "after the v2 config rewrite"). Tell the maintainer to point the requester at a GitHub issue, so demand collects in public and the idea stays alive.
- **Already possible.** Name the feature or workaround, with its source.
- **No.** Give the reason in one sentence. Name the other path from step 3 if one exists.
- **Need more info.** List the questions that would decide the verdict.

Use this format:

```
**Verdict:** <verdict>

**Problem:** <one sentence, no solution named>
**Steelman:** <the best case for the request>
**Evidence:** <what step 2 found, with links>
**Against:** <the questions from step 3 that the request fails, one line each>
**Changes the verdict:** <what would flip it>
**Questions for the requester:** <only for "need more info" or "not now">
```

Leave out a line that has nothing to say.
