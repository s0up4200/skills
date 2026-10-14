---
name: field-test
effort: high
description: Run a code change live and prove the behaviour it touches, either on a local rig of stubs or on the user's production qui server, then clean up. Covers backend changes through the API and frontend changes through the real browser (Claude in Chrome, device emulation, service-worker traps, screenshots). Use whenever the user says "field test", "test it live", "try it on prod", "pull the PR image", "prove it on the server", "run it against real trackers", "spin up a mock indexer", "stub qbit", "check it in the browser", "does the UI actually work", or a repo rule asks for a live run before a change is reported complete. Also use it when the question is how many requests qui sends to qBittorrent: "count the calls", "is qui hammering qbit", "fewer requests", "is the WebUI saturated", "does this batch the fetch", or any PR that claims fewer or batched qBittorrent calls. Also use when a PR body owes a live verification, or when the user asks whether a fix "actually works" against a real qBittorrent, autobrr, Prowlarr, Sonarr, or Radarr. Covers qui end to end; other projects follow the same shape with their own host facts.
---

# Field test

A field test answers one question: does the change do what the PR says, on the real stack, with real data? Unit tests already proved the code paths. The live run proves the wiring nobody mocked: the image that CI built, the compose file, the database, the real qBittorrent, the real indexers, the real Sonarr.

There are two very different places to run one, and the first decision is which:

- **Local rig.** Stubs and throwaways on the laptop: a qui binary on a spare port, a mock Torznab indexer, a throwaway qBittorrent container (a stub only for large or crafted libraries). Nothing real is reachable, so you can be reckless with data, add and delete torrents freely, and crash things. Use it for crafted indexer responses, migrations against a copied database, anything that must not hit a real tracker, and anything that cannot wait for a CI image. A Windows-only change runs on the same rig under Wine. Recipes in `references/rigs.md`.
- **The production host.** The user's live instance of the project. For qui that is a server with thousands of real torrents, a real qBittorrent, and autobrr, Prowlarr, Sonarr, and Radarr attached. It is the only place that proves the wiring nobody mocked: the CI image, the deployment, the live database, real indexer behaviour, real Sonarr answers, real announces. It is also the user's daily driver. Every action there is visible to trackers or changes data the user cares about, so the rules below are stricter on that side.

Host facts live outside this skill, in `~/.config/field-test/hosts/`, one file per project: addresses, the SSH form, the deployment, data paths, the credential policy, quirks, and request-count baselines. They describe the user's private network, and this skill is public, so they stay in that folder. List the folder and read the file for the project before the first remote command. If the folder or the file is missing, or a host file says a fact is missing, ask the user and write the answer into a host file there; do not guess a path or an address.

Pick the local rig whenever it can answer the question. Go to the production host when the question is about real data or real integrations, or when the PR body owes a live proof. Say which mode you are in when you report.

The whole skill rests on three habits. Pick the observable before touching anything. Change one thing at a time and know what is running. Leave the server as you found it, and be able to prove that.

## 1. Pick the observable first

Before any SSH, write down the cheapest signal that fails if the change is broken. One or two lines. Examples:

- A request parameter in Prowlarr's history (`season=4&ep=15` next to `tvdbid`).
- A JSON field in an API response (`matchReason` contains `mapped episode`).
- A log line with a known message and a value (`episodeMap` on the ID-lookup success line).
- A database row (`arr_id_cache.episode_map_known = 1` for the hash).
- A count that must close arithmetically (sidebar tracker counts equal filtered totals).

Then write the negative: what does the same observable show on the old build? If you cannot name a difference, the field test cannot prove anything, so say so and stop. When the change is a performance claim, read `references/method.md` before you measure; closed-loop load and single samples fake results.

Two more checks on the observable itself, both cheap and both easy to skip:

- Make sure a pre-existing path cannot produce the same green. A byte-equal announce size passes the exact-size fallback with or without an episode map, so that run proves nothing about the map; a rounded size inside the tolerance does. Pin the field that only the new path sets, such as a match class or a reason prefix, not just the pass/fail bit.
- Name the stop gate: the one observable that, if it flips the wrong way, blocks the PR rather than adding a caveat. For a matcher change that is usually the neighbour case the design rejected (the next episode must still be a mismatch). Run it as a control, and treat a wrong answer there as the headline, not one row among many.

