# Research: a better browser tool for the field-test skill

Date: 2026-10-27

Scope: the question "Is there a better tool than headless Playwright for the browser step of `field-test`, for soup's projects and this machine?" The browser step is section 4b of `skills/field-test/SKILL.md` and all of `skills/field-test/references/browser.md`. The local rig is the main case. The production host uses the Claude in Chrome tools, because the sign-in lives in the user's Chrome. This note says where a candidate changes that case.

Each claim has a label:

- "Source" gives what a primary source says, with the version or commit that I read.
- "Machine" gives what I ran on this machine on 2026-10-27. I installed nothing and downloaded no browser.
- "Inference" gives my reading.

The machine: Omarchy (Arch), Hyprland, Playwright 1.64.1 (mise npm global), `/usr/bin/chromium` 155.0.8059.84, Google Chrome 156.0.8078.47, Firefox 158.0.1, node 26.12.1, `/usr/bin/ffmpeg` n9.0.2, Claude Code 2.1.311.

## Summary

- Keep Playwright. Do not switch tools. The installed Playwright 1.64.1 already holds the parts that the skill lacks. No candidate covers more of the observables, and each one adds an install. (Machine, Source)
- Change how the skill calls Playwright. Load it by absolute path, so a script can be `.cjs` or `.mjs` with no `NODE_PATH` trick. Both forms ran on this machine. (Machine)
- Turn recordings on for the rig. Two ways work headless with the system Chromium and no download. The first is Playwright video with a folder that points Playwright at `/usr/bin/ffmpeg`. The second is Chrome's own recorder (`Page.startScreenRecording`, experimental), which writes an mp4 with no ffmpeg. Both ran on this machine. A rig recording then no longer needs `gif_creator` in the user's Chrome. (Machine)
- Use the bundled `playwright cli` for exploration steps. It is a daemon CLI with a snapshot and ref model, console, requests, request fakes, dialogs, emulation, and video. It runs the system Chromium headless on a temporary profile with one environment variable. One step printed 1 to 370 bytes. Keep one-off scripts for before and after captures and for timing. (Machine, Source)
- Chrome DevTools MCP, agent-browser, Lightpanda, chromedp, rod, Puppeteer, and the Claude desktop browser each fail at least one need of the skill, or add an install for no gain. Chrome DevTools MCP has one use that Playwright lacks: performance traces and Lighthouse. That use is optional. (Source)
- The production host stays on Claude in Chrome. No candidate gives a better way to use the user's sign-in. (Inference)

---

## 1. What the browser step needs

Source: `skills/field-test/references/browser.md` at this repo `18b4786`. The step needs these things on a local rig:

- Headless, and isolated from the user's Chrome profile.
- The system Chromium, with no browser download (rule in `browser.md`, "Do not install Playwright or download a browser during a run").
- Observables: DOM text and attributes, console messages, network requests, request fakes (`page.route()`), dialog dismissal, service-worker control, the SSE stream on `/api/stream`.
- Viewport, `isMobile`, `hasTouch`, and dark theme.
- Before and after screenshots with the same viewport and the same clip rectangle (`~/github/soup/dotfiles/agents/docs/browser.md`).
- A recording when a person needs one. Today the only path is `gif_creator` in the user's Chrome, where the tab is hidden and timers slow down.

The recorded pain points: an ES module ignores `NODE_PATH`, so scripts must be `.cjs` with a derived `NODE_PATH`. `recordVideo` is off because it needs an ffmpeg that Playwright downloads.

Project facts (Machine, read from each `web/package.json`):

- qui and autobrr use Vitest 5 with jsdom. Neither has Playwright or Vitest browser mode.
- dashbrr has `@playwright/test` `^1.63.0` and a `test:browser` script with a desktop and a Pixel 7 project (`web/tests/browser/playwright.config.ts`).
- netronome has no test browser.
- qui has a Workbox service worker (`VitePWA`, `registerType: "autoUpdate"`) and a `width=device-width` viewport tag.

Inference: Playwright is already the browser tool in one of soup's projects. A switch would split the tools.

## 2. Playwright 1.64.1, as installed

### 2.1 What the release ships

Source, Playwright release notes (`microsoft/playwright`, tag `v1.64.1` = `cfe490d`, 2026-10-14):

- v1.58.0 (2026-01-23) adds "a new token-efficient CLI mode of operation".
- v1.59.0 (2026-04-01) adds `page.screencast`, with `start({ path })`, `start({ onFrame })`, and action overlays.
- v1.62.0 (2026-07-24): "Playwright now bundles the Playwright MCP server and `playwright-cli`, runnable via `npx playwright mcp` and `npx playwright cli`."
- v1.64.0 (2026-10-07): "Videos are encoded with VP9 instead of VP8". New `fps` option for `recordVideo` and `screencast.start()`.
- License Apache-2.0. Releases about once a month.

