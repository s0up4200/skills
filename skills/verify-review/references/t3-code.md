# The wait in T3 Code

T3 Code wakes the thread on pull request events, so step 8 needs no Monitor and no loop. This file replaces the watch command of step 8. The held run and the meaning of each line stay as step 8 gives them.

1. After the push, call `watch_pull_request` on the pull request, one time, and end the turn. The watch stays on after each wake.
2. On each wake, ask the script for the status of the pushed head, with a tool timeout of 5 minutes:

   ```bash
   git fetch -q && scripts/wait-review.sh owner/repo "$pr" "$(git rev-parse '@{u}')" status
   ```

   `@{u}` is the head that the bots review. A held fix moves `HEAD` away from it, and the script prints nothing for a commit that is not the head of the pull request. The fetch brings a head that another person pushed. When `@{u}` is a commit that you did not push, report it and stop, as for `conflict`.

   The script prints the new event lines, then one status line: `done <sha>`, `ready <sha>`, or `pending <sha> <bots>`. Before `done` or `ready` it polls a second time and gives a bot with no review check its 2 minutes, as the loop does.
3. Act on the event lines and on `done` and `ready` as step 8 says. On `pending`, do a held run for the new events and end the turn. The next event wakes the thread.
4. Before the report, and before you stop for any other reason, call `unwatch_pull_request`. A watched thread shows as working and stays out of the user's inbox.

A delegated child leaves the watch to the parent thread, which owns the pull request.

Proven 2026-11-10 on autobrr/qui#3993: each wake, the `ready` line, and the `done` line. Codex finished with no finding, and the edit of its summary comment woke the thread.

T3 Code sends no timeout wake. A bot whose review check stalls sends no event, so the thread waits, with any held fix, until the user asks. Then run the status command again and act as on `timeout`.
