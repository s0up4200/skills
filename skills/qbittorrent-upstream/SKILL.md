---
name: qbittorrent-upstream
description: Audit unreleased qBittorrent changes (master versus the latest release tag in ~/github/oss/qBittorrent) and map each WebAPI or WebUI session change onto the work go-qbittorrent and qui need before the next qBittorrent release. Use when the user asks what changed upstream in qBittorrent, what to adapt for qBittorrent 5.3 or any future version, whether go-qbittorrent or qui already handle a new endpoint, field, or parameter, or asks for a WebAPI drift or compatibility check. Also use when a qBittorrent alpha, beta, or release candidate is announced.
---

# qBittorrent upstream audit

qBittorrent development moves fast and the WebAPI wiki lags the code. The controllers under `src/webui/api` are the source of truth, and the git log on a small set of paths is the whole signal. This skill turns that log into a per-consumer work list for go-qbittorrent and qui.

## Steps

1. **Resolve the range.** Head is `origin/master` unless the user names one. For the base, ask which release the consumers were last brought up to date with, and skip the question only when the user already named a base or a range.

   Ask rather than assume, because the base is a fact about the consumer repos that upstream git cannot answer. The newest tag is the tempting default and the wrong one: the day 5.3.0 is tagged, every unadapted 5.3 change falls behind that base and drops out of the report, while a handful of early 5.4 commits keep the range looking healthy rather than empty. Silent under-reporting is the one failure this skill cannot afford.

   Offer the newest few stable `release-X.Y.Z` tags with the `API_VERSION` each one shipped, so the choice is informed:

   ```bash
   for t in $(git tag --list 'release-*' | grep -E '^release-[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -4); do
       printf '%s  API_VERSION %s\n' "$t" "$(git show "$t:src/webui/webapplication.h" | sed -n 's/.*API_VERSION {\(.*\)};/\1/p' | tr -d ' ' | tr ',' '.')"
   done
   ```

   When the user does not know, take the older of the two newest stable tags. Over-reporting costs one re-read of work already done; under-reporting hides a breaking change until users find it.

   Pre-release tags (`release-5.3.0beta1`) sit on master, so a pre-release is never a base. Pass one as head when the user asks about a specific alpha, beta, or rc.

2. **Collect the material.** Run the bundled script into the scratchpad. It fetches `master` and tags first unless `NO_FETCH=1`.

   ```bash
   scripts/upstream-diff.sh <scratchpad>/qbt-upstream <BASE> [HEAD]
   ```

   It writes `summary.md` (range, `API_VERSION` diff and bump commits, lines added to `WebAPI_Changelog.md` and `Changelog`, commit lists per watch path), `api, and the commit list for the bundled WebUI.patch` (every patch on the WebAPI surface).

3. **Read every commit in `api.patch`.** Read the whole patch, not the commit subjects. Subjects like "Revamp .torrent files backup management" hide new parameters, and a Changelog line marked FEATURE can carry a WebAPI change with no WEBAPI prefix. Upstream keeps `WebAPI_Changelog.md` by hand and it links each change to its PR, so use it to attach PR numbers and versions, but it misses changes (the required `shareLimitsMode` parameter never got an entry). The patch is the truth, the changelog is the index. `api.patch` runs to thousands of lines, so read it in chunks and use the `commit <sha>` markers as boundaries rather than trying to load it whole. For each commit note:
   - what changed: new endpoint, new parameter, renamed or removed parameter, new JSON key, changed response shape, changed default, auth or session behaviour, `API_VERSION` bump
   - which WebAPI version it lands in (the `API_VERSION` value after the bump commit that follows it)
   - the PR number from the Changelog line when one matches

   When the C++ leaves a parameter's meaning unclear, read the bundled WebUI for that commit (`git show <sha> -- src/webui/www/private`). It is the reference client.

4. **Map and verify.** Use the table below to name the go-qbittorrent and qui locations for each change, then check the consumer code instead of assuming. `grep` the JSON key in `domain.go`, the endpoint path in `methods.go`, and then the raw wire key (`skip_checking`, `shareLimitsMode`) across qui `internal/`, not only the go-qbittorrent method name: qui builds option maps by hand in several services (cross-seed, dirscan, backups, automations) and a fix inside go-qbittorrent's `Prepare()` does not reach those call sites. A change is already handled when the consumer references it; say so and cite the commit or line. The consumers sometimes adapt from master before the release, so "already done" is a normal outcome.

5. **Write the report.** Save it as Markdown to the path the user names, or to `<scratchpad>/qbt-upstream-report.md` beside the raw material rather than inside it, and give the summary in chat. Use this structure:

   ```markdown
   # qBittorrent upstream: <base> -> <head> (<short sha>, <date>)

   API_VERSION <old> -> <new>. <N> WebAPI commits, <M> bundled WebUI commits.
   Newest release both consumers fully handle: <tag>.

   ## go-qbittorrent
   ### Breaking
   - <change> — qbt <sha> (#PR), WebAPI <ver>. <file:symbol> to touch.
   ### New
   - ...
   ### Already handled
   - <change> — handled in <consumer sha or file:line>

   ## qui
   (same three groups)

   ## No consumer action
   - <sha> <subject> — <one-line reason>
   ```

   Mark an item `gate` when the consumer needs a version check to keep working against older servers. The group and the named file already say what shape the work is, so nothing else needs a tag.

