# Local rigs when the production host is the wrong tool

Use a local rig when the change cannot wait for a CI image, when it must not touch real trackers, when it needs a crafted indexer response, or when a throwaway qBittorrent is safer than the real one.

## qui binary on an alternate port against real config

Copy `~/.config/qui/` and a `VACUUM INTO` copy of the database into the scratchpad, then run the built binary with `--config-dir <dir> --data-dir <dir>` on a free port. Point it at whatever qBittorrent the test needs. If you know the login of the rig, sign in and send `POST /api/api-keys` with `{"name":…,"instanceIds":[],"permissions":[{"area":…,"level":…}]}`. The reply holds the key. Otherwise, mint the key through the UI, or ask the user. The permission classifier blocks an insert into `api_keys`.

Traps:

- `cd dir && nohup ./qui serve ... &` makes `$!` the wrapper shell; `kill $!` leaves qui alive and the next binary logs `bind: address already in use`. Use `setsid` and kill with `pkill -f "[q]ui serve --config-dir <dir>"` (the bracket keeps the pattern from matching your own shell).
- `qui serve` fails without a `config.toml`; run `qui generate-config --config-dir <dir>` first on a fresh dir, then `POST /api/auth/setup`, then `POST /api/instances` with `hasLocalFilesystemAccess: true`. Every POST, PUT, PATCH, or DELETE after login needs `-H 'X-Requested-With: XMLHttpRequest'`, or qui answers 403 `Missing X-Requested-With header` (`internal/api/middleware/auth.go`).
- `PUT /api/instances/{id}` needs `name` and `host`, or qui answers 400 `Name and host are required`. Also send `username`: without it qui answers 200 and clears the stored username and password. A password, an API key, basic auth, and link settings that you leave out keep their values.
- Comparing against the pre-fix binary: `git worktree add <dir> HEAD`, copy `web/dist` in, `go build ./cmd/qui`. Grep the served bundle for a code signature to know which build a tab is running; the service worker precaches chunks across binary swaps on the same port.
- The binary embeds `web/dist` (`web/build.go`), so `go build ./cmd/qui` after `pnpm build` includes the new frontend. A new worktree has only `web/dist/.gitkeep`. `make frontend` also copies the bundle to `internal/web/dist`, but no code reads that copy. Measure chunk sizes in `web/dist`. A Vite build of an edit that changes only a comment is byte-identical, so use a real statement to make the chunk hashes change.
- In a command that also starts the server, the kill pattern matches its own shell: the shell's text holds the unbracketed `qui serve`, and the call dies with exit 144. Stop the server in a separate Bash call.
- Unlock the premium themes on a rig with this row: `sqlite3 <dir>/qui.db "insert into licenses (license_key, product_name, status, provider, username) values ('LOCAL-RIG-NOT-A-REAL-LICENSE','premium-access','active','dodo','');"`. qui does not send a row with an empty `username` to the provider.
- When the user will watch the rig, give the URL and the login in the same message that says the rig is up.

## Loopback-only rig

Start a rig that uses only stubs in a loopback-only network namespace, so that no request can reach a real host:

```sh
unshare -rn bash -c "ip link set lo up && exec <rig command>"
```

A dev build skips the update check. Set `QUI__CHECK_FOR_UPDATES=false` for a build with a release version.

## Mock Torznab indexer

A short Python `HTTPServer` on a spare port answering `t=caps` with a caps document and searches with an RSS body of crafted candidates. Register it with `POST /api/torznab/indexers` as a native backend. Serve `/a` healthy and `/b` with 500s to exercise error outcomes. Point it at `127.0.0.1`; nothing in a rig touches a real tracker.

- qui waits 60 s between requests to one native backend. If the test is not about this wait, register the mock with `"backend":"jackett","indexer_id":"rig"`. On 2026-11-04, `mock-torznab.py` answered two `POST /api/torznab/search` calls in a row with no wait on this backend, and 60 s apart on a native backend.
- The native backend sends each request to `base_url` itself, with no `/api` suffix. A mock that routes on a path prefix must match `/b`, not `/b/`.
- Pass `"categories":[2000]` to `POST /api/torznab/search`. Without categories, qui guesses the content type from the query. A synthetic title can come out as music, and then qui skips every indexer and returns zero results with no error.

## Throwaway qBittorrent container (default)

`lscr.io/linuxserver/qbittorrent:latest` with the data dir bind-mounted at the same path inside the container as on the host, so paths qui reads locally match what qBittorrent reports. The temporary admin password is in `docker logs`, new on each start. The container's WebUI port differs from the mapped host port, so send `-H "Host: localhost:<container port>"` with every curl request. qui cannot send that header. To let qui reach the mapped port, set both `web_ui_host_header_validation_enabled:false` and `web_ui_csrf_protection_enabled:false` with `app/setPreferences`. The first setting alone is not sufficient. To reproduce "save path not on the qui host", `docker exec` a directory the host never sees. For a fake tracker, run it inside the network of the qBittorrent container (`docker run --network container:<qbit>`), and start the qBittorrent container with `--add-host tracker-x.test:127.0.0.1`, because an edit to `/etc/hosts` inside the container is lost on restart. Also set `{"ssrf_mitigation":false}` with `app/setPreferences`, or every announce to a local address fails with "blocked by SSRF mitigation".

