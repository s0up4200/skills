# Counting requests to qBittorrent

Use this when the question is how many calls qui makes to qBittorrent, not how long they take. Wall time lies here: on a 6030-torrent instance, 6030 per-hash `torrents/trackers` calls at 50-wide concurrency took 1.8 to 2.8 s, and the single bulk `torrents/info` fetch that replaced them took 1.5 s. The elapsed field in the log could not tell the builds apart. The request count could: 6829 against 2.

## When it applies

- The PR claims fewer, batched, cached, or deferred qBittorrent calls. The count is the proof.
- The PR touches the sync, tracker, files, peers, or reannounce paths, or bumps go-qbittorrent. The count is the regression guard: same numbers before and after, or explain the delta.
- A user reports qBittorrent WebUI saturation. The count is the diagnosis, run against develop with no PR.

Do not decide from the diff. Most of `internal/qbittorrent` and every service touches the client, and the two largest bursts found so far were invisible in any diff: one was call ordering inside a constructor, the other was two TTLs disagreeing across packages.

## The script

`scripts/qbit-request-count.py` in this skill. It counts request lines per path to any plain-HTTP upstream; `--ports` and `--path-prefix` retarget it from qBittorrent to Sonarr, Radarr, or an indexer proxy for another project. Copy it to the host and run it inside the network namespace that carries the traffic. The host file names that container, the interface the traffic leaves on, and the qBittorrent ports. A host without tcpdump is why the script exists.

```
scp scripts/qbit-request-count.py <host>:/root/fieldtest-<N>/
ssh <host ssh options> -T <host> '
  cd /root/fieldtest-<N> &&
  PID=$(docker inspect <namespace container> --format "{{.State.Pid}}") &&
  setsid nsenter -t $PID -n python3 qbit-request-count.py --ports <ports> > counts.log 2>&1 < /dev/null &
  sleep 3; pgrep -f "^python3 qbit-request-count.py" | tee pids.txt'
```

Record the pid from `pids.txt`. `pgrep -f` without the `^` anchor also matches the zsh wrapper that launched it, and `kill` on that list fails with `illegal pid`.

Prove it is armed before the action: wait 15 s, `kill -USR1 <pid>`, and read `counts.log`. The `sync/maindata` poll must show on every active instance port. No maindata lines means the wrong namespace or the wrong interface.

## Reading the numbers

Counters are cumulative. Snapshot with `kill -USR1 <pid>` before the action and again after the window, and subtract per path. The last block in `counts.log` is the latest snapshot:

```
awk '/^---/{blk=""} {blk=blk"\n"$0} END{print blk}' counts.log
```

Windows that answer the usual questions:

- **Boot burst.** `docker restart qui`, then 95 s. Covers login, capability refresh, first maindata, first tracker health refresh, and the files cache warm.
- **Steady state.** No restart, 10 to 15 minutes, long enough to cover one scheduled rebuild of anything on a timer. This is where finding 9 of #2575 lived: 6030 `torrents/files` every 10 minutes, invisible in any boot window.
- **Paired build.** Same window on the PR image and on `develop`, same session, same library. One side alone proves nothing.

A zero on both builds is not a win. Before the swap, confirm the code path under test is enabled on the instance (reannounce settings, automations with hardlink scope, tracker health support), or the count measures nothing. Write down the expected number per window on each build before you start; a count you cannot predict is a count you cannot interpret.

Read the count next to the qui log line for the same event (`Refreshed tracker health counts`, `hardlink index built`), so a burst gets a name. A path with a `big-query` suffix is one bulk request that carried a hash list; count it as one.

## Standing baseline

A per-PR count proves the PR's claim. A standing baseline finds the next burst nobody claimed. Keep a dated table of steady-state and boot counts per path in the host file, refreshed after merges that touch the paths above.

## Cleanup

`kill <pid>` from the ledger, confirm with `pgrep -af "[q]bit-request-count"`, remove the test directory, and check `pgrep` once more in the same command. The script holds a raw socket; a forgotten one keeps counting forever and costs a core under load.