## Done when

Every commit in `api.patch` appears in the report exactly once: under a consumer with a concrete file to touch, under "Already handled" with the evidence, or under "No consumer action" with a reason. A commit that is missing from the report is the failure mode this skill exists to prevent.

## Judgement calls

- **A release does not clear the work.** The report tracks what the consumers have not adapted to, not what upstream has not shipped. A breaking change stays in the report after its release is tagged, and stays there every run until the consumer code references the new spelling. Report an item as done only on evidence in the consumer repo, never because the release that carried it is out.
- **Cherry-picks and backports.** The script removes patches already in the base tag. A commit that also landed in a point release after the base tag (for example in 5.2.4 while the base is 5.2.3) is still new relative to the base and stays in the report. Say when it is already released.
- **A rename inside upstream can fake a behaviour change.** `56bf1d0f7` renamed the `Http::METHOD_POST` constant, so 80 lines of the POST-only endpoint table in `webapplication.h` show up as additions in a commit titled "Allow to download completed files". Read the removed lines beside the added ones before concluding that an endpoint changed method or gained a restriction.
- **Renames upstream are breaking for the library, not for users.** Follow the precedents at the end of this file: pick the name by WebAPI version rather than dropping support for older servers. qui users run every version from 4.x up.
- **Scope.** rls is a release-name parser and qBittorrent changes do not reach it. Only report on go-qbittorrent and qui unless the user names another consumer.
- **Do not open issues or PRs.** The report is the deliverable. The user decides what to file.

## Where an upstream change lands

Verified against the checkouts on 2026-09-06. The code is the truth; re-check a path with `grep` before citing it.


| Upstream change | Where to look upstream | go-qbittorrent | qui |
|---|---|---|---|
| New key in torrent JSON | `src/webui/api/serialize/serialize_torrent.cpp` (`KEY_TORRENT_*`) | Add the field with the same `json` tag to `Torrent` in `domain.go`, then `go generate ./...` so `maindata_updaters_generated.go` and `filter_generated.go` follow. `TestAllGeneratedFilesAreUpToDate` fails when they drift. | `web/src/types/torrents.ts` `Torrent` interface, then any column, filter, or detail view that should show it. |
| New action on an existing controller | `src/webui/api/*controller.h` (`void xxxAction();`) and the matching `.cpp` | New method in `methods.go`, plus the `// Requires qBittorrent vX (WebAPI vY)` comment the file already uses. | `internal/qbittorrent/client.go` has `xxxMinVersion = semver.MustParse(...)` gates. Add one when the UI must hide the feature on older instances, and expose it through `internal/api/handlers/capabilities.go` and `web/src/hooks/useInstanceCapabilities.ts`. |
| New or renamed parameter on an existing action | The `params()` reads in the controller `.cpp` | Same method in `methods.go`. Precedent for a rename gated on version: `editTracker` on WebAPI 2.13+ (commit bba918d). | Callers of that go-qbittorrent method under `internal/`. |
| Removed or deprecated action or parameter | Controller `.cpp` and `.h` | Breaking for callers. Keep the method, gate on version, or drop it with a note. | Every caller under `internal/` and the proxy, since third-party clients also hit these through qui. |
| New app preference key | `src/webui/api/appcontroller.cpp` (`preferencesAction` and `setPreferencesAction`) | `AppPreferences` in `domain.go`. | `internal/qbittorrent/preferences.go` and the forms in `web/src/components/instances/preferences/`. |
| Sync payload shape (`maindata`, `torrentPeers`) | `src/webui/api/synccontroller.cpp` | `maindata.go`, `peersync.go`, `sync.go`. Partial-update merge logic lives in `maindata.go`. | `internal/qbittorrent/maindata.go`, `sync_manager.go`, and `internal/proxy/handler.go` `handleSyncMainData`, which rewrites maindata for proxied clients. |
| Auth, session, cookie, or session limits | `src/webui/api/authcontroller.cpp`, `src/webui/websession.cpp`, `src/webui/webapplication.cpp` | `http.go` login and cookie handling. | `internal/proxy/handler.go` (`SID` cookie, `applyAuthHeaders`), `internal/qbittorrent/pool.go` health checks, `internal/qbittorrent/auth_errors.go`. |
| API_VERSION bump | `src/webui/webapplication.h` | Version comments on the methods the bump covers. | Semver constants in `internal/qbittorrent/client.go` if a feature gate is needed. |
| Client data storage (`clientdatacontroller`) | `src/webui/api/clientdatacontroller.cpp` | Usually nothing. It stores WebUI client preferences server-side. | Nothing unless qui starts using it. |
| Bundled WebUI JS (`www/private/scripts`) | Read only to learn how the official UI calls a new endpoint or parameter. | Nothing directly. | Nothing directly. qui ships its own frontend. |

## Precedents worth copying

- `bba918d` in go-qbittorrent: parameter name changed upstream, the client picks the name by WebAPI version instead of breaking old servers.
- `eb1f3ca` in go-qbittorrent: upstream changed the response body of torrent add; the client accepts both shapes.
- qui `subcategoriesAlwaysEnabledMinVersion` (2.15.0): upstream removed a toggle, qui stops showing it above that version instead of failing.