Machine: `playwright --help` in 1.64.1 lists `cli`, `mcp`, `trace`, `show-trace`, and `init-skills`. The bundled agent skill is at `playwright-core/lib/tools/skills/playwright-cli/SKILL.md`, with references for request mocking, tracing, and video.

Source: the npm package `@playwright/cli` 0.1.22 depends on `playwright` `1.64.0-alpha-1790635538000` (`npm view`, 2026-10-27). Inference: the standalone package and `playwright cli` are the same tool. The skill needs no extra install.

### 2.2 Load Playwright by absolute path

Machine: both forms below launched `/usr/bin/chromium` and printed `155.0.8059.84`:

```bash
export PW="$(dirname "$(readlink -f "$(command -v playwright)")")/../playwright"
node check.cjs   # const { chromium } = require(process.env.PW)
node check.mjs   # const { chromium } = await import(process.env.PW + '/index.mjs')
```

Inference: this removes the `NODE_PATH` trick and the `.cjs` rule. A static `import ... from '<absolute path>/index.mjs'` also worked.

### 2.3 Video with the system ffmpeg

Source, `playwright-core` 1.64.1 `lib/coreBundle.js`: `VideoRecorder.start()` calls `registry.findExecutable("ffmpeg").executablePathOrDie(...)`. The registry builds the path from the browsers folder and the ffmpeg revision in `browsers.json`, which is `1013`. The bundle reads no environment variable for an ffmpeg path. The encoder arguments are `-f matroska ... -c:v libvpx-vp9`.

Machine:

- `~/.cache/ms-playwright` holds `ffmpeg-1011` from an older Playwright, not `ffmpeg-1013`. `recordVideo` and `screencast.start({ path })` both failed with `Executable doesn't exist at /home/soup/.cache/ms-playwright/ffmpeg-1013/ffmpeg-linux`.
- `/usr/bin/ffmpeg` has the `libvpx-vp9` encoder.
- With a scratch folder that holds one symlink, both calls wrote a VP9 `.webm` at 640x360:

```bash
mkdir -p "$SCRATCH/pwb/ffmpeg-1013"
ln -sf /usr/bin/ffmpeg "$SCRATCH/pwb/ffmpeg-1013/ffmpeg-linux"
PLAYWRIGHT_BROWSERS_PATH="$SCRATCH/pwb" node check.mjs
```

Source, Playwright docs (playwright.dev/docs/browsers, read 2026-10-27): `PLAYWRIGHT_BROWSERS_PATH` tells Playwright where to look for browsers. It "does not change installation path for Google Chrome and Microsoft Edge".

Inference: the folder works because the script gives `executablePath`, so Playwright does not look for Chromium in that folder. The revision number changes with Playwright releases. Read it from `browsers.json` (`"name": "ffmpeg"`) at run time. This is a workaround that the docs do not describe. Treat it as fragile.

Machine: `page.screencast.start({ onFrame })` needs no ffmpeg. It delivered 30 to 32 JPEG frames in 1.5 s. A script can pipe the frames into `/usr/bin/ffmpeg`.

### 2.4 Chrome's own recorder, no ffmpeg

Source, Chrome DevTools Protocol (`ChromeDevTools/devtools-protocol` `ebca906`, `pdl/domains/Page.pdl`): `experimental command startScreenRecording` takes `maxWidth`, `maxHeight`, and `frameRate`, and returns an `IO.StreamHandle`. `stopScreenRecording` returns the stream handle. Puppeteer 25.16.0 builds `page.record()` on it and says it "outputs mp4 video stream" (`docs/api/puppeteer.page.record.md`).

Machine: through a Playwright CDP session on headless Chromium 155, `Page.startScreenRecording`, a 2 s wait, `Page.stopScreenRecording`, and an `IO.read` loop wrote an mp4. `ffprobe` read AV1, 640x360, 2.015 s. `/usr/bin/ffmpeg` turned it into a 480 px GIF.

Inference: this path needs no Playwright ffmpeg and no folder trick. It is experimental in the protocol, so a Chromium update can change it. The Playwright ffmpeg path is the fallback.

### 2.5 The bundled `playwright cli`

Source, `playwright-core` 1.64.1 `lib/coreBundle.js`:

