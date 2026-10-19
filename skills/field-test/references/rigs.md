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

`lscr.io/linuxserver/qbittorrent:latest` with the data dir bind-mounted at the same path inside the container as on the host, so paths qui reads locally match what qBittorrent reports. The temporary admin password is in `docker logs`. The container's WebUI port differs from the mapped host port, so send `-H "Host: localhost:<container port>"` with every curl request. qui cannot send that header. To let qui reach the mapped port, set both `web_ui_host_header_validation_enabled:false` and `web_ui_csrf_protection_enabled:false` with `app/setPreferences`. The first setting alone is not sufficient. To reproduce "save path not on the qui host", `docker exec` a directory the host never sees. For a fake tracker, run it inside the network of the qBittorrent container (`docker run --network container:<qbit>`), and start the qBittorrent container with `--add-host tracker-x.test:127.0.0.1`, because an edit to `/etc/hosts` inside the container is lost on restart. Also set `{"ssrf_mitigation":false}` with `app/setPreferences`, or every announce to a local address fails with "blocked by SSRF mitigation".

More container gotchas:

- `torrentcreator/addTask` ignores its `trackers` parameter. Add the trackers afterwards with `POST /api/v2/torrents/addTrackers`. A host under `.test` fails in seconds with `Host not found (authoritative)`, which gives a dead tracker with no network.
- A 4 MiB recheck finishes inside the 100 ms poll of qui, and qui reports that the piece check did not start. Use a file of 1 GiB for a recheck test.
- For a test with two pool members, run a second qBittorrent container on the same docker network that seeds the full release, and connect it with `POST /api/v2/torrents/addPeers` (this works on private torrents). Build with `format=v1`, because a hybrid torrent adds pad files and breaks the match. Set `source=` to get distinct hashes.
- To boot qui with auth off, set `QUI__AUTH_DISABLED=true`, `QUI__I_ACKNOWLEDGE_THIS_IS_A_BAD_IDEA=true`, and `QUI__AUTH_DISABLED_ALLOWED_CIDRS=127.0.0.0/8`. With only one of the two flags, qui logs a warning and keeps auth on. Then a URL such as `/instances/1?modal=add-torrent` opens straight away.
- `app/getDirectoryContent` with `withMetadata=true` returns base names in `name`. The plain response returns full paths.
- The `javascript_tool` hides query strings in `performance.getEntriesByType("resource")` URLs. Read the query from the page or from the qui log.

## Remote filesystem (SFTP) rig

Use this rig when the change touches remote filesystem mode. In this mode, qui reads the qBittorrent files over SFTP, not from a local path. Proven on 2026-10-14 with an orphan scan, in autobrr/qui#3175.

Put the rig dir on disk, for example `~/.cache/qui-rig-<PR>`, not in `/tmp`. Bind-mount the same data dir at `/data` in both containers. Set `PUID` and `PGID` to your uid and gid, so that you can delete the files at teardown.

```bash
R=<rig dir>; mkdir -p $R/data/downloads $R/key
ssh-keygen -q -t ed25519 -N '' -f $R/key/id
docker run -d --name rig-qbit -e PUID=$(id -u) -e PGID=$(id -g) -e WEBUI_PORT=8080 \
  -v $R/data:/data -p 127.0.0.1:<qbit port>:8080 lscr.io/linuxserver/qbittorrent:latest
docker run -d --name rig-ssh -e PUID=$(id -u) -e PGID=$(id -g) -e USER_NAME=rig \
  -e PUBLIC_KEY="$(cat $R/key/id.pub)" -v $R/data:/data -p 127.0.0.1:<ssh port>:2222 \
  lscr.io/linuxserver/openssh-server:latest
echo "ls /data" | sftp -q -i $R/key/id -P <ssh port> -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null rig@127.0.0.1
```

Make sure that the `sftp` check lists `downloads` before you add qui. Then one failure in qui is a qui failure, not an SSH failure. qui accepts a PEM private key without a passphrase. The key from the `ssh-keygen` line above works.

qBittorrent setup: log in with the temporary password from `docker logs rig-qbit`. With `app/setPreferences`, send `web_ui_host_header_validation_enabled:false`, `web_ui_csrf_protection_enabled:false`, and `queueing_enabled:false`. qBittorrent removes a trailing slash from `save_path`: a default save path of `/data/downloads/` comes back as `/data/downloads`. Thus this rig cannot make a scan root with a trailing slash. A duplicate root comes out byte-identical.

Synthetic torrent: make a 1 MiB file under `$R/data/downloads/<name>`, run `nice -n 19 env GOMAXPROCS=2 mkbrr create <dir> -o rig.torrent --workers 1`, then send `torrents/add` with `savepath=/data/downloads` and `skip_checking=true`.

Remote mode needs four qui calls, in this order. If you do not pin the host key, the instance stays in filesystem mode `none` and a scan does not use SFTP.

1. `POST /api/instances` with `hasLocalFilesystemAccess:false`.
2. `PUT /api/instances/{id}/ssh-credentials` with `{host, port, username, privateKey}`. Expect 204.
3. `POST /api/instances/{id}/ssh-test`. It returns `status:"unpinned"` and a `hostKey`.
4. `POST /api/instances/{id}/ssh-host-key` with `{hostKey}`, the value from step 3 unchanged. Expect 204.