When the claim is about how many calls qui makes to qBittorrent, count the requests; do not time them. A per-hash burst at 50-wide concurrency and one bulk response take about the same wall time, so elapsed fields cannot tell the builds apart. `references/request-count.md` has the gate for when it applies (call-shape claims, changes on the sync, tracker, files, peers, or reannounce paths, go-qbittorrent bumps, saturation reports), the shipped sniffer, and the windows that matter. Do not decide from the diff; the two largest bursts found so far were invisible in any diff. A count needs a paired develop window in the same session, and a steady-state window long enough to cover one scheduled timer, not only the boot burst.

Match the depth to the risk. A log line is enough for a search-shape fix. A migration or a matcher change that adds torrents needs the end-to-end path: the torrent lands in qBittorrent, paused, at the right path.

## 2. Get the build CI made

Never copy a locally built binary into the container. The image tag must describe what runs, or the next pull silently reverts it and "what is running" becomes a guess. The user allowed it once and asked not to do it again.

- For qui, a PR from a branch in the main repo gets `ghcr.io/autobrr/qui:pr-<N>` from the Release workflow. Forks do not push images. Other projects: check the host file, and the repo's release workflow for a `type=ref,event=pr` tag rule.
- Wait for the build: `gh pr checks <N>` or `gh run list --workflow release.yml --branch <branch> --limit 3`.
- Confirm the tag exists before touching the server: `docker manifest inspect ghcr.io/autobrr/qui:pr-<N> >/dev/null && echo built`.
- After the swap, read `org.opencontainers.image.revision` off the running image and compare it with the PR head. PR images build from GitHub's ephemeral merge commit, so the revision is the merge commit, not the branch head; `gh pr view <N> --json mergeCommit,headRefOid` shows both.

## 3. Snapshot, then swap

The steps below are written for a compose deployment with SQLite. A deployment that a GitOps tool such as Flux owns changes the image through its repo instead; its host file says how. The order is the same everywhere.

Order matters:

1. Back up the compose file: `cp compose.yaml compose.yaml.bak-pr<N>`.
2. If the PR adds a migration, snapshot the live SQLite first: `sqlite3 -readonly qui.db ".backup backups/pre-pr<N>-<UTC stamp>.db"`. Migrations are one way. A `develop` image tolerates an extra migration row and extra columns, so an additive migration can be reverted by image alone; a rename or drop needs the snapshot to go back.
3. Repoint `image:` to `ghcr.io/autobrr/qui:pr-<N>`, then `docker compose pull qui && docker compose up -d qui`.
4. Verify: container up, revision label matches, first log lines show the expected version, the UI answers on its usual address.

Record the swap in memory at once (image tag, backup file names, whether the user wants it kept). The user restarts the stack on their own schedule and a forgotten pin has caused a "revert scare" before.

## 4. Drive the behaviour

Use the API, not the UI, unless the change is visual. On a production host, ask the user for a temporary API key at the start; they mint one on request and revoke it afterwards. Never mint one by inserting into the database, and never reuse a key you find lying around without asking. `references/recipes.md` lists the endpoints that field tests reach for most: per-torrent cross-seed search, a search that misses a candidate, webhook check and apply, SSE stream, orphan scan, backup runs, plus how to make synthetic torrents.

Rules on a production host, where the data is real:

