#!/usr/bin/env bash
# speak.sh: read text from stdin aloud with ElevenLabs, in the background.
#   speak.sh <<<'text'   speak.sh <doc.md   cmd | speak.sh   speak.sh stop   speak.sh pause
# The API key comes from the keyring:
#   secret-tool store --label=ElevenLabs service elevenlabs
# Optional: SPEAK_VOICE (voice ID), SPEAK_MODEL (model ID), SPEAK_TARGET (see target below).
set -uo pipefail
run=${XDG_RUNTIME_DIR:?}/speak
mkdir -p "$run"
sock=$run/mpv.sock pidf=$run/pid log=$run/log targetf=$run/target

# Where the audio plays. SPEAK_TARGET=local plays here, SPEAK_TARGET=<ssh host> plays there.
# The default follows the user: if a Herdr client is attached over Tailscale SSH, and its keyboard or
# mouse moved in the last 5 minutes, play on that machine. A client with no idle time (not a Mac) counts.
# ponytail: finds only Tailscale SSH clients (the --remote-ip flag); plain sshd clients play here.
idle_check='ioreg -c IOHIDSystem -d 4 | awk "/HIDIdleTime/ {print int(\$NF / 1000000000); exit}"'
target() {
  local t=${SPEAK_TARGET:-} idle
  [[ -n $t ]] && { echo "$t"; return; }
  t=$(pgrep -af '^[^ ]*tailscaled be-child ssh .*herdr-core' | sed -n 's/.*--remote-ip=\([^ ]*\).*/\1/p' | tail -1)
  [[ -n $t ]] && idle=$(ssh -o BatchMode=yes -o ConnectTimeout=5 "$t" "$idle_check" 2>/dev/null)
  [[ -n $t && ! ${idle:-0} -gt 300 ]] && echo "$t" || echo local
}
# The remote player has the title speak-sh, so stop and pause can find it. [s] keeps pgrep off its own shell.
remote_play='PATH=/opt/homebrew/bin:/usr/local/bin:$PATH exec ffplay -nodisp -autoexit -nostats -loglevel error -window_title speak-sh -'
remote_stop='pkill -f "[s]peak-sh"'
remote_pause='p=$(pgrep -f "[s]peak-sh" | head -1) || exit 0
case $(ps -o state= -p "$p") in T*) kill -CONT "$p" ;; *) kill -STOP "$p" ;; esac'
on_target() { ssh -o BatchMode=yes -o ConnectTimeout=5 "$(<"$targetf")" "$1"; }
# Show an error where the user listens: a macOS notice on a remote Mac, else a notice here.
notify() {
  local m=${1//[\"\']/} # quotes would break the AppleScript and the remote shell
  echo "speak.sh: $m" >&2
  [[ $(<"$targetf") != local ]] &&
    on_target "osascript -e 'display notification \"$m\" with title \"speak\"'" 2>/dev/null && return
  notify-send speak "$m"
}

case "${1:-}" in
  stop)
    [[ -s $pidf ]] && kill -- -"$(<"$pidf")" 2>/dev/null
    [[ -s $targetf && $(<"$targetf") != local ]] && on_target "$remote_stop" 2>/dev/null
    rm -f "$pidf" "$targetf"
    exit 0 ;;
  pause)
    if [[ -s $targetf && $(<"$targetf") != local ]]; then on_target "$remote_pause"
    else echo 'cycle pause' | socat - "$sock" >/dev/null 2>&1; fi
    exit 0 ;;
esac

if [[ -z ${SPEAK_CHILD:-} ]]; then
  [[ $# -eq 0 ]] || { echo "usage: speak.sh <text | speak.sh stop | speak.sh pause" >&2; exit 2; }
  tmp=$(mktemp -p "$run" text.XXXXXX)
  cat >"$tmp"
  [[ -s $tmp ]] || { rm -f "$tmp"; echo "speak.sh: no text on stdin" >&2; exit 1; }
  "$0" stop
  t=$(target)
  # setsid makes the child a process-group leader, so stop kills curl and mpv with it.
  SPEAK_TARGET=$t SPEAK_CHILD=1 setsid -f "$0" "$tmp" </dev/null >>"$log" 2>&1
  echo "speak.sh: reading $(wc -m <"$tmp") characters on $t"
  exit 0
fi

echo $$ >"$pidf"
target >"$targetf"
text=$(<"$1")
rm -f "$1"
key=$(secret-tool lookup service elevenlabs)
if [[ -z $key ]]; then
  notify "No ElevenLabs key. Run: secret-tool store --label=ElevenLabs service elevenlabs"
  rm -f "$pidf"
  exit 1
fi
api=${SPEAK_API:-https://api.elevenlabs.io} # tests point this at a local fake
voice=${SPEAK_VOICE:-yj30vwTGJxSHezdAGsv9}
model=${SPEAK_MODEL:-eleven_v4_turbo}

# ponytail: regex Markdown strip; it also drops '_' in snake_case. Use pandoc -t plain if it reads badly.
clean() {
  perl -0777 -pe 's/^#+\s*//mg; s/^```.*?^```[^\n]*\n/ /gms; s/^\|.*\n//mg; s/!?\[([^\]]*)\]\([^)]*\)/$1/g; s{https?://\S+}{}g; s/[`*_#>]+//g'
}
# Whole paragraphs, at most about 4000 characters each, separated by NUL. The model takes 10,000.
chunk() {
  awk -v RS= -v max=4000 '
    length(b) + length($0) > max && b != "" { printf "%s%c", b, 0; b = "" }
    { b = b (b == "" ? "" : "\n\n") $0 }
    END { if (b != "") printf "%s%c", b, 0 }'
}
# Each response also goes to $run/body, so a failure can show the error message that ElevenLabs sent.
tts() {
  while IFS= read -r -d '' c; do
    jq -n --arg t "$c" --arg m "$model" '{text: $t, model_id: $m}' |
      curl -sS --fail-with-body -H @<(printf 'xi-api-key: %s\n' "$key") -H 'Content-Type: application/json' \
        --data-binary @- "$api/v1/text-to-speech/$voice/stream?output_format=mp3_44100_128" |
      tee "$run/body" && continue
    notify "ElevenLabs: $(jq -r '.detail.message // .detail // "request failed"' "$run/body" 2>/dev/null || echo 'request failed')"
    break
  done
  rm -f "$run/body"
}

play() {
  if [[ $(<"$targetf") == local ]]; then mpv --no-video --really-quiet --input-ipc-server="$sock" -
  else on_target "$remote_play"; fi
}

printf '%s' "$text" | clean | chunk | tts | play
[[ $(<"$pidf") == "$$" ]] && rm -f "$pidf"
