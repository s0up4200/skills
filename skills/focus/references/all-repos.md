# All repos

Read this file when the scope is all the repos of the user's recent work (`/focus all`, `/focus all 14`). It replaces step 2 of `SKILL.md` and adds rules to step 5. Steps 3, 4, 6, and 7 apply as written.

The script reads only GitHub. A Forgejo repo gets its report from `/focus` inside its clone.

## 1. Read the repos

One script call finds the repos and reads the open work of each one:

```bash
<skill base directory>/scripts/all-work.sh [DAYS]
```

`DAYS` is the number that the user gave, or 30. A repo is in scope when an open issue or PR that involves the user changed in that time, and the user can push to the repo. The script prints one line per repo, most stars first:

```
acme/app | stars 4789 | open issues 134 | open PRs 12 | 148 lines | /tmp/focus.Ab12Cd/acme_app.txt
```

The file holds the output of `open-work.sh` for that repo. A `failed` line names the file with the error: report that repo as not read, and go on with the others.

The last lines name the repos that the skip file removed, and the repos that the user can only read. A read-only repo is not the user's to triage or merge, so it stays out.

### The skip file

`${XDG_CONFIG_HOME:-~/.config}/focus/skip` holds one `OWNER/REPO` on each line. The script leaves those repos out. When the user answers `skip OWNER/REPO` after a report, add that line to the file, and make the folder first with `mkdir -p`.

## 2. Rank each repo

Read the notifications of all repos once, with the command in step 2 of `SKILL.md`.

- **A file of 50 lines or fewer**: read it and rank its items yourself, with the fields of step 2 and the rules of steps 3 and 4.
- **A file of more than 50 lines**: start one subagent for the repo, with a fresh context window. The lines of one large repo are up to 10,000 tokens, and several such repos would leave no room for the judgement. Start these subagents in parallel. Give each one only this brief:

  ```
  Read <skill base directory>/SKILL.md. The open work of OWNER/REPO is in FILE: read it in place
  of the script call in step 2. Then do the rest of step 2, and steps 3 and 4, for that repo.
  Skip the hot spots. Change nothing on GitHub. Return only:
  1. The best five items, best first. For each: its rank, its URL, the facts that put it in
     that rank, a summary as step 5 defines it, the next step, and the model and effort from
     references/model-choice.md.
  2. The issues to close, the epics with their progress, and the release line.
  3. For each rank, the count of the items that you did not return.
  ```

  Add to the brief the notification lines of that repo.

The step is done when each repo of the script output has a ranked list or a `failed` note.

## 3. Build the table

Put the items of all repos in one table, with the `Repo` column:

1. Order by rank. A teammate who waits in a small repo comes before a triage in a large one.
2. Inside one rank, put the repo with more stars first, then the older item. Stars show how many people feel a bug.
3. A repo with 100 stars or more gets at most four rows. Each other repo gets at most two. The table stops at 12 rows.

Then name what the table left out, so that no repo drops out of sight:

```
More:
- acme/app: 9 more (3 to review, 6 to triage). Run `/focus acme/app`.

Other repos:
- acme/cli: [#12](url) Add a dedupe flag, `/implement` · 3 issues open
- acme/docs: [PR #8](url) by dependabot, checks failing · 1 PR open
- Nothing to do: acme/site, acme/theme
- Skipped: acme/findings
```

- `More` has one line for each repo whose rows hit the limit.
- `Other repos` has one line for each repo with no row: its best item and its open counts. The repos with no ranked item share the `Nothing to do` line.

The report is done when each repo of the script output is in the table, in `Other repos`, or in a `failed` note.

In the `Also` list of step 5, put the repo name before each item, and keep only the `Close` and `Release` lines.
