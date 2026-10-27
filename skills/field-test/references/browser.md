# UI changes: drive the real page in a browser

A frontend change is only field-tested when a real browser rendered it against a real backend.

## Which backend

- A local rig for anything that adds or deletes data while you click around, and for the PWA and service-worker cases below.
- The production host (the web address is in the host file) when the change depends on real library size, real tracker icons, real slow instances, or real SSE traffic. The write rules from the main skill apply: no bulk actions, no deletes, no settings writes without a one-line confirmation. Selecting rows and opening dialogs is reading; pressing the destructive button is not.

## Which browser

- Local rig: headless Playwright. The run opens no tab in the user's Chrome and leaves no service worker or cookie in their profile. The page reads `visible`, so the hidden-tab traps below do not apply. A script sets the viewport, so a phone width needs no help from the user.
- Production host: the Claude in Chrome tools. The sign-in to the host lives in the user's Chrome, and an agent does not type the password.
- Local rig without Playwright: if `command -v playwright` or `command -v chromium` finds nothing, use the Claude in Chrome tools. Do not install Playwright or download a browser during a run.

Sections marked "Chrome" below apply only to the Claude in Chrome tools.

## Playwright on a local rig

Use a script for each before and after pair, each timing run, and each step that needs Node. Use `playwright cli` (below) to explore a page when you do not yet know the selector or the flow. `docs/research/browser-automation-alternatives.md` in the skills repo compares the other tools and gives the sources.

Write one script per question in the scratchpad, run it, and read what it prints and saves. Proven 2026-10-27 with Playwright 1.64.1 and the Arch `chromium` package:

```bash
PW="$(dirname "$(readlink -f "$(command -v playwright)")")/../playwright" node check.mjs
```

```js
const { chromium } = await import(process.env.PW + '/index.mjs');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
const page = await ctx.newPage();
page.on('console', m => console.log('console', m.type(), m.text()));
page.on('dialog', d => { console.log('dialog', d.message()); d.dismiss(); });
await page.goto('http://127.0.0.1:<port>/');
// drive the page, print the observable, save the captures
await browser.close();
```

- `PW` is the absolute path of the global Playwright package, so the script needs no `node_modules` and no `NODE_PATH`. A `.cjs` script loads it with `require(process.env.PW)`.
- Launch the system Chromium through `executablePath`, so the run never depends on a browser that Playwright downloads.
- A new context starts with no service worker, no cache, and no cookies. Each run loads the bundle that the rig serves now.
- The `dialog` handler dismisses a native `confirm` or `alert`, so the dialog traps of Chrome do not apply.
- `page.route()` answers a request with a fake response. Use it in place of a patch of `window.fetch`. Add `serviceWorkers: 'block'` to the context, unless the service worker is under test: a route does not see a request that the service worker answers.
- To look at a capture, read the saved PNG with the Read tool.

### Recordings

