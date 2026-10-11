# Local rigs when the production host is the wrong tool

Use a local rig when the change cannot wait for a CI image, when it must not touch real trackers, when it needs a crafted indexer response, or when a throwaway qBittorrent is safer than the real one.

## qui binary on an alternate port against real config

Copy `~/.config/qui/` and a `VACUUM INTO` copy of the database into the scratchpad, then run the built binary with `--config-dir <dir> --data-dir <dir>` on a free port. Point it at whatever qBittorrent the test needs. Insert nothing into `api_keys` by hand; the permission classifier blocks it and it is the wrong way anyway. Mint the key through the UI, or ask the user.

Traps:

- `cd dir && nohup ./qui serve ... &` makes `$!` the wrapper shell; `kill $!` leaves qui alive and the next binary logs `bind: address already in use`. Use `setsid` and kill with `pkill -f "[q]ui serve --config-dir <dir>"` (the bracket keeps the pattern from matching your own shell).
- `qui serve` fails without a `config.toml`; run `qui generate-config --config-dir <dir>` first on a fresh dir, then `POST /api/auth/setup`, then `POST /api/instances` with `hasLocalFilesystemAccess: true`. Every POST, PUT, PATCH, or DELETE after login needs `-H 'X-Requested-With: XMLHttpRequest'`, or qui answers 403 `Missing X-Requested-With header` (`internal/api/middleware/auth.go`).
- Comparing against the pre-fix binary: `git worktree add <dir> HEAD`, copy `internal/web/dist` in, `go build ./cmd/qui`. Grep the served bundle for a code signature to know which build a tab is running; the service worker precaches chunks across binary swaps on the same port.

## Mock Torznab indexer

A short Python `HTTPServer` on a spare port answering `t=caps` with a caps document and searches with an RSS body of crafted candidates. Register it with `POST /api/torznab/indexers` as a native backend. Serve `/a` healthy and `/b` with 500s to exercise error outcomes. Point it at `127.0.0.1`; nothing in a rig touches a real tracker.

- The native backend sends each request to `base_url` itself, with no `/api` suffix. A mock that routes on a path prefix must match `/b`, not `/b/`.
- Pass `"categories":[2000]` to `POST /api/torznab/search`. Without categories, qui guesses the content type from the query. A synthetic title can come out as music, and then qui skips every indexer and returns zero results with no error.

## Throwaway qBittorrent container (default)

`lscr.io/linuxserver/qbittorrent:latest` with the data dir bind-mounted at the same path inside the container as on the host, so paths qui reads locally match what qBittorrent reports. The temporary admin password is in `docker logs`. The container's WebUI port differs from the mapped host port, so send `-H "Host: localhost:<container port>"` with every request; turning off `web_ui_host_header_validation_enabled` via `app/setPreferences` does not fully remove the need. To reproduce "save path not on the qui host", `docker exec` a directory the host never sees. For a fake tracker, run it inside the network of the qBittorrent container (`docker run --network container:<qbit>`), and start the qBittorrent container with `--add-host tracker-x.test:127.0.0.1`, because an edit to `/etc/hosts` inside the container is lost on restart. Also set `{"ssrf_mitigation":false}` with `app/setPreferences`, or every announce to a local address fails with "blocked by SSRF mitigation".

## Automation rules on a rig

`POST /api/instances/{id}/automations/apply` runs every enabled rule once. Create the rules with a long `intervalSeconds`, such as 86400, and start each run yourself. When a rule ignores a rig torrent, its log line shows a `matchedTrackers` count lower than the torrent count. Two causes:

- qBittorrent queues torrents by default, and the rules skip a torrent in the `queuedUP` state. After login, send `{"queueing_enabled":false}` with `app/setPreferences`.
- After a rule acts on a torrent, a delete included, qui skips that hash for 2 minutes (`SkipWithin`). To reuse a torrent for the next scenario, add it again and wait 2 minutes before you apply the rules. The hardlink index stays cached for 10 minutes, so the wait keeps the same index.

## Stub qBittorrent, for large or crafted libraries only

The container is the default: it answers every endpoint the way qBittorrent does and never drifts from a WebUI version. Reach for the stub only when the library has to be big (thousands of rows in a second) or shaped (hybrid v1+v2 hashes, chosen tracker domains, a torrent removed on demand), or when the test needs a request count and the sniffer is more setup than the question deserves.