- The CLI loads its configuration from `.playwright/cli.config.json` in the working directory, `~/.playwright/cli.config.json`, environment variables, and flags.
- If no profile option is set, `browser.isolated` is true. If `headless` is unset, it is true.
- With no browser name, the channel is `chrome`.
- The CLI reads the same environment variables as Playwright MCP. `PLAYWRIGHT_MCP_EXECUTABLE_PATH` sets the browser binary.

Machine, against a local test page with a service worker, an SSE stream, a `confirm`, console output, and a fetch:

- With `PLAYWRIGHT_MCP_EXECUTABLE_PATH=/usr/bin/chromium`, the browser process was `/usr/lib/chromium/chromium --headless --user-data-dir=/tmp/playwright_chromiumdev_profile-*`. Without it, the process was `/opt/google/chrome/chrome`, also headless on a temporary profile. Neither touched the user's Chrome profile.
- `snapshot` printed a YAML accessibility tree with refs (`e1` to `e6`).
- `console` listed log and error lines with their source.
- `click "#go"` reported the open dialog under "Modal state". `dialog-dismiss` closed it, and the page read "no".
- `route "**/api/data*" --body='{"fake":true}'` faked the response. `requests` listed the call.
- `--raw eval` read the SSE text ("event 19") and the service-worker count (1).
- A config file with `viewport` 390x844, `isMobile`, `hasTouch`, `colorScheme: "dark"`, and `serviceWorkers: "block"` applied. The page reported dark mode and touch, and the console showed "Service Worker registration blocked by Playwright".
- `screenshot` has no clip option. `run-code` with `page.screenshot({ clip })` wrote a 300x200 PNG.
- Output per step was 1 to 370 bytes. The CLI writes snapshots and console logs to `.playwright-cli/` in the working directory. Run it from the scratchpad.
- The first run made two empty folders, `~/.cache/ms-playwright/daemon` and `~/.cache/ms-playwright/b`.

Source, `microsoft/playwright-cli` README (`b1a5903`, 2026-10-19): the CLI is "token-efficient" and "does not force page data into LLM". The README says coding agents favor the CLI over MCP because MCP loads "large tool schemas and verbose accessibility trees" into context.

Source, the bundled `references/running-code.md`: `run-code` runs one function in an isolated context. `require`, `process`, and Node modules are not available.

Inference: the CLI suits steps where the agent does not yet know the selector or the flow. A script suits the before and after pair, a timing run, and anything that needs Node.

### 2.6 Playwright MCP

Source: `playwright mcp --help` (1.64.1) has `--headless` (headed by default), `--isolated`, `--executable-path`, `--viewport-size`, `--device`, `--block-service-workers`, and `--caps vision,pdf,devtools`. `microsoft/playwright-mcp` v0.0.83 (2026-09-28) depends on the same Playwright alpha as `@playwright/cli`.

Inference: the MCP server covers the same ground as the CLI, but it puts tool schemas in each session. It is headed unless the configuration says `--headless`. On Hyprland a headed window is disruptive. The CLI is the better fit.

### 2.7 Known Playwright limits for this skill

Source, `types.d.ts` 1.64.1:

- `executablePath`: "Playwright only works with the bundled Chromium, Firefox or WebKit, use at your own risk."
- `page.route()` "will not intercept requests intercepted by Service Worker". The docs recommend `serviceWorkers: 'block'` when you use interception.

Source, playwright.dev/docs/browsers: "Playwright doesn't work with the branded version of Firefox since it relies on patches."

Machine: Chromium 155 ran against Playwright 1.64.1, which expects Chromium 156.0.8078.4 (`browsers.json`). `browser.md` records the same pairing as proven on 2026-10-25.

## 3. Chrome DevTools MCP

Source, `ChromeDevTools/chrome-devtools-mcp` (`172656a`, 2026-10-26, latest release v1.12.0 on 2026-10-22, Apache-2.0), `README.md`, `docs/configuration.md`, `docs/tool-reference.md`, `docs/cli.md`:

- MCP server and a `chrome-devtools` CLI. The CLI runs a daemon. "Headless is enabled by default. Isolated is enabled by default unless `--userDataDir` is provided."
- In MCP mode, `--headless` defaults to false and `--isolated` defaults to false. The default profile is `$HOME/.cache/chrome-devtools-mcp/chrome-profile`.
- `--executablePath` takes a custom Chrome. `--viewport` sets the start size.
- Tools: `list_console_messages`, `list_network_requests`, `get_network_request`, `handle_dialog`, `emulate` (viewport with `mobile` and `touch`, `colorScheme`, network and CPU throttling), `take_snapshot`, `take_screenshot`, `evaluate_script` (also in a service worker), `performance_start_trace`, `performance_analyze_insight`, `lighthouse_audit`, `screencast_start` and `screencast_stop` (mp4, the "built-in Chrome recorder"), and heap snapshot tools.
- `take_screenshot` takes a page, a full page, or an element `uid`. It has no clip rectangle.
- No tool fakes a response. `--blockedUrlPattern` and `--allowedUrlPattern` only block or allow.
- "Data collection is enabled by default." Opt out with `--no-usage-statistics` or `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS`.
- The repo depends on Puppeteer 25.16.0.

