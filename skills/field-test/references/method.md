# Measuring a performance claim live

Two traps turned honest work into wrong numbers before; both are cheap to avoid.

- Closed-loop load hides a speedup. A faster server serves more requests in the window, so cumulative profile time looks unchanged. Count the requests in the window and divide, or the profile says nothing.
- A single before/after pair is a coin flip. Run A/B/A (after, before, after) with image swaps. The two "after" runs must agree with each other before the delta means anything; in one field test both sides reproduced within 2 ms across 12 minutes, which is what killed the "was my browser open" confound.

Also:

- Time the code under test, not the network. For list endpoints, `prefer=cache` removes the qBittorrent sync from the path.
- Sustained load, not point samples, for anything involving GC or caches. Thirty seconds of steady requests beats ten single timings.
- Never quote a microbenchmark ratio as an endpoint ratio. A 12x bench win was a 2.5x endpoint win because the response also encodes 300 rows of JSON, unchanged.
- When qui runs inside another container's network namespace (a VPN or Tailscale sidecar), pprof listens inside that namespace: `docker exec <sidecar> wget -qO- 'http://127.0.0.1:6060/debug/pprof/profile?seconds=20' > /tmp/cpu.pprof`, then `docker cp` or `scp` it out. The host file names the sidecar.
