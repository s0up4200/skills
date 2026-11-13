# T3 Code

Read this file when the session has the `t3_thread_launch` tool. It covers two things: how to mark a row that already has a thread, and how to start a thread for a row, on this machine or on another one.

Read on 2026-11-13 from the tool schemas of T3 Code and its docs: https://github.com/pingdotgg/t3code/tree/main/docs/user

## Rows that already have a thread

Do this before you print the table. Two threads on one issue give two pull requests for the same fix.

1. Call `t3_project_list` once. A project belongs to a repo when its `repositoryIdentity` has the same `owner` and `name`.
2. For each row whose repo has a project, call `t3_thread_search` with that `projectId` and the URL of the item as `query`. The search stays inside one project, and with no `projectId` it reads only the project of this thread. It matches a thread that is linked to the pull request, and a thread whose messages name the URL.
3. On a match, put the `link` of the thread in the `Next` cell after the step, exactly as the tool returns it. The step stays, because an old thread can be about an earlier step, for example a finished review of a pull request that now waits for a merge. `start` skips that row and names its thread. The user does the step in that thread.

When a row names Fable, print one line under the table: "`start` runs a Fable row on Opus. Write `start N fable` for Fable." Step 1 below gives the reason.

## Start

The user answers `start 1 3`, or asks to dispatch rows. Start only the rows that the answer names. The answer is the user's request to run the `Next` step of each named row, also for a step that only the user may start.

A row with an empty `Model` cell has no session. Say so, and start the others.

Start at most one `/field-test` row for each repo in one answer, and name the rows that wait. Two live runs on one host replace the build of each other.

### 1. Pick the model

Call `orchestrator_capabilities` once. Take a Claude provider instance: the one of this thread (`inheritedProviderInstanceId`) when its `driverKind` is `claudeAgent`, or else the first `claudeAgent` instance with `canRunChildTask: true`. On another machine, the instance ids differ: take the `claudeAgent` instance whose `displayName` is the one of this thread's instance, because each instance is a separate Claude account. Take the id of the row's model from that instance, and the row's effort as the `effort` option.

A row that names Fable starts on Opus at the same effort, unless the answer names Fable for that row (`start 3 fable`). Fable costs twice as much as Opus, and one answer can start many rows.

With no Claude instance, print the commands of step 6 in `SKILL.md` for the row.

### Another machine

The answer names a machine: `start 7 8 on the macbook`. Take its `environmentId` from `t3_environment_links`, and pass it to each T3 tool in these steps and in the thread search above.

A link goes one way, and the machine that starts the threads holds it. `t3_environment_links` lists only the links that this machine holds. A machine that the app window shows under Environments, but that this list leaves out, gets no threads from here.

With no link, read `runtimeMode` from `orchestrator_capabilities`. `t3_environment_link` works only from a thread in `full-access` and `default` mode, and fails with `capability_denied` in each other mode. Then give the user these steps:

1. In Settings, pick this machine in the environment picker at the top, then choose Environments → Linked environments → Link.
2. When the stored address of the other machine is a plain-http IP address, the link fails. T3 accepts plain http only for loopback and Tailscale MagicDNS names, not for a `100.x` Tailscale IP. Type `http://<MagicDNS name>:<port>` instead, with the `DNSName` of the machine from `tailscale status --json`, and paste a pairing code from the other machine's Settings → Sharing & access.

When a link still fails, read the link state on each machine: the `peer_environment_links` table in `~/.t3/userdata/statev2.sqlite`, and the `peerLinks.link` spans in `~/.t3/userdata/logs/server.trace.ndjson`.

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
- `modelSelection`: `{"instanceId": "<instance>", "model": "<model id>", "options": [{"id": "effort", "value": "high"}]}`.
- `workspaceStrategy`: `{"type": "worktree", "baseRef": "origin/<default branch>", "startFromOrigin": true}`. Each row gets its own worktree, so two threads never share a checkout. The default branch is on the first line of the `open-work.sh` output. A step that pushes to a pull request, such as `/verify-review`, needs the branch of that pull request, and git gives one branch to one worktree. For such a row, read `gh pr view N --repo OWNER/REPO --json headRefName,headRefOid,isCrossRepository`:
  - `isCrossRepository` is true, so the pull request comes from a fork: do not start the row. Print its commands, and say why. The branch name of a fork can be the name of a local branch with other work, for example `main`.
  - No worktree in `git -C <workspaceRoot> worktree list --porcelain` holds the branch: use the new worktree.
  - A worktree holds the branch: pass `{"type": "existing_worktree", "worktreePath": "<path>"}` when `git -C <path> status --porcelain` prints nothing and `git -C <path> rev-parse HEAD` prints the `headRefOid`. Otherwise do not start the row. Name the worktree, and say that it holds work that is not on the pull request. A thread there mixes its changes with that work, or pushes it.
- `message`: the `Next` skill and the URL of the item, for example `/implement https://github.com/acme/cli/issues/12`. The URL must be in the message, because the search above finds the thread by it. For a pull request in a new worktree, add: `Check out the pull request in this worktree first.` For a step that pushes nothing, such as `/code-review` or `/field-test`, add to that: `Use gh pr checkout <URL> --detach.` with the URL of the pull request, so that `gh` reads the right repo. A detached HEAD needs no local branch. Thus it works when another worktree holds the branch, and it leaves each local branch as it is, also for a pull request from a fork. For an issue that asks the user a question, add: `Then draft one reply with the answers, and wait for my approval before you post it.`
- `clientRequestId`: one new id for each row. After an error or a lost reply, retry with the same id, so that the row gets one thread.

Leave out `runtimeMode` and `interactionMode`. The thread takes the modes of this thread.

### Rows that work together

The answer asks the rows to coordinate, or two rows change the same code, for example two issues of one epic. A thread that starts first cannot learn the ID of a thread that starts after it. A `t3_thread_send` to a thread that is still `preparing` fails, or waits in the queue until the whole run of that thread ends. Thus each thread finds the others and introduces itself. Add to the message of each such row:

```
Other threads work on <URLs of the other rows> at the same time. Find each one with
t3_thread_search, with its URL as query and projectId <projectId>. When the search finds
nothing, search again before your next shared change. Your own ID is currentThreadId in
that result: put it in your first t3_thread_send to them, so that they can answer. Before
you change a file, a migration number, or an API that the other rows also change, tell
them what you plan, and agree on who goes first.
```

Send nothing to a started thread yourself.

### 4. Report

Print the table of step 5 in `SKILL.md` again, with the same rows in the same order, so that the user sees in one place what runs and where. In the `Next` cell of each started row, put `started` and the `link` of its new thread after the step, exactly as the tool returns it. Each row that had a thread before keeps its link. In place of the `Next:` line above the table, write one line that names the started rows.

Under the table, list each named row that did not start, and why: no session, a fork, a worktree with other work, or a second `/field-test` on one repo.

Do not wait for the threads. Each one reports in its own thread.