Source, npm (2026-10-27): v1.12.0 published 2026-10-22, v1.11.0 on 2026-10-15. Under the 7-day rule, only v1.11.0 or older installs today.

Inference: it lacks request fakes and a fixed clip. Those are two needs of the skill. Its traces and Lighthouse audits are the one thing Playwright lacks, and they fit the "Timing UI interactions" section. That is a reason to add it later for timing work, not to replace Playwright.

## 4. Vercel agent-browser

Source, `vercel-labs/agent-browser` (`edb40f1`, 2026-10-26, latest v0.39.4 on 2026-10-26, Apache-2.0), `README.md`, `package.json`, `scripts/postinstall.js`:

- "Browser automation CLI for AI agents. Fast native Rust CLI." It uses CDP with Chrome, and also offers `--engine lightpanda`.
- `--executable-path` or `AGENT_BROWSER_EXECUTABLE_PATH` sets the browser. `--headed` is opt-in. `--profile` reuses a Chrome profile, and `--session` isolates state.
- Commands cover console, `network requests`, `network route --body` (fakes), HAR, `dialog accept|dismiss`, `set viewport`, `set device`, `set media dark`, `screenshot` (full page or annotated), a11y audits, React tree, Web Vitals.
- `record start` needs "ffmpeg on PATH".
- By default, `alert` and `beforeunload` dialogs are accepted on their own.
- The README shows no clip option for `screenshot`.
- The postinstall downloads the native binary from GitHub releases if it is missing.

Source, npm (2026-10-27): 0.39.1 is 119 MB unpacked in 45 files, published 2026-10-13. Six releases came out in October. Only 0.39.1 or older passes the 7-day rule today.

Inference: it covers most observables and uses the system ffmpeg for video. It duplicates what `playwright cli` already gives, with a 119 MB install and a fast release pace. The tarball appears to hold the binaries for all platforms, so `ignore-scripts=true` in `~/.npmrc` probably does not break it. I did not install it to make sure.

## 5. Lightpanda

Source, `lightpanda-io/browser` (`0251ef8`, 2026-10-27, latest 1.0.2 on 2026-10-23, AGPL-3.0), `README.md`:

- "No graphical rendering engine". `--dump png` gives "a text-only rendering of the page".
- Implemented: DOM, JavaScript (V8), XHR and Fetch, CDP and WebDriver BiDi, network interception, cookies.
- "By default, Lightpanda collects and sends usage telemetry."

Inference: with no real rendering, it cannot take a screenshot of a layout change. The README does not list service workers or EventSource. It fails the skill's capture need.

## 6. chromedp and rod (Go)

Source, `chromedp/chromedp` README (`7862adf`, v0.21.0 on 2026-10-11, MIT): headless by default. The examples repo covers interception with the Fetch domain, console, dialogs, element and page screenshots, device emulation, and a screencast that "saves the frames of a page as JPEG files".

Source, `go-rod/rod` (`d38c753`, MIT): the latest release is v0.116.2 from 2024-07-12. The README lists `HijackRequests` and a launcher that can "find or download" a browser.

Inference: chromedp covers the observables, but each question needs a Go program with a `go.mod`. It has no snapshot and ref model, so the agent writes more code per step. The skill's scripts are throwaway, and Go adds a build step to each one. Rod has had no release in over two years. Neither beats the installed Playwright.

## 7. Puppeteer and Firefox

Source, `puppeteer/puppeteer` (`1581677`, v25.16.0 on 2026-10-22, Apache-2.0):

- `page.record()` uses `Page.startScreenRecording` and outputs mp4 (section 2.4).
- The `puppeteer` package downloads Chrome in a postinstall script. If the package manager blocks scripts, "running Puppeteer will throw an error: `Could not find Chrome`". `puppeteer-core` downloads nothing.
- Puppeteer drives Firefox over WebDriver BiDi, which is the default protocol for Firefox (`docs/webdriver-bidi.md`).

Inference: Puppeteer is close to Playwright in scope, and it is not installed. Its one extra is the system Firefox over BiDi. The skill has no Firefox case. Playwright can reach the same mp4 recorder through a CDP session (section 2.4).

