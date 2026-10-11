# Live log monitoring that provably delivers

Three monitors in a row were once reported as "watching" while silently dead. The causes: BSD `sed` rejecting `\{600\}`, a backgrounded remote `tail` dying beside its wrapper, and the local `grep` shell function (ugrep) never flushing rare matches on a long-lived pipe. Each was found by reading the log by hand. The recipe below is the one that worked.

## Rules

1. Filter on the remote end with GNU tools: `grep --line-buffered` on the host works. Locally, use `command grep` if you must filter at all.
2. Keep `tail -F -n 0 <log>` as the foreground process of the SSH session. A backgrounded `tail &` beside a poll loop died silently.
3. Emit a sentinel through the full chain before anything else, and do not report the monitor as armed until the sentinel arrives. The cheapest sentinel is a line the filter must pass, written to the log by a request you control (a search whose log line you then match), or an `echo MONITOR-ARMED` injected into the pipeline on the remote side.
4. Expect a Tailscale path to drop the stream after about 15 minutes. Use `-o ServerAliveInterval=30 -o ServerAliveCountMax=4` and a local reconnect loop that prints a `MONITOR-RECONNECT` line, so a gap in output is visible.
5. `tail -F` survives the 50 MB rotation; `grep -c` counters reset with it.
6. Whenever you report status, cross-check one pattern you know is present in the log (any routine line) against what the monitor delivered. Zero deliveries plus a busy log means the monitor is dead.

## Shape

The SSH form and the log path come from the host file.

```
while true; do
  ssh <host ssh options> -o ServerAliveInterval=30 -o ServerAliveCountMax=4 -T <host> \
    'echo MONITOR-ARMED; tail -F -n 0 <log> | grep --line-buffered -E "<pattern>"'
  echo "MONITOR-RECONNECT $(date -u +%H:%M:%S)"
  sleep 5
done
```

Run it through the Monitor tool with a hard timeout, or in the foreground with a timeout. Never leave it running past the session.

## Cleanup

A killed SSH session leaves remote zsh wrappers and tails behind. Remove them with the exact command line:

```
ssh <host ssh options> -T <host> 'pkill -xf "tail -F -n 0 <log>"'
```

`pgrep -f` without `-x` matches your own wrapper's command line and kills your session (exit 255). Confirm with `pgrep -af "tail -F"` afterwards and expect nothing.
