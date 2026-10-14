# UI changes: drive the real page in Chrome

A frontend change is only field-tested when a real browser rendered it against a real backend. The Claude in Chrome tools do that: open a tab on the target, click, type, read the page, read the console and network log, take screenshots. Load them with one ToolSearch call before the first browser step (`tabs_context_mcp`, `navigate`, `computer`, `read_page`, `tabs_create_mcp`, `tabs_close_mcp`, plus `read_console_messages`, `read_network_requests`, `javascript_tool`, `gif_creator` as the task needs).

## Which backend

- A local rig for anything that adds or deletes data while you click around, and for the PWA and service-worker cases below.
- The production host (the web address is in the host file) when the change depends on real library size, real tracker icons, real slow instances, or real SSE traffic. The write rules from the main skill apply: no bulk actions, no deletes, no settings writes without a one-line confirmation. Selecting rows and opening dialogs is reading; pressing the destructive button is not.

## Start every session the same way

1. `tabs_context_mcp` first, then a new tab; never reuse a tab id from another session.
2. Confirm which build the tab runs before judging anything. The PWA service worker precaches the JS chunks, so after an image swap or a local binary swap on the same port the open tab keeps the old bundle and makes zero network requests. `curl -s <base>/ | grep -o 'assets/index-[^"]*'` names the served bundle; compare with what the tab loaded (network log, or `performance.getEntriesByType('resource')`). If they differ, unregister the worker and clear caches via the javascript tool, then hard-reload.
3. A POST, PUT, PATCH, or DELETE that you send with `fetch` from page JavaScript uses the session cookie, so it needs the header `X-Requested-With: XMLHttpRequest`. Without it qui answers 403 `Missing X-Requested-With header`.
4. Full-URL navigation resets the react-query cache. A repro that needs warm client state must navigate in-app: click a link, or `document.querySelector('a[href="/backups"]').click()` when a ref click does not fire.

## The tools do not take over the screen

A reasonable worry on a tiling WM is that a browser run seizes the display and the keyboard.
Measured on this machine, it does not. A screenshot does not activate the tab it captures, does
not raise the Chrome window, and does not change which window holds keyboard focus; a terminal
kept focus through a full capture, click, and type sequence. Clicks and typing go in through the
debugger, not through the real pointer and keyboard, so they land on the page whatever the user
is doing elsewhere.

So do not move, resize, or float the Chrome window to get it out of the way. There is nothing to
get out of the way, and the window that would move is the user's daily driver with all their
tabs in it.

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

Do not resize or float the Chrome window; the tiling WM ignores it. Ask the user to toggle
DevTools device emulation (Ctrl+Shift+M) on the tab and wait for their "done", then continue.
Landscape phone, folding-phone outer screen, and iOS keyboard cases need a real device; say so in
the verdict rather than approximating.

## Observables that work in the browser

- The element itself: `read_page` or `find` for the text, attribute, or class the change added; a screenshot for layout.
- Console: `read_console_messages` with a `pattern` for the app's own log prefix or the error text. A React key warning or an uncaught error is a fail even when the page looks right.
- Network: `read_network_requests` for the request the change was supposed to shape (query string, body, status) and for the SSE stream (`/api/stream`) staying open.
- Client state: the react-query client is reachable by walking React fibers from `#root` for a `memoizedProps.client` with `getQueryCache`; `findAll` with a predicate lists keys, which is how a cache-collision bug was reproduced once.
- Toasts: `[data-sonner-toast]` with `data-type`.

## Screenshots for the PR

Publish the captures as Evidence: run `brrbin publish --help` and follow it, then put the Evidence link in the PR body. Only the maintainers can open an Evidence, so a capture of the real library can show torrent names, tracker names, and save paths. In each capture, mask passkeys, announce URLs, and API keys.

A screenshot that you attach to GitHub is public. Capture it from a rig filled with synthetic torrents. If the bug shows only on the real library, blur the name, tracker, and save-path columns before the image leaves the session. Never publish a screenshot with private tracker names, URLs, or real release names on GitHub.

## Dialog traps

- Do not click anything that opens a native `confirm` or `alert`; it blocks the extension. Check for such handlers first and drive the underlying action through the API instead, or ask the user to click.
- A `FieldHelp` trigger inside a dialog can be the first focusable element, so the first Tab or Enter may open help instead of the field you meant. Click the field explicitly.

## Cleanup

Close the tabs you opened, unregister a service worker you registered on a local rig, and delete synthetic torrents through the API rather than through the UI's delete dialog (see the dialog trap).