Record with Chrome's own screen recorder through a CDP session. It writes an mp4 and needs no ffmpeg from Playwright. Leave `recordVideo` and `page.screencast.start({ path })` off: they look for an ffmpeg build that Playwright downloads, and the run fails with `Executable doesn't exist at .../ffmpeg-<rev>/ffmpeg-linux`.

```js
const cdp = await page.context().newCDPSession(page);
await cdp.send('Page.startScreenRecording', { frameRate: 25 });
// drive the page
const { stream } = await cdp.send('Page.stopScreenRecording');
const chunks = [];
for (;;) {
  const r = await cdp.send('IO.read', { handle: stream });
  chunks.push(Buffer.from(r.data, r.base64Encoded ? 'base64' : 'utf8'));
  if (r.eof) break;
}
await cdp.send('IO.close', { handle: stream });
(await import('node:fs')).writeFileSync('run.mp4', Buffer.concat(chunks));
```

For a GIF, run `ffmpeg -y -i run.mp4 -vf fps=10,scale=480:-1 run.gif` with the system ffmpeg. `Page.startScreenRecording` is experimental in the protocol. If a Chromium update removes it and the command fails, say so and record with `gif_creator` on a Chrome tab.

### `playwright cli` for exploration

Playwright 1.64.1 bundles a CLI that keeps a headless browser open between commands and prints a few hundred bytes per step. Run it from the scratchpad, because it writes snapshots and logs to `.playwright-cli/` in the working directory:

```bash
export PLAYWRIGHT_MCP_EXECUTABLE_PATH=/usr/bin/chromium
playwright cli -s=rig open http://127.0.0.1:<port>/ --config=cli.config.json
playwright cli -s=rig snapshot          # accessibility tree with refs such as e12
playwright cli -s=rig click e12
playwright cli -s=rig console
playwright cli -s=rig requests
playwright cli -s=rig route '**/api/x*' --body='{"fake":true}'
playwright cli -s=rig dialog-dismiss
playwright cli -s=rig --raw eval 'document.title'
playwright cli close-all
```

- Without `PLAYWRIGHT_MCP_EXECUTABLE_PATH`, the CLI runs `google-chrome-stable` headless. Both use a temporary profile, not the user's.
- The config file sets the context: `{ "browser": { "contextOptions": { "viewport": { "width": 390, "height": 844 }, "isMobile": true, "hasTouch": true, "colorScheme": "dark", "serviceWorkers": "block" } } }`.
- `screenshot` has no clip. For a fixed clip, use `run-code "async page => { await page.screenshot({ path: '<abs path>', clip: { x: 0, y: 0, width: 800, height: 400 } }) }"`. `run-code` has no `require` and no `process`.
- `playwright cli --help` lists the other commands (`fill`, `press`, `tracing-start`, `video-start`).

## Start every Chrome session the same way

Load the Claude in Chrome tools with one ToolSearch call before the first browser step (`tabs_context_mcp`, `navigate`, `computer`, `read_page`, `tabs_create_mcp`, `tabs_close_mcp`, plus `read_console_messages`, `read_network_requests`, `javascript_tool`, `gif_creator` as the task needs). Steps 3 to 5 also apply to a Playwright script.

1. `tabs_context_mcp` first, then a new tab; never reuse a tab id from another session.
2. Confirm which build the tab runs before judging anything. The PWA service worker precaches the JS chunks, so after an image swap or a local binary swap on the same port the open tab keeps the old bundle and makes zero network requests. `curl -s <base>/ | grep -o 'assets/index-[^"]*'` names the served bundle; compare with what the tab loaded (network log, or `performance.getEntriesByType('resource')`). If they differ, unregister the worker and clear caches via the javascript tool, then hard-reload.
3. A POST, PUT, PATCH, or DELETE that you send with `fetch` from page JavaScript uses the session cookie, so it needs the header `X-Requested-With: XMLHttpRequest`. Without it qui answers 403 `Missing X-Requested-With header`.
4. Full-URL navigation resets the react-query cache. A repro that needs warm client state must navigate in-app: click a link, or `document.querySelector('a[href="/backups"]').click()` when a ref click does not fire.
5. Serve a local rig on `127.0.0.1:<port>`, not on `localhost:<port>`. Cookies ignore the port, so a `localhost` cookie from the user's own dev setup goes to the rig too, and it can block or replace a cookie that the rig sets.

## Chrome: the tools do not take over the screen

A reasonable worry on a tiling WM is that a browser run seizes the display and the keyboard.
Measured on this machine, it does not. A screenshot does not activate the tab it captures, does
not raise the Chrome window, and does not change which window holds keyboard focus; a terminal
kept focus through a full capture, click, and type sequence. Clicks and typing go in through the
debugger, not through the real pointer and keyboard, so they land on the page whatever the user
is doing elsewhere.

So do not move, resize, or float the Chrome window to get it out of the way. There is nothing to
get out of the way, and the window that would move is the user's daily driver with all their
tabs in it. The one exception is a phone-width view when the user tells you to float the window;
`~/github/soup/dotfiles/agents/docs/browser.md` gives the commands.

Two facts behind that, worth knowing when something looks wrong:

- The test tab opens in whichever Chrome window the extension picks, and that choice cannot be
  steered from the shell. Launching a second Chrome window first does not help: the group still
  landed in the original window. So the tab is a background tab among the user's own tabs. Close
  every tab you opened at cleanup, or you leave litter in the window they work in.
- `document.visibilityState` reads `hidden` for that tab, because it is a background tab in a
  window whose active tab is something else. Take a reading before you draw conclusions if a
  `visibilitychange` handler, a paused poll, or `refetchOnWindowFocus` is part of what you are
  testing.

## Mobile and narrow viewports

In Playwright, set `viewport` on the context, and `isMobile` and `hasTouch` when the change reads touch input.

In Chrome, `~/github/soup/dotfiles/agents/docs/browser.md` covers phone-width views. Ask the user to toggle
DevTools device emulation (Ctrl+Shift+M) on the tab and wait for their "done", then continue.
Landscape phone, folding-phone outer screen, and iOS keyboard cases need a real device; say so in
the verdict rather than approximating.

## Observables that work in the browser

- The element itself: `read_page` or `find` for the text, attribute, or class the change added; a screenshot for layout.
- Disabled state: `read_page` and `find` can omit it. Read `aria-disabled` or `data-disabled` on the option with `javascript_tool`.
- Console: `read_console_messages` with a `pattern` for the app's own log prefix or the error text. A React key warning or an uncaught error is a fail even when the page looks right.
- Network: `read_network_requests` for the request the change was supposed to shape (query string, body, status) and for the SSE stream (`/api/stream`) staying open.
- Client state: the react-query client is reachable by walking React fibers from `#root` for a `memoizedProps.client` with `getQueryCache`; `findAll` with a predicate lists keys, which is how a cache-collision bug was reproduced once.
- Toasts: `[data-sonner-toast]` with `data-type`.

