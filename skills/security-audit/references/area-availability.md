This file is the checklist of the availability area (step 3 of `SKILL.md`). It covers input that uses up a shared resource or stops a shared service. The size limits on uploads and archives are in the files area, and the limits on remote replies are in the outbound area. Check each item against the code in scope.

## Bar for a finding

Name the input, the work that the attacker does, the work or the resource that the service spends, who else is harmed, and how the service recovers. A missing rate limit alone is not a finding: first check the size, concurrency, queue, deadline, and upstream limits on the path. Work that only slows the party's own process is not a finding. One small input with a large or lasting effect scores much higher than an attack that needs sustained traffic. When a limit outside the repo decides it, for example a reverse proxy, the verdict is not proven.

Prove it with analysis and small fixtures under strict limits. A load test proves nothing that the code does not show, and it can stop a shared service.

## Start here

Make a table of each input: the largest size or count that the app accepts, the work before login, the fan-out to other services, what stays after the request, the shared pool that it uses, and the limit that stops it. Compare limits per item with limits in total: many small valid items can pass a limit on each item.

## Amplification

- Small input with a large cost: a regular expression with backtracking (Go `regexp` is linear, JavaScript is not), nested parsing, recursion, or template expansion. Derive the depth and the count that the code accepts.
- Input that grows after the size check: compressed, nested, or aliased data. Check the limit after each expansion.
- A small request that runs a full table scan, an unbounded sort or join, or many calls to another service because the page size, the filter, or the expansion has no limit.
- Expensive work before login or before the first size check: parsing, hashing, decompression, or an outbound request.

## Things that grow

- Bodies, sessions, unique cache keys, metric labels, subscriptions, or pending jobs with no limit on each item and in total. Find what cleans them up on a disconnect, a timeout, and a failed parse.
- Files, sockets, cursors, timers, and subprocesses that the error path does not close. In Go, a goroutine that blocks forever on a channel or a read keeps its memory.
- Work that goes on after the client leaves: in Go, a job that starts with `context.Background()` in place of `r.Context()` keeps running after a disconnect or a timeout.
- `http.Server` with no `ReadHeaderTimeout`: a client that sends the headers slowly holds a connection for as long as it wants.

## Shared capacity

- A quota counted by something the attacker controls: an IP from a header, a key prefix, or a task ID. Retries and reconnects that reset the count.
- Jobs of one party that hold the workers, the database pool, or a shared lock that others need. A lock held across a network call or a callback. Two locks taken in a different order.

## Crash and recovery

- Input that reaches a crash in a shared process. In Go, `net/http` recovers a panic only in the goroutine of the handler: a panic in a goroutine that the handler started stops the whole process. Concurrent map writes are a fatal error that `recover` cannot catch.
- Retries with no limit or backoff after a failure: one failure source makes lasting work.
- A bad record at the front of a shared queue, a startup scan, or a migration: it fails each time and blocks the rest.
- A restart or a restore that rebuilds unbounded state, or that reads the same input that caused the crash.
