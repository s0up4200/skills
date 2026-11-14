# iOS Safari in the iOS Simulator

Drive the simulator with the T3 device tools: `device_list`, `device_open`, and the `agent-device` command that `device_open` returns. Proven 2026-11-14 on an iPhone 17e with iOS 27.0, for autobrr/qui#4121. Serve the rig on `127.0.0.1`: the simulator shares the network of the Mac.

## When `device_list` shows no devices

- The device hub lists only a simulator that booted at least once. It reads `lastUsedAt` or `lastBootedAt` from the `device.plist` of the simulator. A simulator that Xcode just created has neither, so the list is empty and shows no error. Boot it once with `xcrun simctl boot <udid>`, then call `device_list` again.
- When the result says `agentDeviceInstalled: false`, or the hub does not run, the install failed. T3 installs `expo-device-hub` and `agent-device` with plain `npm install`, and the 7-day `min-release-age` in `~/.npmrc` refuses a version that is too new. The error shows only in `~/.t3/userdata/logs/server.trace.ndjson`, in a `DeviceToolchain.installTool` span with `ETARGET` in its stderr. Tell the user which package is too new. The user decides on an exclusion.

## Show the bug

- Safari has three address bar layouts, in Settings > Apps > Safari > Tabs: Compact (the default on iOS 27), Bottom, and Top. The layout decides how much of the page the toolbars cover. On #4121, develop hid the dialog buttons only in Top. Capture the before in each layout that the bug can involve, and name the layout in the verdict.
- Each rig port is its own origin, so qui incognito mode and local storage are per port. Turn on incognito mode on each build.
- `settings appearance dark` gives dark captures.

## Drive the page

- Snapshot again before each press. A press changes the page, and the refs of an older snapshot go stale.
- `open` returns before the page renders. Before the first press, wait until the snapshot shows a known button.
- A ref press on a web `text-view` fails with "no parent-owned touch point". Read the rect of the field with `snapshot -i --json`, and fill at its center: `fill <x> <y> --text-stdin < <file>`. A long value in a wrapping field reports `TEXT_ENTRY_MISMATCH` and still lands. Look at the field.
- `snapshot -i --json` gives the rect of each element in points. A rect that ends below the toolbar shows a hidden element without a screenshot.
- Close the keyboard with its `Done` button before the capture without the keyboard.
- `screenshot <path> --pixel-density 3` saves the device resolution. Take both captures of a pair on the same device and layout.
- Prove that a tap landed with a signal outside the screen, for example a count in `/_counts` of the stub qBittorrent.

## Builds

When the PR branch is far behind the base, build the base, and the base with the PR head merged: `git merge --no-commit --no-ff <sha>` in a detached worktree. Then the pair differs only by the PR.

## Clean up

Put back each setting that you changed, such as the Safari layout and the appearance. If you booted the simulator, call `device_close` with `shutdown: true`.
