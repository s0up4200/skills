# Copies of another system's state

Check each loop or cache that holds a copy of another system's state against these rules: a sync loop or poller over a remote API, an in-memory cache of the database, a memo, a count column, a name copied into another row, the state of a web app that mirrors the server. The app is a follower of the source, so the replication problems of DDIA ch. 6 apply. Also check each delete of files or rows that a scan or an earlier list decides.

Each rule gives what it is, a test at the diff, and the fix. A hit needs a scenario with concrete values: what the source holds, what the copy holds, and what the user sees.

### Snapshot and stream apart

The loop loads a full snapshot and then reads changes, but the two do not start at one position, so the changes in between are lost. Or it ignores the signal that the source sends when it cannot serve a delta (for example a `full_update` flag, or a rejected cursor), and keeps applying deltas to a copy that has drifted (DDIA ch. 6, "Setting Up New Followers": the snapshot must carry an exact position in the source's log).

**Test:** the snapshot carries the source's position (a revision, a sequence number, a `rid`), and the change stream starts there. A cursor that the source rejects, or a full-update flag, causes a full reload of the copy. A wall-clock "last sync" cursor where the source offers a sequence number is a hit.

**Fix:** store the source's position with the snapshot, start the stream from it, and replace the copy in full when the source signals a gap.

### Clock as order

A timestamp decides order, dedupe, or a "since" cursor across hosts: an item's remote `added_on` compared with local `time.Now()`, an RSS `pubDate` watermark, `updated_at` values from two machines in a last-write-wins compare. A remote clock that runs fast, or an item published late, is skipped for good. In Go, `.UTC()`, `.In()`, `.Round()`, JSON, and the database strip the monotonic reading, so `time.Since` on such a value jumps with the wall clock. `Date.now()` in a web app jumps too (DDIA ch. 9, "Monotonic Versus Time-of-Day Clocks", and ch. 10, "ID Generators and Logical Clocks").

**Test:** a timestamp from another host, or from more than one writer, decides order or a cursor. A random ID is a sort key. An elapsed time computed from a value that went through `.UTC()`, `.In()`, `.Round()`, JSON, the database, or `Date.now()`.

**Fix:** use the source's own cursor or a database sequence. When only time exists, read with an overlap window and dedupe by ID. Size the window from the latest arrival that the source allows, and state the lateness that it misses. Measure durations from a `time.Now()` value kept in memory, or from `performance.now()`.

### Copy without owner

The diff stores a value that already lives elsewhere (a cached setting, a count column, a copied name, an in-memory map of rows), and some write path of the source does not update or invalidate the copy. The user saves a setting, and the page shows the old one until the cache expires: "the setting reverts". DDIA ch. 3, "Trade-offs of normalization", treats each copy as derived data that needs a process to keep it updated, and ch. 6 names the guarantee that a user expects: read-your-writes.

**Test:** for each new copy, name its source, then find each path that writes the source (create, rename, delete, sync, import). Each one must update or invalidate the copy. Or the next read after a user's write must bypass the copy, or wait for a version at least as new as the write. A copy whose staleness the diff does not state is a hit.

**Fix:** make each write path invalidate the copy, or store the source's ID in place of the copied value. A read that fetched the source before an invalidation must not store its result after it: keep a version for each key, and store a fill only when the version did not change since the read started. State the staleness that a user can see, and record the time of the last good sync so that staleness shows.

**Against APOSD:** a caching decorator around a read method is shallow, and it cannot see the writes. The module that owns the writes owns the cache, so that each write path invalidates it in one place.

### Lost deletes

A sync or a merge has no rule for removals. An upsert-only sync, or a union merge of two lists, brings a deleted item back (DDIA ch. 6, the shopping cart whose removed item comes back). The opposite failure: the sync deletes each local row that is missing from the fetched list, and the fetch returned an empty or partial list during a restart or an error, so all local rows go.

**Test:** for each merge of collections, name what removes an item: the source's removal list (for example `torrents_removed`), a tombstone, or one side that is replaced in full. For each delete that comes from absence in a fetched list, check that the code tells "empty" apart from "failed or partial", and holds a delete that is far larger than the last run's.

**Fix:** apply the source's removals, or replace the copy in full from a complete answer only. Before a mass delete, compare its size with the last run, and hold it when it is too large. Show the held delete where the user sees it, and apply it when the user confirms it.

**Against APOSD:** a setting for the threshold pushes the decision up to each user. Compute the limit automatically (for example a share of the last run's count), add no setting, and log each hold so that it is not a silent fallback.

### Echo loop

A rule reacts to a change in the source and writes to the same source, and its own write comes back as a new change, so the rule fires again (DDIA ch. 6, "Multi-leader replication topologies": a node ignores changes tagged with its own ID). An automation that sets a tag when a torrent changes, and runs again on the tag change, is the common case.

**Test:** a handler that reacts to events from a source and writes to the same source. A hit is one with no origin mark on its writes, no "already in the target state" check, and no condition that its own output fails.

**Fix:** skip the write when the target is already in the target state, or tag the writes with their origin and ignore events with that tag.

### Effect on rebuild

A path that recomputes state from the source (startup, a resync, a backfill, a reprocess) fires external effects again: notifications, pushes, automations. A sync that finds "new items" by a diff against an in-memory map sees every item as new after a restart, because the map is empty (DDIA ch. 3, "Event Sourcing and CQRS": a rebuild must not resend the confirmation emails).

**Test:** list each loop that derives state, and each effect in it. Run the cold start in your head: an empty cache and a full source. Each effect that fires for old items is a hit.

**Fix:** gate each effect on a durable "already done" record, not on a diff against memory. Seed the in-memory map from the store before the first tick.

### Stale delete

A delete acts on a decision that is older than the delete. A scan lists the files or rows to remove, and by the time each delete runs, the item has changed: a record now uses the file, the file was replaced, or the user changed the setting that made it a candidate. Or the delete finds the item by its path or name, and that path now leads to another file, or to a hardlink that another record still uses. DDIA ch. 9 fences a stale actor at the resource: the store checks the token at the moment of the write, not when the decision was made ("Fencing off zombies and delayed requests"). A path is a name, not an identity, the same point as DDD ch. 5, "Entities".

**Test:** list the steps from the decision to the delete. A hit is any of these: no check of the item again at delete time; a candidate list kept across a slow step (a network call, a wait for the user, a long walk of the disk) with no check after it; a file compared only by path or name, with no compare of its identity (device and inode, `os.SameFile`, or a content hash) and no check of its link count.

**Fix:** check each item again right before its delete, against the current state, and compare files by identity. For a row, make the check part of the delete (`DELETE ... WHERE <the condition>`, then check the rows affected). Skip a file with more than one link, unless every link is in the delete set. When a preview showed the user the list, delete only items from that list: check each one again, skip and report each one that no longer qualifies, and add none.

## Sources

- Martin Kleppmann and Chris Riccomini, _Designing Data-Intensive Applications_, 2nd edition, O'Reilly, February 2026, ISBN 9781098119065: https://oreilly.com/catalog/errata.csp?isbn=9781098119065
- Eric Evans, _Domain-Driven Design: Tackling Complexity in the Heart of Software_, Addison-Wesley, 2003, ISBN 0-321-12521-5: https://www.domainlanguage.com/ddd/
