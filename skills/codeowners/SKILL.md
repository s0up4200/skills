---
name: codeowners
description: Create or update the CODEOWNERS file of a GitHub repository from the commit history and the maintainer's decisions. Writes the file to the working tree and stops before the commit. Explicit invocation only.
disable-model-invocation: true
---

# CODEOWNERS

This skill writes a CODEOWNERS file that sends review requests to the people who really work on each area of the code. The commit history gives the evidence. The maintainer makes the decisions, and a decision overrides the data. The skill writes the file in the working tree only. It makes no branch, commit, push, or PR. The user does those steps with their own flow.

## GitHub facts that shape the file

- **Last match wins.** GitHub uses the last line that matches a file. A specific line without the maintainer removes the maintainer's review request for those files. Put the maintainer on every line, and put a specific pattern after the general pattern it narrows (`/internal/models/credential_*` after `/internal/models/`).
- **Base branch.** GitHub reads CODEOWNERS from the base branch of the PR. A file on `develop` does nothing for PRs to `main`.
- **Write access.** GitHub requests only owners with write access. Access through a team counts. The "Contributor" badge in the PR list does not show team access, so read the access from the API.
- **No conditions.** A line cannot depend on the PR author.

## 1. Check the forge and ask the inputs

Read the `origin` remote. If the host is not `github.com`, stop and say so in one line, with the name of the forge. Forgejo and GitLab apply other CODEOWNERS rules, so a GitHub file would mislead.

Get the defaults:

```bash
gh api user --jq .login
gh repo view --json nameWithOwner,defaultBranchRef --jq '.nameWithOwner + " " + .defaultBranchRef.name'
```

Ask one AskUserQuestion with these four questions. Make the default the first option of each:

- **Maintainer**: the login on `*` and on every line. Default: the `gh api user` login. An organization repo can have a different lead.
- **Base branch**: default is the GitHub default branch, which is not always `main`.
- **Window**: default is 12 months.
- **Co-owner bar**: default is 5 or more commits in the window, or a large share of the changed lines, plus a commit in the last 6 months.

Then run `git fetch origin <base>`, and use `origin/<base>` in every command below.

## 2. Read the current file

Look for CODEOWNERS in `.github/`, the root, and `docs/` on `origin/<base>`. GitHub uses the first file it finds in that order. If a file exists, this run is an **update**. Read every line and every comment. A comment of the form `# <reason> (decided YYYY-MM)` records an earlier decision by the maintainer. Keep that line unless the maintainer changes it in step 6.

## 3. Count people across the whole repo

Do this in the main session. Per-area numbers undercount people who work in many areas, so the totals come from one command across the repo:

```bash
git log origin/<base> --no-merges --since=<window> --format='%H %aN <%aE>'
git log origin/<base> --no-merges --since=<window> --format='%(trailers:key=Co-authored-by,valueonly)' | grep .
```

Leave out bots (`[bot]`, dependabot, renovate, github-actions).

**Group by login**, not by name or email. One person can commit under two emails. A commit can also carry one person's email with another person's name. Get the login of each email from one of its commits:

```bash
gh api repos/<owner>/<repo>/commits/<sha> --jq .author.login
```

A `<id>+<login>@users.noreply.github.com` email gives the login directly. Count the `Co-authored-by` trailers for the co-author, because a squash merge hides them as authors.

The step is done when every non-bot email in the window maps to a login or is listed as unresolved, and each login has one total.

## 4. Scan each area

Find the areas: the top-level directories in `git ls-tree -d --name-only origin/<base>`. Split a large directory such as `internal/` or `web/src/` into its children. For each area, get the commits per login, the changed lines per login, the last commit date per login, and the hot spots, which are the paths with the most churn:

```bash
git log origin/<base> --no-merges --since=<window> --format='%aE %as' -- <paths>
git log origin/<base> --no-merges --since=<window> --numstat --format='@%aE' -- <paths> \
  | awk '/^@/{a=substr($0,2);next} NF==3{split($3,p,"/"); c[p[1]"/"p[2]" "a]+=$1+$2} END{for(k in c)print c[k],k}' \
  | sort -rn | head -20
```

