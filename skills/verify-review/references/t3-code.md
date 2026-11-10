# The wait in T3 Code

T3 Code wakes the thread on pull request events, so step 8 needs no Monitor and no loop. This file replaces the watch command of step 8. The held run and the meaning of each line stay as step 8 gives them.

1. After the push, call `watch_pull_request` on the pull request, one time, and end the turn. The watch stays on after each wake.
2. On each wake, run one poll:

   ```bash
   scripts/wait-review.sh owner/repo "$pr" "$(git rev-parse HEAD)" once
   ```

   It prints the new event lines, then one status line: `done <sha>`, `ready <sha>`, or `pending <sha> <bots>`.
3. Act on the event lines and on `done` and `ready` as step 8 says. On `pending`, do a held run for the new events and end the turn.
4. A bot with no review check, such as Codex or Copilot, can finish with no review and no wake. When the wake says that the required checks passed and `pending` names only such bots, act as on `done`.
5. Before the report, and before you stop for any other reason, call `unwatch_pull_request`. A watched thread shows as working and stays out of the user's inbox.

A delegated child leaves the watch to the parent thread, which owns the pull request.

Proven 2026-11-10: the `done` line, on two pull requests. The `pending` line and the wake in step 4 are not yet proven on a live review.
