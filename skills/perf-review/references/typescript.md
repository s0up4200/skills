# TypeScript / JavaScript performance patterns

Check every changed hunk against these patterns. Each entry gives the pattern, why it is slow, and the standard fix. Judge each against the actual call pattern and data size — the "why" tells you when the pattern is harmless.

## Algorithms and data structures

### Quadratic membership tests
```ts
const missing = wanted.filter(w => !existing.includes(w.id ?? w));
```
`includes`/`indexOf`/`find` inside a loop or array-method callback is O(n·m). Build a `Set` (or `Map` for lookups) from the searched collection first: O(n+m). This is the most common perf bug in review; check every loop that scans another collection.

### Spread accumulation in reduce
```ts
const byId = items.reduce((acc, it) => ({ ...acc, [it.id]: it }), {});
```
Each spread copies the whole accumulator: O(n²) time and garbage. Mutate the accumulator (`acc[it.id] = it; return acc`) or use `Object.fromEntries` / `new Map`. Same bug with `[...acc, item]` — use `push`.

### Deep clone via JSON
`JSON.parse(JSON.stringify(x))` serializes the object graph to a string and back — slow, allocation-heavy, and silently drops `Date`, `Map`, `undefined`. Use `structuredClone` (Node 17+, all browsers), or clone only the field being changed.

### Loop-invariant work inside loops
`new RegExp(...)` per iteration, `new Intl.NumberFormat`/`DateTimeFormat` per item (these are notoriously expensive to construct), `JSON.parse` of a constant, `.sort()` inside a loop. Hoist them out; construct formatters once at module scope.

### Repeated sorts and re-derivation
Re-sorting or re-aggregating the same array on every call/render when the input has not changed. Cache the derived value; in React, `useMemo` keyed on the input.

## Async and the event loop

### Sequential awaits for independent work
```ts
for (const id of ids) { results.push(await fetchUser(id)); }
```
Total time = sum of latencies. Independent requests run together: `Promise.all(ids.map(fetchUser))`. But —

### Unbounded fan-out
`Promise.all` over thousands of items opens thousands of sockets/queries at once and stampedes the downstream. Bound the concurrency: `p-limit`, a small worker-queue, or batch chunks. The right shape is "parallel, with a limit", not either extreme.

### Blocking the event loop
Node serves every request on one thread. A synchronous hot spot — `fs.readFileSync`/`execSync` in a request handler, `crypto.pbkdf2Sync`, a tight loop over a large array, huge `JSON.parse` — freezes all concurrent requests for its duration. Use the async variants, chunk long loops, or move CPU work to `worker_threads`. In handlers, any `*Sync` call is a finding.

### N+1 queries
```ts
const orders = await db.order.findMany({ where: { userId } });
for (const o of orders) {
    o.items = await db.item.findMany({ where: { orderId: o.id } });
}
```
One round trip per row. Use the ORM's eager-load (`include`/`with`/join), a `WHERE id IN (...)` batch, or a DataLoader in GraphQL resolvers (the resolver-per-node shape makes N+1 the default there — always check resolvers).

### Missing streaming
Reading a whole file/response into memory (`fs.readFile`, `await res.json()` on huge payloads) to process it row by row: peak memory = payload size. Stream: `fs.createReadStream` + `readline`, web streams, or a streaming JSON/CSV parser.

## Memory

### Unbounded caches and maps
A module-level `Map`/object used as a cache with inserts and no eviction grows for the process lifetime — a slow leak that shows up as OOM in week two. Bound it (`lru-cache`), or key by object with `WeakMap` so entries die with their keys.

### Listener and subscription leaks
`addEventListener`/`.on(...)`/`setInterval` in code that runs repeatedly (per request, per render, per reconnect) without the matching remove/clear. Each pass adds a handler: memory grows and handlers fire N times. In React, return the cleanup from `useEffect`.

### Closures pinning large data
A small callback kept alive (cache, listener, promise chain) captures its whole enclosing scope. Extract the few fields needed before registering the callback, so the big parse result can be collected.

## React (and similar renderers)

Only apply these to code that renders. Severity depends on tree size and update frequency — a settings page re-rendering is noise; a 60fps dashboard or 5,000-row table re-rendering is a high finding.

### New references as props on every render
Inline `{}`/`[]`/arrow-function props, or `style={{...}}`, defeat memoized children — new reference each render, so `memo`/`useMemo` below never hit. Hoist constants to module scope; `useCallback`/`useMemo` for values that depend on state. Flag only when the child is expensive or the list is long.

### Expensive computation in the render body
Sorting/filtering/aggregating a large array directly in the component body reruns on every render, including unrelated state changes. Wrap in `useMemo` keyed on inputs.

### Context value churn
`<Ctx.Provider value={{ user, theme }}>` builds a new object each render, so every consumer re-renders. Memoize the value, or split one wide context into narrow ones.

### Long lists without virtualization
Rendering thousands of rows creates thousands of DOM nodes; every update relayouts them. Virtualize (`react-window`, `@tanstack/virtual`) once lists exceed a few hundred rows.

### Unstable keys
`key={index}` on reorderable/filterable lists makes React remount rows on reorder instead of moving them — lost state plus wasted DOM work. Key by a stable ID.

## Bundle size (frontend)

- `import _ from "lodash"` / `import * as X` from a big package pulls the whole library into the bundle; import the specific function (`lodash-es` submodule) or use the platform equivalent.
- Heavy, rarely-used dependencies (chart libs, editors, PDF) loaded eagerly on the main route: lazy-load them (`import()`, `React.lazy`) behind the interaction that needs them.

## Verification

- `node --cpu-prof app.js` (then open the profile in Chrome DevTools) — find the real hot function.
- `console.time`/`timeEnd` around the suspect boundary — crude, decisive, zero setup.
- `node --inspect` + DevTools heap snapshots, two snapshots apart — confirm a leak by comparing retained objects.
- React DevTools Profiler — shows which components re-render per commit and why.
- Query logging (Prisma `log: ['query']`, knex `debug`) for one request — an N+1 shows as N identical queries.