## Captures for a person

For each visual change (step 4b of the main skill defines it), take a before and an after capture for a person while the page shows the result. Follow the screenshot rules in `~/github/soup/dotfiles/agents/docs/browser.md`. Record the path of each saved file. Step 6 of the main skill publishes these files as Evidence.

## Page traps

- Chrome: Chrome refuses `document.cookie` and `cookieStore.set` on the rig origin, so a session from curl cannot move into the tab. Boot the rig with auth off (rigs.md), or ask the user to sign in on the tab. Do not type a password.
- Chrome: while DevTools device mode is on, each mouse event and screenshot through the debugger times out after 30 s. Click with `javascript_tool` instead. Radix menus open on `pointerdown`, then `pointerup` and `click`. Radix Tabs switch on `mousedown`.
- Type into CodeMirror with `document.execCommand("insertText", false, text)` on `.cm-content`. It skips the auto-close of brackets.
- A raw `localStorage.setItem('qui-filters-<id>', ...)` is lost on reload, because the client settings sync from the server overwrite it. Use the "Clear filters" button or the client settings PUT.
- To read the long tasks of a page mount after a full reload, observe `longtask` with `buffered: true`.
- To test a UI that would start a real run, patch `window.fetch` in the tab. Rewrite the GET that loads the settings, answer the POST that starts the run with a fake response, and answer other writes with 418. Reload the tab afterwards to drop the patch.
- Reload the tab before you patch a global (`fetch`, `Storage.prototype.setItem`) a second time. A second run wraps the first wrapper, so each call logs twice. If the patch keeps the original in a shared global such as `window.__orig`, the second run replaces it with the first wrapper, the wrapper calls itself, and the call fails with "Maximum call stack size exceeded".
- Column resize and the column drag of the torrent table start on `mousedown`, then listen on `document` for `mousemove` and `mouseup`. Drive them with bubbling `MouseEvent`s that carry `clientX` and `clientY`. Pointer events do nothing here, and a dnd-kit drag starts only after the mouse moves more than 8 px. Not yet proven in a browser: if the scripted drag does not move the column, ask the user to drag.

## Timing UI interactions

Proven 2026-10-01 for a before-and-after measurement:

- Build the base in a worktree at the merge base, and run both binaries on separate ports with auth off. Compare the served `assets/index-*.js` names with what the tab loaded.
- Use one tab, and switch between the two origins by navigation. Two tabs got different viewports, which changes render time.
- Chrome: the test tab is hidden. After about 5 minutes hidden, Chrome runs `setTimeout` at most once a minute, and rAF does not run. Yield with a `MessageChannel` message instead, and detect the render with a MutationObserver on the target element.
- Chrome: in a hidden tab, a Radix dialog never unmounts, because its exit animation never ends. Wait for `[role="dialog"][data-state="closed"]`.
- Chrome: a `javascript_tool` call times out at 45 s. Run a long loop in the background, keep the results on `window`, and poll.
- Compare the medians of at least 5 rounds for each build, in mixed order. The median of one build moved from 86 to 106 ms between rounds. A rank test over the samples of all rounds overstates a small gap, because the samples inside one round are correlated.
- A probe changes what it measures. A rAF loop that pushes a sample each frame, or a `MutationObserver` with `subtree: true` on `document.body`, costs real time. One run reported 53 ms long tasks every 2 s that came from the probes. Confirm a number on a clean reload with only a passive `PerformanceObserver`.
- `longtask` reports only tasks over 50 ms, so work near that line appears and disappears. Time the work itself.
- Render work grows with the rows that change, so the activity of the instance changes the result. Record the transfer rate beside each measurement.

## Dialog traps

- Chrome: do not click anything that opens a native `confirm` or `alert`; it blocks the extension. Check for such handlers first and drive the underlying action through the API instead, or ask the user to click.
- A `FieldHelp` trigger inside a dialog can be the first focusable element, so the first Tab or Enter may open help instead of the field you meant. Click the field explicitly.

## Cleanup

Make sure that each Playwright script reached `browser.close()`, that `playwright cli list` shows `(no browsers)`, and that `pgrep -f '[p]laywright_chromiumdev_profile'` finds no browser that either one left. The brackets keep the pattern from matching your own shell. In Chrome, close the tabs you opened and unregister a service worker you registered on a local rig. In both, and delete synthetic torrents through the API rather than through the UI's delete dialog (see the dialog trap).
