# T3 Code

Read this file when the session has the `t3_thread_launch` tool. It covers two things: how to mark a row that already has a thread, and how to start a thread for a row.

Read on 2026-11-12 from the tool schemas of T3 Code and its docs: https://github.com/pingdotgg/t3code/tree/main/docs/user

## Rows that already have a thread

Do this before you print the table. Two threads on one issue give two pull requests for the same fix.

1. Call `t3_project_list` once. A project belongs to a repo when its `repositoryIdentity` has the same `owner` and `name`.
2. For each row whose repo has a project, call `t3_thread_search` with that `projectId` and the URL of the item as `query`. The search stays inside one project, and with no `projectId` it reads only the project of this thread. It matches a thread that is linked to the pull request, and a thread whose messages name the URL.
3. On a match, put the `link` of the thread in the `Next` cell after the step, exactly as the tool returns it. The step stays, because an old thread can be about an earlier step, for example a finished review of a pull request that now waits for a merge. `start` skips that row and names its thread. The user does the step in that thread.

When a row names Fable, print one line under the table: "`start` runs a Fable row on Opus. Write `start N fable` for Fable." Step 1 below gives the reason.

## Start

The user answers `start 1 3`. Start only the rows that the answer names. The answer is the user's request to run the `Next` step of each named row, also for a step that only the user may start.

A row with an empty `Model` cell has no session. Say so, and start the others.

Start at most one `/field-test` row for each repo in one answer, and name the rows that wait. Two live runs on one host replace the build of each other.

### 1. Pick the model

Call `orchestrator_capabilities` once. Take a Claude provider instance: the one of this thread (`inheritedProviderInstanceId`) when its `driverKind` is `claudeAgent`, or else the first `claudeAgent` instance with `canRunChildTask: true`. Take the id of the row's model from that instance, and the row's effort as the `effort` option.

A row that names Fable starts on Opus at the same effort, unless the answer names Fable for that row (`start 3 fable`). Fable costs twice as much as Opus, and one answer can start many rows.

With no Claude instance, print the commands of step 6 in `SKILL.md` for the row.

### 2. Find the project

Take the project of the repo from `t3_project_list`. When the repo has none, look for its clone beside a project of the same owner: the parent folder of that project's `workspaceRoot`, plus the repo name. The clone is the right one when this prints the repo:

```bash
git -C <path> remote get-url origin
```

Then add it with `t3_project_create`, with the repo name as `title` and the path as `workspaceRoot`. With no clone there, print the commands of step 6 in `SKILL.md` for the row, and say that the repo has no T3 project.

### 3. Launch the thread

Call `t3_thread_launch` once for each row:

- `title`: the step and the item, for example `review acme/app#4012` or `implement acme/cli#12`.
- `projectId`: from step 2.
- `modelSelection`: `{"instanceId": "<instance>", "model": "<model id>", "options": [{"id": "effort", "value": "medium"}]}`.
- `workspaceStrategy`: `{"type": "worktree", "baseRef": "origin/<default branch>", "startFromOrigin": true}`. Each row gets its own worktree, so two threads never share a checkout. The default branch is on the first line of the `open-work.sh` output. A step that pushes to a pull request, such as `/verify-review`, is the exception when a worktree already holds the branch of that pull request, because git gives one branch to one worktree. Read the branch with `gh pr view N --repo OWNER/REPO --json headRefName,isCrossRepository`. When `isCrossRepository` is false, look for the branch in `git -C <workspaceRoot> worktree list --porcelain`. When a worktree has it and `git -C <path> status --porcelain` prints nothing, pass `{"type": "existing_worktree", "worktreePath": "<path>"}`. When the status prints a line, do not start the row: name the worktree, and say that it holds work that is not committed. A thread there mixes its changes with that work. A pull request from a fork always gets a new worktree, because its branch name can be the name of a local branch with other work, for example `main`.
- `message`: the `Next` skill and the URL of the item, for example `/implement https://github.com/acme/cli/issues/12`. The URL must be in the message, because the search above finds the thread by it. For a pull request in a new worktree, add: `Check out the pull request in this worktree first.` For `/code-review`, add to that: `Use gh pr checkout N --detach.` A review pushes nothing, and a detached HEAD also works when another worktree holds the branch. For an issue that asks the user a question, add: `Then draft one reply with the answers, and wait for my approval before you post it.`
- `clientRequestId`: one new id for each row. After an error or a lost reply, retry with the same id, so that the row gets one thread.

Leave out `runtimeMode` and `interactionMode`. The thread takes the modes of this thread.

### 4. Report

Print one line for each started row: its number, and the `link` of its thread exactly as the tool returns it. Do not wait for the threads. Each one reports in its own thread.
