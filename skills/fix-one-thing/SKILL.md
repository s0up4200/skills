---
name: fix-one-thing
description: Find one violation of the repo's coding standards, fix it, and open a small pull request for it. Run it by hand or on a schedule.
disable-model-invocation: true
argument-hint: "[rule, area, or path to focus on]"
---

# Fix one thing

Pay down the repo's debt one small step at a time. Each run finds one **violation** (code that breaks a written rule of the repo), fixes it, and opens one pull request. The run is a success when a reviewer can read the diff in two minutes and merge it with no worry. Keep the **blast radius** small: the diff touches as little code as possible, keeps the behavior that users see, and is easy to revert.

## 1. Read the standards

The rules are the repo's own. Read them in this order, and use each one that exists:

1. `CODING_STANDARDS.md` at the repo root, and each file that it points to.
2. The standards files that the `AGENTS.md` or `CLAUDE.md` of the repo point to.
3. The code rules in `AGENTS.md` or `CLAUDE.md` themselves, for example a `## Code Review Rules` section.

If the repo has no written code rules, stop. Tell the user that the skill needs a standards file, and that `/retro` or `/review-retro` can start one. A rule that you make up has no reviewer who agreed to it.

If the user gave an argument, use only the rules or the paths that it names.

Done when you have the list of rules, each with the file that holds it.

## 2. Skip the work that is already open

List the open pull requests (`gh pr list --state open --json number,title,headRefName,files`). Leave out each rule and each file that an open pull request already fixes or changes. Two pull requests on one file conflict, and the second one waits on the first.

Read the titles of the last 20 merged pull requests from this skill (`gh pr list --state merged --search '"Found by fix-one-thing" in:body' --limit 20`). Prefer a rule that no recent run fixed, so that the runs spread over the standards and not over one easy rule.

## 3. Pick one violation

Search the code for violations of the rules. For a rule with a fixed pattern, use a grep. For a rule that needs judgment, read the code that the rule names.

Pick one violation whose fix meets each of these conditions:

- The fix keeps the behavior that a user, an API client, or a stored file sees. A change to a public API, a database migration, a serialized format, or a configuration key is out of scope.
- The diff is under about 100 changed lines, in one package or one module.
- A reviewer who knows the rule sees at once that the fix is right.

If one rule has the same violation in a few places in one file, fix all of them in that file. This counts as one violation. Keep the fix in that one file.

If a violation shows that the rule itself is wrong or unclear, do not fix the code. Report the rule and the conflict to the user. A clearer rule fixes more code than one pull request does.

Done when you can name the rule (quoted from its file), the place in the code, and the reason why the fix is safe.

## 4. Fix it

Follow the repo's agent instructions for the branch. If they say nothing, make a branch from the default branch: `git switch -c refactor/<slug> origin/HEAD`.

Make the fix. Then run the test gate that the agent instructions define, or the tests of the package that you changed. If the tests fail because of your change and a second attempt also fails, throw the change away (`git switch -` and delete the branch), and go back to step 3 with another violation. After two failed violations, stop and report what failed.

## 5. Open the pull request

Use the `pr` skill for the title and the body if it is installed. Else write a short body. In each case, the body:

- Quotes the rule and names the file that holds it.
- Says in one sentence what the code did before and what it does now.
- Says why the change is safe: the tests that ran, and the reason why the behavior stays the same.
- Ends with the line `Found by fix-one-thing.`, so that step 2 of a later run finds it.

If a person runs the skill, show the diff and the pull request text, and wait for approval before the push. On a schedule, no person is there to approve. Push, and open the pull request as a draft (`gh pr create --draft`), so that it waits for a review.

## 6. Report

Give the user three lines: the rule, the pull request link, and the tests that ran. If the run stopped early, give the reason and the next step instead.