- Read before you write. Start with searches, checks, log reads, and read-only database queries. Anything that adds, deletes, moves, rechecks, or relabels a torrent, or writes settings, gets a one-line confirmation from the user first, with the exact target named. The user's real torrents are seeding for real trackers; a wrong delete or a stray recheck is not undone by reverting the image.
- Prefer a synthetic torrent for the trigger, built with a name the repo rule allows (real title and group tag, invented release). Real library torrents are fine to search against and match against; never publish their names, tracker URLs, or save paths anywhere outside the session.
- Real trackers see the search, and so do Prowlarr's rate limits. Keep it to the passes the observable needs. Pass `{"cache_mode":"bypass"}` only when a cached response would hide the change; the 7-day search cache serves identical reruns.
- Sonarr and Radarr answer lookups from the real library. A synthetic name still resolves if its title is a real show, which is the point; expect the cached row in `arr_id_cache` to persist past the test.
- One variable per run. If the observable does not appear, check the trivial explanations first: cached response, wrong instance, torrent not at 100%, indexer excluded by content filtering, backoff after a failed login.

On a local rig none of this applies except the naming rule, which is about what gets published, not where it runs.

## 4b. UI changes need the real browser

A frontend change is not field-tested by curl. Drive the page with the Claude in Chrome tools against a rig or the production host, confirm which bundle the tab is running (the service worker keeps the old one after a swap), read the console and network log, and screenshot from synthetic data. Narrow viewports go through DevTools device emulation that the user toggles, never a window resize. The recipe, the traps, and the observables that work in a browser are in `references/browser.md`; read it before the first browser step.

## 5. Observe and monitor

Grep the log on the remote end. The local shell wraps `grep` as ugrep, which never flushes rare matches on a long-lived pipe, so a local filter looks alive and delivers nothing. Rotated logs are gzipped: `zgrep`.

For anything longer than a single request, arm a monitor and prove it delivers before you report "watching": send a sentinel through the full chain and wait for it to arrive. `references/monitoring.md` has the working recipe (keepalives, reconnect loop, foreground tail, sentinel, cleanup of orphaned remote tails). Three monitors in a row were once reported as watching while silently dead; the user found out by reading the log by hand.

Cross-check the monitor against one known-present pattern whenever you report status. Silence is not evidence.

## 6. Verdict and report

Report the command you ran and the output you saw, quoted, for each observable. Then say plainly what the run did not exercise: a path that needs a natural announce, a size collision that never happened, an indexer that was rate limited. A partial field test reported as partial is useful. A partial field test reported as green is a future incident.

Update the PR body's "How has this been tested?" section with the live result in one or two sentences. Update memory with what was proven and what was left.

If the run made screenshots or recordings, publish them as Evidence: run `brrbin publish --help` and follow it, then put the Evidence link in that section. Only the maintainers can open an Evidence, so a capture of real data can show torrent names, tracker names, and save paths. In each capture, mask passkeys, announce URLs, and API keys.

A screenshot that you attach to GitHub is public. Capture it from a rig filled with synthetic data. If the bug shows only on real data, blur the names, trackers, and save paths before the image leaves the session. Never publish a screenshot with private tracker names, URLs, or real release names on GitHub.

## 7. Clean up, and prove it

Cleanup is complete when nothing from the test is left running or pinned, and you can show it.

Tear down a local rig in the same turn that reads the last observable, also when the test fails or stops early. The rig is every qui binary on a spare port, every stub or mock server, every throwaway container, every scratch worktree for a baseline build, and every browser tab you opened. Unregister the service worker of each rig origin before you close its tab. Teardown is done when the rig ports are free, `docker ps` shows no rig container, and `git worktree list` shows no scratch worktree.

- Delete synthetic torrents from qBittorrent (with files if the rig created them) and any rig files on the host. On a production host, name each one before deleting it so the user can object.
- Kill every process the test started, local and remote. Keep a ledger of process groups and listeners as you create them; a killed SSH session leaves remote zsh wrappers and tails behind. Use `pkill -xf "<exact command line>"`; `pgrep -f` without `-x` matches your own shell and kills the session.
- Revert the compose file to `:develop` and `docker compose pull qui && docker compose up -d qui`, unless the user said to keep the PR image running. A PR image left pinned must be in memory with the reason, and flipped back after the PR merges.
- Leave DB snapshots in place; note their names and sizes so the user can delete them after the merge.
- Tell the user the temporary API key can be revoked.
- Watch the log for one polling interval after cleanup and confirm it stays quiet.

Report the cleanup evidence in the same message as the verdict.