More container gotchas:

- `torrentcreator/addTask` ignores its `trackers` parameter. Add the trackers afterwards with `POST /api/v2/torrents/addTrackers`. A host under `.test` fails in seconds with `Host not found (authoritative)`, which gives a dead tracker with no network.
- A 4 MiB recheck finishes inside the 100 ms poll of qui, and qui reports that the piece check did not start. Use a file of 1 GiB for a recheck test.
- For a test with two pool members, run a second qBittorrent container on the same docker network that seeds the full release, and connect it with `POST /api/v2/torrents/addPeers` (this works on private torrents). Build with `format=v1`, because a hybrid torrent adds pad files and breaks the match. Set `source=` to get distinct hashes.
- To boot qui with auth off, set `QUI__AUTH_DISABLED=true`, `QUI__I_ACKNOWLEDGE_THIS_IS_A_BAD_IDEA=true`, and `QUI__AUTH_DISABLED_ALLOWED_CIDRS=127.0.0.0/8`. With only one of the two flags, qui logs a warning and keeps auth on. Then a URL such as `/instances/1?modal=add-torrent` opens straight away.
- `app/getDirectoryContent` with `withMetadata=true` returns base names in `name`. The plain response returns full paths.
- The `javascript_tool` hides query strings in `performance.getEntriesByType("resource")` URLs. Read the query from the page or from the qui log.

## Automation rules on a rig

`POST /api/instances/{id}/automations/apply` runs every enabled rule once. Create the rules with a long `intervalSeconds`, such as 86400, and start each run yourself. When a rule ignores a rig torrent, its log line shows a `matchedTrackers` count lower than the torrent count. Two causes:

- qBittorrent queues torrents by default, and the rules skip a torrent in the `queuedUP` state. After login, send `{"queueing_enabled":false}` with `app/setPreferences`.
- After a rule acts on a torrent, a delete included, qui skips that hash for 2 minutes (`SkipWithin`). To reuse a torrent for the next scenario, add it again and wait 2 minutes before you apply the rules. The hardlink index stays cached for 10 minutes, so the wait keeps the same index.

## Stub qBittorrent, for large or crafted libraries only

The container is the default: it answers every endpoint the way qBittorrent does and never drifts from a WebUI version. Reach for the stub only when the library has to be big (thousands of rows in a second) or shaped (hybrid v1+v2 hashes, chosen tracker domains, a torrent removed on demand), or when the test needs a request count and the sniffer is more setup than the question deserves.

`scripts/stub-qbit.py <port> [count]` in this skill: login, capabilities, a synthetic library (2000 torrents by default), and a per-path request counter at `GET /_counts`. `GET /_torrent?hash=<hash>&state=moving&progress=0.5` changes one torrent during a run. Poll the qui API until the change shows, because qui reads it at its next sync. Every maindata poll bumps `upspeed` on each row, so stream deltas carry rows; a static library makes every delta empty and hides a handler that drops its row on an empty frame. Copy `/_counts` before and after a window and subtract for a paired request count. The stub answers only what qui asked for when it was written; an endpoint it does not know returns `[]`, so a new call path can pass here and fail on the container. A dead host such as `127.0.0.1:1` puts the instance into a 60 s backoff that survives repointing, so `POST /api/instances/{id}/test` to reconnect.

To test a qBittorrent that is slow to answer, add a toggle to the stub that holds each `/api/v2/sync/maindata` answer for 75 s. That is longer than the 10 s timeout of qui for an incremental sync. Turn the toggle on only after the table shows rows. Each build needs its own healthy first sync. Before the next build connects to the same stub, turn the toggle off, reload the tab, and make sure that the maindata count in `/_counts` rises. Then turn the toggle on again. On 2026-10-19 the second build stalled until the toggle went off.

Paired-binary traps (either rig):

- Build the develop binary with `make backend` in the worktree, not `go build`. A build without ldflags logs in console format, so a grep for a JSON key such as `"hasHashes":true` returns 0 there and the count looks like a result. Grep for the message text, which both formats carry.
- Write the run script's output to a file and read it after; a run that outlives the tool timeout moves to the background and a `| tail` at the end loses everything.
- Time steps with `date` and `awk`: `s=$(date +%s.%N); <command>; awk -v a=$s -v b=$(date +%s.%N) 'BEGIN{printf "%.2f\n", b-a}'`. `bc` is not installed, so a script that times with it prints 0.00s for every step.
- Read instance errors from the `recentErrors` field of `GET /api/instances` (`jq '.[]|{name,connected,recentErrors}'`). The API is the stable surface; a guessed column in the `instance_errors` table (`error_message`) does not exist.

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