## 8. Claude's own browsers

Source, Claude Code docs, "Use Claude Code with Chrome" (code.claude.com/docs/en/chrome, read 2026-10-27): Claude Code drives the user's Chrome or Edge through the Claude in Chrome extension. It "shares your browser's login state". "Browser actions run in a visible Chrome window in real time." It records GIFs. The page names no headless or isolated mode.

Source, the `built-in-browser` skill on this machine: the built-in browser is a pane in the Claude desktop app, for "Cowork in the Claude desktop app". It keeps "its own persistent profile, shared across the desktop app's sessions".

Inference: neither is headless or isolated per run. The built-in browser is for the desktop app, not a Claude Code CLI session on this machine. Claude in Chrome stays the tool for the production host.

## 9. Comparison

| Need | Playwright script | `playwright cli` | DevTools MCP | agent-browser | Lightpanda | chromedp |
|---|---|---|---|---|---|---|
| Installed now | yes | yes | no | no | no | no (Go module) |
| System Chromium, no download | yes | yes, env var | yes, flag | yes, flag | n/a | yes |
| Headless and isolated | yes | yes, default | CLI default, MCP opt-in | headless default | yes | yes |
| Console, requests | yes | yes | yes | yes | partial | yes |
| Request fakes | yes | yes | no | yes | interception | yes |
| Dialogs | yes | yes | yes | yes | not stated | yes |
| Viewport, mobile, touch, dark | yes | config or `--device` | yes | yes | n/a | yes |
| Fixed clip screenshot | yes | via `run-code` | no | not stated | no rendering | yes |
| Video | ffmpeg folder or CDP mp4 | ffmpeg folder | mp4, no ffmpeg | ffmpeg on PATH | no | JPEG frames |
| Traces, Lighthouse | Playwright trace | trace | yes | trace, vitals | no | no |

The "Video" cell for `playwright cli` is an inference from the shared code in section 2.3. I did not run `video-start`.

## 10. Recommendation

Keep Playwright and change how the skill calls it. Do not install a new tool for the rig.

Proposed changes to `skills/field-test/references/browser.md`. This note does not edit the skill.

1. Replace the `NODE_PATH` command and the `.cjs` rule with an absolute path. Set `PW="$(dirname "$(readlink -f "$(command -v playwright)")")/../playwright"`. Load it with `require(process.env.PW)` in `.cjs`, or `await import(process.env.PW + '/index.mjs')` in `.mjs`.
2. Replace "Leave `recordVideo` off" with a recording recipe for the rig. First choice: `Page.startScreenRecording` through `page.context().newCDPSession(page)`, an `IO.read` loop to an mp4, then `/usr/bin/ffmpeg` to a GIF if a person needs one. Fallback: a scratch `PLAYWRIGHT_BROWSERS_PATH` folder with `ffmpeg-<rev>/ffmpeg-linux` linked to `/usr/bin/ffmpeg`, where `<rev>` comes from `playwright-core/browsers.json`. Keep `gif_creator` for the production host only.
3. Add a short `playwright cli` section for exploration. Run it from the scratchpad with `PLAYWRIGHT_MCP_EXECUTABLE_PATH=/usr/bin/chromium`. Use a named session (`-s=<name>`), `snapshot`, `console`, `requests`, `route`, `dialog-dismiss`, and `--raw eval`. Put viewport, `isMobile`, `hasTouch`, `colorScheme`, and `serviceWorkers` in a `--config` file. Use `run-code` for a clip screenshot. End with `playwright cli close-all`.
4. Add `serviceWorkers: 'block'` to the context when a script uses `page.route()`, unless the service worker is under test. Playwright's docs say routes miss requests that a service worker handles.
5. Extend the cleanup check. Also run `playwright cli list` and make sure that it shows no open session.
6. Leave the production host section as it is.

Optional, later: if the timing section needs traces or Lighthouse, add Chrome DevTools MCP v1.11.0 or older as a CLI with `--no-usage-statistics`. That is a new global install, so it needs the user's approval.

## 11. Not verified

- `playwright cli video-start` with the ffmpeg folder. I tested the script API only.
- agent-browser, Chrome DevTools MCP, Lightpanda, chromedp, and Puppeteer on this machine. All claims about them come from their docs.
- Whether the agent-browser npm tarball works with `ignore-scripts=true`.
- How long `Page.startScreenRecording` stays in Chromium. It is marked experimental.
- Token counts. The byte counts in section 2.5 are output sizes, not tokens.
- A run against a real qui rig. I used a small local test page with the same features (service worker, SSE, `confirm`, fetch).
