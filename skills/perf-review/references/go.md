# Go performance patterns

Check every changed hunk against these patterns. Each entry gives the pattern, why it is slow, and the standard fix. The "why" matters: use it to judge whether the pattern is a real problem in this code, or harmless.

## Allocations and GC pressure

Go's GC cost scales with allocation rate, not heap size. A hot path that allocates per iteration makes every other goroutine pay in GC assist time. The `-benchmem` column `allocs/op` is the score to drive down.

### append without preallocation
```go
var out []Item
for _, r := range rows {          // len(rows) known here
    out = append(out, convert(r))
}
```
`append` grows the backing array by doubling: log₂(n) reallocations, each one a copy of the whole slice. When the final length is known or bounded, preallocate:
```go
out := make([]Item, 0, len(rows))
```
Same rule for maps: `make(map[K]V, len(rows))` avoids rehashing on growth.

### String concatenation in a loop
```go
s := ""
for _, part := range parts { s += part }
```
Strings are immutable; each `+=` allocates and copies everything so far — O(n²) bytes copied. Use `strings.Builder` (or `strings.Join` when it is a plain join). `Builder.Grow(n)` when the size is known.

### fmt.Sprintf on the hot path
`fmt` uses reflection and allocates for every verb. For simple conversions, `strconv.Itoa`, `strconv.FormatFloat`, and `strconv.AppendInt` (appends into an existing buffer, zero alloc) are 5–10x faster. Flag `Sprintf` only in loops or per-request code — in error construction and logging of rare events it is fine.

### []byte ↔ string conversions in loops
Each conversion copies the data. A parser that does `string(b)` per token allocates per token. Keep data as `[]byte` through the pipeline; the `bytes` package mirrors the `strings` API. Map lookups with `m[string(b)]` are the exception — the compiler elides that copy.

### Interface boxing in hot loops
Storing a non-pointer value into an `interface{}`/`any` (including passing to `fmt`, `log`, or a generic-free container) heap-allocates the value. In a per-row loop this shows up as one alloc per row. Fix: concrete types, generics, or preallocated boxed values.

### Escaping to the heap
Returning a pointer to a local, capturing a local in a closure that outlives the call, or passing a pointer into an interface method all force heap allocation. Verify with `go build -gcflags='-m'` — it prints `escapes to heap` per variable. Only worth chasing on hot paths; do not contort cold code to please escape analysis.

### Large structs copied in range loops
```go
for _, v := range hugeStructs { ... }   // copies each element
```
`range` copies the element. For structs over ~100 bytes iterate by index (`&hugeStructs[i]`). Also flag large structs passed by value through call chains.

### sync.Pool for big reusable buffers
Per-request `make([]byte, 64<<10)` or `bytes.Buffer` churn is the textbook `sync.Pool` case. Only suggest a pool when the buffer is large and the path is genuinely hot — a pool on a cold path is complexity with no payoff.

## Loops and algorithms

### O(n²) membership tests
```go
for _, a := range listA {
    for _, b := range listB { if a.ID == b.ID { ... } }
}
```
Build a `map[ID]struct{}` (or `map[ID]B`) from one list first: O(n+m). This is the single most common planted-in-review perf bug; check every nested loop over two collections.

### Work hoisted out of loops
`regexp.MustCompile`, `time.Parse` of a constant layout, `template.Parse`, `json.Unmarshal` of a constant — anything deterministic and loop-invariant compiles once at package level or before the loop. A regex compile per iteration is ~1000x the match cost.

### defer in a loop
`defer` inside a loop body does not run until the function returns: file handles and locks accumulate for the whole loop. Move the body into a small function, or close/unlock explicitly per iteration.

## Concurrency

### Unbounded goroutines
```go
for _, job := range jobs { go process(job) }
```
A million jobs is a million goroutines: scheduler thrash, memory spikes, and a stampede on whatever downstream resource they hit. Bound it: `errgroup.Group` with `SetLimit(n)`, or a worker pool sized to the resource (CPU count for CPU work, connection limit for I/O).

### Goroutine leaks
A goroutine blocked forever on a channel send/receive with no cancelation path never exits — memory grows for the process lifetime. Every spawned goroutine needs an exit route: `context` cancelation, closed channel, or bounded work.

### Lock contention
A single mutex around a hot map serializes all cores. Options in order of preference: shard the map, `sync.Map` (only for write-once/read-many), atomic counters for plain counters. Also flag holding a lock across I/O — that turns a microsecond critical section into a millisecond one.

### Channel misuse as a hot-path queue
Unbuffered channels force a synchronous handoff (two goroutine parks per item). For high-throughput pipelines give the channel a buffer sized to smooth bursts, or batch items per send.

## I/O and data access

### N+1 queries
```go
orders, _ := db.GetOrders(userID)
for _, o := range orders {
    items, _ := db.GetItems(o.ID)   // one query per order
}
```
One round trip per row: latency × n. Fix with a JOIN, a `WHERE id IN (...)` batch, or the ORM's eager-load. Recognize it in any client, not just SQL — per-item HTTP calls and per-item cache gets are the same bug; use batch endpoints and `MGET`.

### Reading whole bodies into memory
`io.ReadAll` on a request body or file that then gets decoded: peak memory = full payload, and large payloads from users become an OOM lever. Stream instead: `json.NewDecoder(r).Decode`, `io.Copy`, `bufio.Scanner`.

### Unreused HTTP clients
`&http.Client{}` or `http.Get` with a fresh Transport per call opens a new TCP+TLS connection each time. One shared `http.Client` per destination reuses the connection pool. Also check `resp.Body` is fully read and closed — otherwise the connection cannot be reused.

### Missing buffering
Unbuffered small writes (`os.File.Write` per line, per-line network writes) pay a syscall each. Wrap in `bufio.Writer` and flush once.

## Verification

- `go test -bench=. -benchmem ./pkg/...` — allocs/op and ns/op before and after.
- `go build -gcflags='-m' ./pkg 2>&1 | grep escape` — settle escape-analysis disputes.
- `go test -run=NONE -bench=X -cpuprofile=cpu.out` then `go tool pprof -top cpu.out` — find the real hot path when in doubt.
- `GODEBUG=gctrace=1` — GC frequency and pause evidence for "GC pressure" claims.