The script below starts one qui binary, does the four calls, runs an orphan scan, and prints the result. Run it once for each build, on a different port each time, and write the output to a file. The run must show `filesystemMode` as `"remote"`. If it does not, the scan used no SFTP and proves nothing about remote mode. `GET .../orphan-scan/runs` returns a bare JSON array, not `{runs: [...]}`. The run detail at `.../orphan-scan/runs/{runID}` has `filesystemMode`, `scanPaths`, and `files`. The script sets `logLevel = "DEBUG"`, for an observable that is a debug line.

```bash
#!/usr/bin/env bash
# usage: R=<rig dir> QBIT_PORT=.. SSH_PORT=.. QBIT_PASS=.. run.sh <qui binary> <qui port>
set -u
BIN=$1; P=$2; D=$R/cfg-$P; rm -rf $D; mkdir -p $D
$BIN generate-config --config-dir $D >/dev/null 2>&1
sed -i -E 's/^#? *logLevel *=.*/logLevel = "DEBUG"/; s/^#? *port *=.*/port = '"$P"'/; s/^#? *host *=.*/host = "127.0.0.1"/' $D/config.toml
setsid $BIN serve --config-dir $D --data-dir $D > $D/qui.log 2>&1 < /dev/null &
for i in $(seq 1 30); do curl -sf -o /dev/null http://127.0.0.1:$P/api/health && break; sleep 0.5; done
U=http://127.0.0.1:$P; C=$D/cookies; X=(-H 'X-Requested-With: XMLHttpRequest' -H 'Content-Type: application/json')
curl -s "${X[@]}" -c $C -d '{"username":"rig","password":"rig-password"}' $U/api/auth/setup >/dev/null
curl -s "${X[@]}" -c $C -b $C -d '{"username":"rig","password":"rig-password"}' $U/api/auth/login >/dev/null
ID=$(jq -n --arg h "http://127.0.0.1:$QBIT_PORT" --arg p "$QBIT_PASS" \
  '{name:"rig",host:$h,username:"admin",password:$p,hasLocalFilesystemAccess:false}' \
  | curl -s "${X[@]}" -b $C -d @- $U/api/instances | jq -r .id)
jq -n --rawfile k $R/key/id --argjson port $SSH_PORT '{host:"127.0.0.1",port:$port,username:"rig",privateKey:$k}' \
  | curl -s -o /dev/null -w 'creds %{http_code}\n' -X PUT "${X[@]}" -b $C -d @- $U/api/instances/$ID/ssh-credentials
HK=$(curl -s -X POST "${X[@]}" -b $C $U/api/instances/$ID/ssh-test | jq -r .hostKey)
jq -n --arg k "$HK" '{hostKey:$k}' | curl -s -o /dev/null -w 'pin %{http_code}\n' "${X[@]}" -b $C -d @- $U/api/instances/$ID/ssh-host-key
curl -s -X PUT "${X[@]}" -b $C -d '{"scanDefaultSavePath":true,"gracePeriodMinutes":0}' $U/api/instances/$ID/orphan-scan/settings >/dev/null
sleep 3
curl -s -X POST "${X[@]}" -b $C $U/api/instances/$ID/orphan-scan/scan
for i in $(seq 1 40); do
  RUN=$(curl -s -b $C $U/api/instances/$ID/orphan-scan/runs | jq -c '.[0]')
  case $(jq -r .status <<<"$RUN") in preview_ready|completed|failed) break;; esac; sleep 1
done
curl -s -b $C $U/api/instances/$ID/orphan-scan/runs/$(jq -r .id <<<"$RUN") | jq -c '{filesystemMode,scanPaths}'
pkill -f "[s]erve --config-dir $D"
```

Build the develop binary in a worktree with `make backend`. A new worktree has no `internal/web/dist`. Copy it from the main checkout before the build, and delete the copy after the build.

Teardown: `docker rm -f rig-qbit rig-ssh`, `git worktree remove --force` the develop worktree, and delete the rig dir. Then make sure that no rig port is still listening.

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

## Windows 11 VM

Use the VM when Wine is not enough, for example for self-update or file locks. The user starts it with `omarchy-windows-vm launch`. The container is `omarchy-windows`, and the compose file is `~/.config/windows/docker-compose.yml`. Its `PASSWORD` value is the Windows password. Do not print it.

- Cross-build into `~/Windows/qui-test/`. Inside the VM this is `\\host.lan\Data`. The user copies the files to `C:\qui` and runs qui from there. Delete `~/Windows/qui-test` afterwards.
- qui in the VM binds `127.0.0.1:7476`. Only the VM browser and PowerShell scripts in the VM reach it, so the user drives the UI.
- A fake release version in `-ldflags "-X github.com/autobrr/qui/internal/buildinfo.Version=<old version>"` makes the real signed release the update target.
- CI runs no Go tests on Windows. `GOOS=windows go test -c` builds a test exe. In PowerShell, quote the flags: `"-test.run=Name" "-test.v"`.
- In PowerShell, use `cmd /c move /Y`, because `Move-Item` rejects `/Y`. Use `[IO.File]::ReadAllText`, because `ConvertTo-Json` hangs on a `Get-Content -Raw` string in PowerShell 5.1.
- In Task Scheduler, "Run only when user is logged on" skips the password prompt and keeps the processes visible in `tasklist`.
- To block writes for an error-path test, run `icacls C:\qui /deny "${env:USERNAME}:(W)"` after qui starts. Undo it with `icacls C:\qui /remove:d $env:USERNAME`.
- On 2026-10-01 the share once served old files. If that happens again, serve the files over HTTP from a container on the docker network of the VM, and download with `$ProgressPreference='SilentlyContinue'`.

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
