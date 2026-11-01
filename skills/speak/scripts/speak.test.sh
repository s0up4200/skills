#!/usr/bin/env bash
# Runs speak.sh against a local fake ElevenLabs server. It plays silence and sends no request to a real host.
# Fake pgrep and ssh stand in for the Herdr client and the remote machine: the "remote" player runs here.
# Needs python3, ffmpeg, mpv, socat. Run: bash speak.test.sh
set -uo pipefail
here=$(cd "$(dirname "$0")" && pwd)
dir=$(mktemp -d) real=${XDG_RUNTIME_DIR:?}
trap 'kill "$srv" 2>/dev/null; "$here/speak.sh" stop; rm -rf "$dir"' EXIT
export XDG_RUNTIME_DIR=$dir PATH=$dir/bin:$PATH
mkdir -p "$dir/bin"
# mpv finds PipeWire through XDG_RUNTIME_DIR, so link the real sockets in.
ln -s "$real/pipewire-0" "$real/pulse" "$dir/"
ffmpeg -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t 3 -q:a 9 "$dir/silence.mp3"
printf '#!/bin/sh\ncat "%s/key" 2>/dev/null\n' "$dir" >"$dir/bin/secret-tool"
printf '#!/bin/sh\necho "$2" >>"%s/notices"\n' "$dir" >"$dir/bin/notify-send"
cat >"$dir/bin/pgrep" <<EOF
#!/bin/sh
[ "\$*" = "-af ^[^ ]*tailscaled be-child ssh .*herdr-core" ] && { cat "$dir/clients" 2>/dev/null; exit 0; }
exec /usr/bin/pgrep "\$@"
EOF
cat >"$dir/bin/ioreg" <<EOF
#!/bin/sh
[ -e "$dir/idle" ] || exit 1
echo "  |   \"HIDIdleTime\" = \$(cat "$dir/idle")000000000"
EOF
cat >"$dir/bin/ssh" <<EOF
#!/bin/sh
for a; do host=\$cmd; cmd=\$a; done
echo "\$host" >>"$dir/ssh-hosts"
exec sh -c "\$cmd"
EOF
chmod +x "$dir/bin/"*

# The fake answers 401 when the key is "bad", and appends each request body to requests.
cat >"$dir/fake.py" <<'EOF'
import http.server, json, sys
d = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers["Content-Length"]))
        with open(d + "/requests", "a") as f:
            f.write(json.dumps({"path": self.path, "key": self.headers["xi-api-key"], **json.loads(body)}) + "\n")
        if self.headers["xi-api-key"] == "bad":
            msg = b'{"detail": {"message": "Invalid API key \\"bad\\""}}'
            self.send_response(401); self.send_header("Content-Length", str(len(msg))); self.end_headers()
            self.wfile.write(msg); return
        data = open(d + "/silence.mp3", "rb").read()
        self.send_response(200); self.send_header("Content-Length", str(len(data))); self.end_headers()
        self.wfile.write(data)
    def log_message(self, *a): pass
s = http.server.HTTPServer(("127.0.0.1", 0), H)
print(s.server_port, flush=True)
s.serve_forever()
EOF
coproc FAKE { exec python3 -I "$dir/fake.py" "$dir"; }
srv=$FAKE_PID
read -r port <&"${FAKE[0]}"
export SPEAK_API=http://127.0.0.1:$port

fail=0
check() { local name=$1; shift; if "$@"; then echo "ok   $name"; else echo "FAIL $name"; fail=1; fi; }
waitfor() { for _ in $(seq 50); do "$@" && return 0; sleep 0.1; done; return 1; }
pidf=$dir/speak/pid
has_requests() { [[ -s $dir/requests && $(wc -l <"$dir/requests") == "$1" ]]; }
noticed() { grep -q "$1" "$dir/notices" 2>/dev/null; }
playing() { [[ -s $pidf ]] && pgrep -g "$(<"$pidf")" mpv >/dev/null; }
paused() { echo '{"command":["get_property","pause"]}' | socat - "$dir/speak/mpv.sock" | grep -q '"data":true'; }
gone() { ! pgrep -g "$1" >/dev/null; }
remote_state() { ps -o state= -p "$(pgrep -f '[s]peak-sh' | head -1)" 2>/dev/null; }
remote_paused() { [[ $(remote_state) == T* ]]; }
remote_playing() { [[ -n $(remote_state) && $(remote_state) != T* ]]; }
remote_gone() { [[ -z $(remote_state) ]]; }