`scripts/stub-qbit.py <port> [count]` in this skill: login, capabilities, a synthetic library (2000 torrents by default), and a per-path request counter at `GET /_counts`. Every maindata poll bumps `upspeed` on each row, so stream deltas carry rows; a static library makes every delta empty and hides a handler that drops its row on an empty frame. Copy `/_counts` before and after a window and subtract for a paired request count. The stub answers only what qui asked for when it was written; an endpoint it does not know returns `[]`, so a new call path can pass here and fail on the container. A dead host such as `127.0.0.1:1` puts the instance into a 60 s backoff that survives repointing, so `POST /api/instances/{id}/test` to reconnect.

Paired-binary traps (either rig):

- Build the develop binary with `make backend` in the worktree, not `go build`. A build without ldflags logs in console format, so a grep for a JSON key such as `"hasHashes":true` returns 0 there and the count looks like a result. Grep for the message text, which both formats carry.
- Write the run script's output to a file and read it after; a run that outlives the tool timeout moves to the background and a `| tail` at the end loses everything.
- Time steps with `date` and `awk`: `s=$(date +%s.%N); <command>; awk -v a=$s -v b=$(date +%s.%N) 'BEGIN{printf "%.2f\n", b-a}'`. `bc` is not installed, so a script that times with it prints 0.00s for every step.
- Read instance errors from the `recentErrors` field of `GET /api/instances` (`jq '.[]|{name,connected,recentErrors}'`). The API is the stable surface; a guessed column in the `instance_errors` table (`error_message`) does not exist.

## Windows build under Wine

Wine (`/usr/bin/wine`, 11.17 Staging on 2026-10-07; there is no `wine64` binary) runs a Windows Go build on this machine. Reach for it only when the diff touches Windows behaviour: code behind `runtime.GOOS == "windows"`, a `_windows.go` file or `//go:build windows` tag, or path handling with drive letters and backslashes. Any other change runs on the plain Linux rig, where the result is the same and the setup is cheaper.

```bash
GOOS=windows GOARCH=amd64 go build -o qui.exe ./cmd/qui
WINEDEBUG=-all WINEPREFIX=<scratchpad>/wineprefix wine qui.exe serve --config-dir 'Z:\<scratchpad>\cfg' ...
```

- Give each run its own `WINEPREFIX` in the scratchpad. The first run creates it, which takes a few seconds. Delete the directory at cleanup.
- `WINEDEBUG=-all` removes the `fixme:` noise, so the log shows only the program output.
- Inside Wine, the Linux root is drive `Z:`. `%APPDATA%` is `C:\users\<user>\AppData\Roaming` under the prefix, so a default config dir lands in the prefix, not in `~/.config`.
- Wine uses the host network stack, so `127.0.0.1` inside Wine is the Linux loopback. On 2026-10-07 only an in-process round trip was proven (the Windows binary served and fetched its own listener). Before a test relies on Linux curl reaching the binary, or the binary reaching a Linux stub, send one request each way.
- Kill with `pkill -f "[q]ui.exe serve"`, then `wineserver -k` with the same `WINEPREFIX`, so no `wineserver` stays behind.

Wine is not Windows. File locking, sharing modes, case-insensitive paths on a Linux file system, services, and installers behave differently. A green run under Wine proves the Windows code path compiles, starts, and does the right thing for the observable; it does not prove one of those behaviours. Report the mode as "Wine", and name what needs a real Windows host.

## Unresponsive qBittorrent

To test a qBittorrent that accepts the TCP connection but never answers login, run this stub as `hang.py <port>` on a spare 127.0.0.1 port and add `http://127.0.0.1:<port>` as an instance host. Start it with `setsid`; stop it with `pkill -xf "python3 hang.py <port>"`.

```python
import socketserver, time, sys
class H(socketserver.BaseRequestHandler):
    def handle(self):
        self.request.recv(65536)
        time.sleep(600)
class S(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True
S(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
```

Baseline on develop `1f4d5e6d` (2026-10-04): the first `GET /api/instances/{id}/torrents` returns 500 after about 58 s (the 60 s login budget). The next request returns 500 at once with `instance N is in backoff period`.

Drive service logic without booting qui where the service exposes injectable providers (orphan scan does): an env-gated in-package test can feed real client responses through the real code.
