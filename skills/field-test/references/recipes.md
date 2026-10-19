# Endpoints and rigs that field tests reach for

All qui calls take `X-API-Key`. Substitute the address from the host file or the local rig.

## Cross-seed

- Per-torrent manual search: `POST /api/cross-seed/torrents/{instanceID}/{hash}/search` with an optional body `{"indexerIds":[...],"cache_mode":"bypass"}`. The response carries `decisionTrace` with per-candidate reject reasons and per-indexer outcomes, and each result's `match_reason` (snake_case in the JSON; the Go field is `MatchReason`).
- `POST /api/cross-seed/search/run` takes categories and tags, not hashes. Wrong tool for a single torrent.
- Webhook check and apply (what autobrr calls): `POST /api/cross-seed/webhook/check` and `POST /api/cross-seed/webhook/apply` with the announced name and size. The check reports ready or skip per instance; a size of 0 exercises the name-only preflight.
- Apply from search results: `POST /api/cross-seed/torrents/{instanceID}/{hash}/apply`. The added torrent lands paused; confirm in qBittorrent and delete it afterwards.
- Candidate missing from a search: send `POST /api/torznab/search` with `{"indexer_ids":[<one id>],"cache_mode":"bypass","query":""}` plus one ID at a time: `imdb_id`, `tvdb_id`, `tmdb_id`, `tvmaze_id`, and then a title in `query`. Compare which request returns the release. Each result carries `publish_date`, `imdb_id`, and `tmdb_id`. Compare `publish_date` with the cache time before you blame the cache. Prowlarr `GET /api/v1/history` shows the IDs and the query that each indexer got. In one real case, a UNIT3D tracker matched all the IDs of a request together, so one wrong TVDb ID on the tracker hid the torrent from the cross-seed search that sends every ID.
- Read the arr cache row: `sqlite3 -readonly qui.db "select * from arr_id_cache order by cached_at desc limit 5"`.

## Streams and lists

- Torrent list with the qBittorrent sync out of the path: `GET /api/instances/{id}/torrents?prefer=cache`. Use it when timing list code; without it qBittorrent network time swamps the delta. It measures the cache-hit path of the counts: no sync runs in the request, so the counts cache hits on nearly every request. A claim about a counts cache miss needs a different rig. With no requests at all, the allocation profile shows the SSE tick path, and subscribers do not show in `qui.log` at the default level.
- SSE: `GET /api/stream?streams=<url-encoded JSON array of {key,instanceId,page,limit,sort,order,filters}>`. The response JSON keys are `counts` and `preferences`.
- Counts oracle: page the whole library out of the API (`limit` caps at 2000) and rebuild counts in Python, then compare with `counts.trackers`. Totals close only when every announce hostname of a tracker is counted; check the arithmetic before calling a mismatch a bug.

## Other services

- Orphan scan: `POST /api/instances/{id}/orphan-scan/scan` starts one; a run in `preview_ready` counts as active, so `DELETE /api/instances/{id}/orphan-scan/runs/{runID}` before the next trigger. `GET .../orphan-scan/runs` returns a bare JSON array. For a scan in remote filesystem mode, use the SFTP rig in `rigs.md`.
- Instance reconnect after a backoff: `POST /api/instances/{id}/test`.

## Dir Scan rig

Proven 2026-09-30: a qBittorrent container, a Python mock Torznab, and qui on a spare port.

- Give each mock item `<enclosure url=... type="application/x-bittorrent"/>`. The native client reads `item.Enclosure.URL`, not `<link>`. Without it, each download fails with "download URL is required".
- The 7-day search cache serves a broken first response again, and no API clears it. Stop qui, then run `DELETE FROM torznab_search_cache; DELETE FROM torznab_torrent_cache;` on the rig database.
- After a run with no match, call `POST /api/dir-scan/directories/{id}/requeue-no-match` or `reset-files` before a new scan. One run can leave a second searchee unsearched (`skippedIndexerSatisfied`). A second scan picks it up.
- Settings: `allowPartial: true`, `minPieceRatio` below the piece ratio, `startPaused: false`. A searchee is one release folder. The mock indexer can return every item for every query.
- Build the torrents in Python with a separate piece for the extra file. Then a corrupt piece in the matched file gives a clean mismatch.

## Synthetic torrents

Build the name by the repo rule: keep the tokens that matter, invent the title and group, and confirm the invented name still triggers the behaviour before you rely on it.

- Fastest: make a file of 1 MiB, run `nice -n 19 env GOMAXPROCS=2 mkbrr create <dir> -o <file>.torrent --workers 1` (Go install of `github.com/autobrr/mkbrr`), then add to qBittorrent with `savepath` and `skip_checking=true` so it seeds at once.
- qBittorrent 5.x can build one itself: `POST /api/v2/torrentcreator/addTask`, poll `/status`, download `/torrentFile?taskID=`. It auto-adds the result; a later `torrents/add` answers `Conflict` and can be ignored. It ignores the `trackers` parameter, so attach trackers afterwards with `POST /api/v2/torrents/addTrackers`.
- Media files that must carry metadata: `ffmpeg -f lavfi -i testsrc -t 2 -metadata IMDB=tt... -metadata TMDB=movie/... out.mkv`.
- Delete with files when the rig created them: `POST /api/v2/torrents/delete` with `deleteFiles=true`.

Local docker on the laptop needs `sudo setfacl -m u:$USER:rw /var/run/docker.sock` first (the user runs it with `!`); it lasts until the daemon restarts.