echo good >"$dir/key"
"$here/speak.sh" >/dev/null <<'EOF'
# Title
Read **this**, see [the docs](https://example.invalid/x).

```go
fmt.Println("skip me")
```

| a | b |
|---|---|
Done at https://example.invalid/y now.
EOF
waitfor has_requests 1
want="Title Read this, see the docs. Done at now. "
check "strips Markdown, code, tables, URLs" [ "$(jq -r .text "$dir/requests" | tr -s " \n" " ")" == "$want" ]
want="good eleven_v4_turbo /v1/text-to-speech/6WwXjDDEMyNmFG95zycZ/stream?output_format=mp3_44100_128"
check "sends key, model, and path" [ "$(jq -r '[.key, .model_id, .path] | join(" ")' "$dir/requests")" == "$want" ]
check "plays in the background" waitfor playing
"$here/speak.sh" pause
check "pause reaches mpv" waitfor paused
group=$(<"$pidf")
"$here/speak.sh" stop
check "stop kills the player" waitfor gone "$group"

# 3 paragraphs of 3000 characters: about 4000 characters per chunk gives 3 requests.
rm -f "$dir/requests"
para=$(printf 'word %.0s' $(seq 600))
printf '%s\n\n%s\n\n%s\n' "$para" "$para" "$para" | "$here/speak.sh" >/dev/null
check "splits long text into chunks" waitfor has_requests 3
"$here/speak.sh" stop

echo bad >"$dir/key"
echo hello | "$here/speak.sh" >/dev/null
check "shows the ElevenLabs error message" waitfor noticed "ElevenLabs: Invalid API key bad"

rm -f "$dir/key" "$dir/notices"
echo hello | "$here/speak.sh" >/dev/null
check "reports a missing key" waitfor noticed "No ElevenLabs key"

echo good >"$dir/key"
echo '1 /usr/bin/tailscaled be-child ssh --login-shell=/usr/bin/bash --remote-ip=100.64.0.9 --has-tty=false --cmd=sh -c '\''p=$(command -v herdr-core); exec "$p" connect'\' >"$dir/clients"
echo hello | "$here/speak.sh" >/dev/null
check "plays on the attached Herdr client" waitfor remote_playing
check "connects to the client's address" grep -qx 100.64.0.9 "$dir/ssh-hosts"
"$here/speak.sh" pause
check "pause stops the remote player" waitfor remote_paused
"$here/speak.sh" pause
check "pause again resumes it" waitfor remote_playing
"$here/speak.sh" stop
check "stop ends the remote player" waitfor remote_gone

echo 30 >"$dir/idle"
out=$(echo hello | "$here/speak.sh")
check "plays on a client used 30 seconds ago" [ "$out" = "speak.sh: reading 6 characters on 100.64.0.9" ]
"$here/speak.sh" stop
echo 600 >"$dir/idle"
out=$(echo hello | "$here/speak.sh")
check "plays here when the client was idle 10 minutes" [ "$out" = "speak.sh: reading 6 characters on local" ]
"$here/speak.sh" stop
rm -f "$dir/idle"

rm -f "$dir/ssh-hosts"
echo hello | SPEAK_TARGET=local "$here/speak.sh" >/dev/null
check "SPEAK_TARGET=local plays here" waitfor playing
check "SPEAK_TARGET=local uses no ssh" [ ! -e "$dir/ssh-hosts" ]
"$here/speak.sh" stop

check "rejects empty input" eval '! "$here/speak.sh" </dev/null 2>/dev/null'
exit "$fail"
