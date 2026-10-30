---
name: post-review
description: Post the last review report (/code-review or /pr-review-toolkit:review-pr) on a GitHub pull request as a review, after the unslop pass and user approval. Run it only when the user names it, as /post-review [pr-number] [--dry-run]; a chained request counts.
---

# Post review

Turn the review report that is already in this conversation into one GitHub review on the pull request. The report was written for the reviewer. The PR author needs the same findings in plain English, with the evidence, and nothing about how the review was produced.

Arguments: `/post-review [pr-number] [--dry-run]`. With no number, `gh` uses the PR of the current branch. `--dry-run` writes the final body to a file and stops before the approval gate. Use it for tests.

The span script sits next to this file: `<skill base directory>/scripts/code-spans.sh`. The base directory is printed when the skill loads.

## Before you start

Find the review report in this conversation. Two kinds count:

- A `/code-review` report, with a `## Standards` section and a `## Spec` section.
- A `/pr-review-toolkit:review-pr` report, with findings grouped by severity. Put each finding under `## Spec` when it compares the code with the linked issue or a design document, and under `## Standards` otherwise.

If there is a `/code-review` report and a `review-pr` report, merge them and remove duplicates. If you cannot tell which report to use, stop and ask the user. If there is no report, stop and tell the user to run a review first. Do not run the review yourself.

If both sections report no findings, stop. A review with nothing to change is noise. Tell the user the review was clean.

## Step 1: Reshape the report

Write the body to `post-review-body.md` in the scratchpad. Use this template:

```markdown
> [!NOTE]
> 🤖 **<model> responding on behalf of <login>**

## Standards

...

## Spec

...

<one-line summary: findings per axis, worst issue per axis>
```

Keep the two axes separate. The report keeps them apart on purpose, so a standards pass cannot hide a spec failure.

While you copy the findings:

- Keep every `file:line` reference, code span, fenced block, and quoted spec line. The author navigates by them.
- Give each finding a `path:line` at the head commit of the PR. The chat report can leave them out, because the reply rules for the user drop file names and line numbers. If a finding has none, find the line in the code at the PR head and add it as a code span. Step 4 then makes sure that the prose pass keeps it.
- If a probe test or command produced the decisive evidence, include it in a fenced block. Authors act on a repro, not on a claim.
- Write in first person. The findings are the user's own. Remove every trace of how they were produced: no "sub-agent", "parent reviewer", "known fact", no names of other review tools. "I verified this with the test below" is the whole story.
- Apply the repository's rules for public text. Read its `CLAUDE.md` or `AGENTS.md` before you write. Common rules: no private tracker links, no release names copied from a client.
- Keep the note at the top. It tells the author that an agent wrote the review. Use the model name that the harness states, else the harness name, and the login from `gh api user --jq .login`. Repository attribution rules target commit trailers, not this note.
- Recount the findings when you write the summary line. The report's own counts can drift from its bullets.

## Step 2: Record the code spans

```bash
<skill base directory>/scripts/code-spans.sh post-review-body.md > spans-before.txt
```

## Step 3: Prose pass

Apply the `unslop` skill to the body, editing `post-review-body.md` in place. Prose only: the note, the two headings, and the summary line stay. Keep the first person on evidence you produced, and keep each finding's severity words ("overstates", "masks", "narrow") as they are. A pass that changes a claim has gone past style.

## Step 4: Check the code spans

```bash
<skill base directory>/scripts/code-spans.sh post-review-body.md > spans-after.txt
diff spans-before.txt spans-after.txt
```

Any span in `before` that is missing from `after` was mangled by the prose pass. Restore it by hand from the original report. A rewritten `file:line` or error string sends the author to the wrong place.

## Step 5: Approval gate

Print the full final body to the user. Then stop and wait. With `--dry-run`, report the file path and end here.

Post only after the user answers yes in their own words. A review lands under the user's GitHub account and cannot be unsent.

## Step 6: Post

Read the permission of the PR author on the repository:

```bash
author=$(gh pr view [N] --json author --jq .author.login)
gh api "repos/{owner}/{repo}/collaborators/$author/permission" --jq .permission
```

If the permission is `write`, `maintain`, or `admin`, the author is a maintainer. Post a comment review, and leave out any thanks or greeting:

```bash
gh pr review [N] --comment --body-file post-review-body.md
```

For every other author, request changes. The review exists because the report found something:

```bash
gh pr review [N] --request-changes --body-file post-review-body.md
```

Report the review URL.