Do this in the main session when the repo has 8 areas or fewer and 1500 commits or fewer in the window. Above either limit, dispatch one Explore agent per area, all in parallel. Give each agent the repo path, `origin/<base>`, the window, its paths, and the email-to-login map from step 3. Tell it not to fetch, check out, or change the repo. Each agent returns one table with the columns path, login, commits, lines, and last date.

**Count again.** For each person who passes the bar, or nearly passes it, run the count again in the main session, for that path and every email of that login:

```bash
git log origin/<base> --no-merges --since=<window> --author='<email>' --oneline -- <path> | wc -l
git log origin/<base> --no-merges --since=6.months --author='<email>' --oneline -- <path> | wc -l
```

Use your own numbers in the draft. In the reference run, the agent totals undercounted one person by half and inflated another from 3 to 7.

**Borderline people.** Commits alone undervalue a reviewer. For a person close to the bar, and for a collaborator with no commits, count their reviews and merged PRs:

```bash
gh api -X GET search/issues -f q='repo:<owner>/<repo> is:pr reviewed-by:<login>' --jq .total_count
gh api -X GET search/issues -f q='repo:<owner>/<repo> is:pr is:merged author:<login>' --jq .total_count
```

The search API allows 30 requests a minute, so query only these people.

## 5. Draft

Write the draft in your context. Do not write the file yet.

- The first line is `* @<maintainer>`.
- Root each pattern with `/`. Each specific line lists the maintainer and the co-owners who pass the bar.
- Each line that holds a decision gets a comment above it: `# <reason> (decided YYYY-MM)`.

## 6. Interview the maintainer

Ask in numbered rounds, in the style of the `grilling` skill. Each item is one person or one area. It shows the evidence (commits in the window, commits in the last 6 months, line share, last date, and reviews when you counted them) and gives your recommended answer. In an update, start with the change table: one row per line of the draft and of the current file, with the action (add, change, remove, or keep), the evidence, and the decision comment that the line keeps.

Ask about every candidate co-owner, every area that has a co-owner now or would get one, and every unresolved email. The maintainer's choice wins over the data. Examples of choices from the reference run: a person owns only the package they wrote, docs keep only the maintainer, and a busy co-owner stays on all their lines. Record each choice as a decision comment.

The step is done when every item has an answer and no answer opens a new item.

## 7. Check

Run each check and keep the result for the report:

- **Write access** for each owner. The result must be `write`, `maintain`, or `admin`:
  ```bash
  gh api repos/<owner>/<repo>/collaborators/<login>/permission --jq .permission
  ```
- **Dead paths**: each pattern matches at least one file in `git ls-files`. Test a directory with `git ls-files <dir> | head -1`, and a glob with `git ls-files ':(glob)<pattern>'`.
- **Order**: no general pattern comes after a specific pattern that it covers.
- **Branch protection**:
  ```bash
  gh api repos/<owner>/<repo>/branches/<base>/protection --jq .required_pull_request_reviews.require_code_owner_reviews
  ```
  If the result is `true`, an owner's approval blocks the merge. If it is `false`, or the branch has no protection (a 404), a review request is only a notification.

Fix each failure before step 8, or ask the maintainer when the fix changes a decision.

## 8. Write and report

Write the file to the path it already has, or to `.github/CODEOWNERS` for a new file. Show `git diff` (for a new file, `git diff --no-index /dev/null <path>`).

Report, state first:

- The file path and the number of lines added, changed, and removed.
- The protection case from step 7: required approval, or only a notification.
- Co-owners also get requests on the maintainer's own PRs. The three ways around it: remove the request by hand, use a GitHub Action that removes it (the person still gets a notification), or keep code-owner review not required.
- After the push, run this on the branch. The result must be `[]`:
  ```bash
  gh api "repos/<owner>/<repo>/codeowners/errors?ref=<branch>"
  ```
  A 404 means that the ref has no CODEOWNERS file. It does not mean that the file has no errors.
- Run the skill again about every 6 months, or when review requests go to the wrong people.
