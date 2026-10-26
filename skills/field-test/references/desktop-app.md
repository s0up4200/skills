# Desktop app

This file covers a field test of a desktop app (step 4c of `SKILL.md`). It applies in addition to the steps of the main skill.

## Run

Run a desktop app on a headless monitor, so that it stays off the user's screens. `~/github/soup/dotfiles/agents/docs/desktop.md` has the monitor recipe, how to send keys without taking focus, and how to mute the audio of the app. Read it before you start the app. Take screenshots with `grim -o BENCH`.

Project facts, such as the build, the install, and the log query, are in `~/.config/field-test/hosts/<project>.md` (for example `relics.md`).

The server log of the backend is often the best observable. For Silo, each API request line has an `operation_id`, and `client_name` shows which client sent it.

## Cleanup

The rig of a desktop app is also the app window, its window rule, and its null sink. Clean them up as step 4 of `desktop.md` says. Teardown is done when `hyprctl clients -j` shows no window with the class of the app, the rule check in `desktop.md` passes, and `pactl list short modules` does not list `agent-mute`.
