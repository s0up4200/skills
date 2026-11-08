# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in [SKILL.md](SKILL.md): **module**, **interface**, **seam**, **adapter**.

## Dependency categories

When assessing a candidate for deepening, classify its dependencies. The category determines how the deepened module is tested across its seam.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable: merge the modules and test through the new interface directly. No adapter needed.

### 2. Local-substitutable

Dependencies that have local test stand-ins (PGLite for Postgres, in-memory filesystem). Deepenable if the stand-in exists. The deepened module is tested with the stand-in running in the test suite. The seam is internal; no port at the module's external interface.

### 3. Remote but owned (Ports & Adapters)

Your own services across a network boundary (microservices, internal APIs). Define a **port** (interface) at the seam. The deep module owns the logic; the transport is injected as an **adapter**. Tests use an in-memory adapter. Production uses an HTTP/gRPC/queue adapter.

Recommendation shape: *"Define a port at the seam, implement an HTTP adapter for production and an in-memory adapter for testing, so the logic sits in one deep module even though it's deployed across a network."*

### 4. True external (Mock)

Third-party services (Stripe, Twilio, etc.) you don't control. The deepened module takes the external dependency as an injected port; tests provide a mock adapter.

### The port speaks the app's terms (categories 3 and 4)

A remote or third-party system brings its own model: names, wire keys, enum strings, and version quirks. Keep that model inside one adapter, and give the app a port in its own terms (Evans, _Domain-Driven Design_, ch. 14, "Anticorruption Layer"). Test: list the external API's keys, endpoints, and enum strings, and search for the ones that the app does not also use in its own terms (skip `id`, `name`, and `status`) outside the adapter. Each hit that reads or builds the foreign value is a leak, and a rename upstream then needs an edit at each one.

Translate, or conform. When the upstream model fits and its interface is large, use the upstream types directly. A mirror type that copies the upstream type field for field, plus a `toDomain()`, is a pass-through: delete it. The adapter earns its place only when it passes the deletion test: without it, callers would handle the foreign keys and quirks themselves.

## Seam discipline

- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a port unless at least two adapters are justified (typically production + test). A single-adapter seam is just indirection.
- **Internal seams vs external seams.** A deep module can have internal seams (private to its implementation, used by its own tests) as well as the external seam at its interface. Don't expose internal seams through the interface just because tests use them.

## Testing strategy: replace, don't layer

- Old unit tests on shallow modules become waste once tests at the deepened module's interface exist; delete them.
- Write new tests at the deepened module's interface. The **interface is the test surface**.
- Tests assert on observable outcomes through the interface, not internal state.
- Tests should survive internal refactors, since they describe behaviour, not implementation. If a test has to change when the implementation changes, it's testing past the interface.
- At an external seam, feed the adapter's tests from responses recorded from the real system, one set for each version that you support. A hand-written mock returns the shape that you believe in, so it agrees with your bug (Evans, ch. 14, "Testing at the CONTEXT Boundaries"). Before you save a fixture, replace each token, key, and personal value with a fake one, so that no secret or customer data reaches the repository.
- When a port has two or more adapters (SQLite and Postgres, a fake and the real client), one contract suite checks the state after each call and runs against every adapter. Two adapters that implement one interface can still have different side effects (Evans, ch. 10, "Assertions"), and the suite is what proves that the seam is real.
