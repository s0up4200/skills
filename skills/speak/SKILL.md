---
name: speak
description: Read text aloud with an ElevenLabs voice. Use when the user asks to hear something, for example "read that to me", "read me a summary of <file, note, page, PR>", "read this document aloud", or "say it out loud", and when they ask to stop or pause the reading.
argument-hint: "[what to read, for example \"summary\", a file path, or \"stop\"]"
---

# Speak

The user listens instead of reads, often away from the screen. They want to hear a text in a natural voice. `scripts/speak.sh` in this skill's folder does the audio: it reads text on stdin, strips Markdown, sends it to ElevenLabs, and plays it in the background. The command returns at once, and the voice keeps talking while the session goes on. Each new read stops the one before it.

The voice plays where the user is. If a Herdr client is attached to this machine over Tailscale SSH, and someone used its keyboard or mouse in the last 5 minutes, the script sends the audio over SSH to that machine. Otherwise it plays here. The script prints the target, for example `reading 412 characters on 100.64.0.9`. When the user says that the voice plays on the wrong machine, run the script again with `SPEAK_TARGET=local` to play here, or `SPEAK_TARGET=<ssh host>` to play there.

## Pick the mode

- **Summary** is the default. Use it for "read me a summary of X", and for "read that to me" about your own last reply. Write 2–4 sentences for the ear: plain words, no Markdown, no code, no URLs, no file paths. Say a number or a name only when the user needs it. Pass the sentences in a quoted heredoc:

  ```bash
  <skill dir>/scripts/speak.sh <<'EOF'
  The review found two real bugs and one style nit. Both bugs are in the retry loop.
  EOF
  ```

- **Full read** is for "read this document to me", "read the whole thing", or "read it aloud" about a file, note, PR, or page. Pipe the source to the script as it is, so that you write none of the text yourself: `speak.sh < notes.md`, or `gh pr view 12 --json body -q .body | speak.sh`. For a web page, get the text first.

- **Stop** runs `speak.sh stop`. **Pause** and **resume** both run `speak.sh pause`.

## Cost

ElevenLabs charges about one credit for each character it reads, and the user's plan holds a fixed number of credits a month. A summary costs a few hundred credits. A long document costs thousands. Before a full read, count the characters (`wc -m`). If the text has more than 5,000 characters, tell the user the count and offer a summary, and start the full read only when they say yes.

## Reply

After the script starts, reply in one short line, for example "Reading the summary." Leave out the spoken text, because the user hears it. The script prints "reading" before ElevenLabs answers, so a failure shows up later, as a desktop notice on the machine that plays the audio. When the user hears nothing or reports a notice, show the last lines of `$XDG_RUNTIME_DIR/speak/log`. A missing key shows the notice "No ElevenLabs key". The user stores the key with `secret-tool store --label=ElevenLabs service elevenlabs` in a terminal on this machine.
