# Remote filesystem (SFTP) rig

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

Make sure that the `sftp` check lists `downloads` before you add qui. Then one failure in qui is a qui failure, not an SSH failure. qui accepts a PEM private key without a passphrase, such as the key from `ssh-keygen` above.

qBittorrent setup: log in with the temporary password from `docker logs rig-qbit`. With `app/setPreferences`, send `web_ui_host_header_validation_enabled:false`, `web_ui_csrf_protection_enabled:false`, and `queueing_enabled:false`. qBittorrent removes a trailing slash from `save_path`: a default save path of `/data/downloads/` comes back as `/data/downloads`. Thus this rig cannot make a scan root with a trailing slash. A duplicate root comes out byte-identical.

Synthetic torrent: make a 1 MiB file under `$R/data/downloads/<name>`, run `nice -n 19 env GOMAXPROCS=2 mkbrr create <dir> -o rig.torrent --workers 1`, then send `torrents/add` with `savepath=/data/downloads` and `seedMode=true` (`skip_checking=true` before qBittorrent 5.3).

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
for i in $(seq 1 30); do curl -sf -o /dev/null http://127.0.0.1:$P/health && break; sleep 0.5; done
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

Build the develop binary with the steps in `rigs.md`: its first section and its paired-binary traps.

Teardown: `docker rm -f rig-qbit rig-ssh`, `git worktree remove --force` the develop worktree, and delete the rig dir. Then make sure that no rig port is still listening.
