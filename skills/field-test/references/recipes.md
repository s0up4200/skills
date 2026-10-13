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

- Torrent list with the qBittorrent sync out of the path: `GET /api/instances/{id}/torrents?prefer=cache`. Use it when timing list code; without it qBittorrent network time swamps the delta.
- SSE: `GET /api/stream?streams=<url-encoded JSON array of {instanceId,limit,sort,order}>`.
- Counts oracle: page the whole library out of the API (`limit` caps at 2000) and rebuild counts in Python, then compare with `counts.trackers`. Totals close only when every announce hostname of a tracker is counted; check the arithmetic before calling a mismatch a bug.

## Other services

- Orphan scan: `POST /api/instances/{id}/orphan-scan/scan` starts one; a run in `preview_ready` counts as active, so `DELETE /api/instances/{id}/orphan-scan/runs/{runID}` before the next trigger.
- Instance reconnect after a backoff: `POST /api/instances/{id}/test`.

## Synthetic torrents

Build the name by the repo rule: keep the tokens that matter, invent the title and group, and confirm the invented name still triggers the behaviour before you rely on it.

- Fastest: `mkbrr create <dir> -o <file>.torrent` (Go install of `github.com/autobrr/mkbrr`), then add to qBittorrent with `savepath` and `skip_checking=true` so it seeds at once.
- qBittorrent 5.x can build one itself: `POST /api/v2/torrentcreator/addTask`, poll `/status`, download `/torrentFile?taskID=`. It auto-adds the result; a later `torrents/add` answers `Conflict` and can be ignored. It ignores the `trackers` parameter, so attach trackers afterwards with `POST /api/v2/torrents/addTrackers`.
- Media files that must carry metadata: `ffmpeg -f lavfi -i testsrc -t 2 -metadata IMDB=tt... -metadata TMDB=movie/... out.mkv`.
- Delete with files when the rig created them: `POST /api/v2/torrents/delete` with `deleteFiles=true`.

Local docker on the laptop needs `sudo setfacl -m u:$USER:rw /var/run/docker.sock` first (the user runs it with `!`); it lasts until the daemon restarts.
