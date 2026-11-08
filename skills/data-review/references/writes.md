# Writes to a shared store

Check each write to a database, a key-value store, or a file that the app owns against these rules, and each write that changes state on a remote system. A shared store has more than one **writer**: request handlers, a background loop, an automation, a CLI on the same database file, a second browser tab. The diff shows one writer. The bug comes from the writer that the diff does not show, so use the writer list from step 2 of `SKILL.md`.

Each rule gives what it is, a test at the diff, and the fix. A hit needs a **scenario** with concrete values that ends in the wrong stored state, a hang, or a lost effect: the order of the steps of two writers, or the steps of one writer and the failure or crash between two of them.

### Lost update

App code reads a stored value, changes it, and writes it back (get, change, save). Two writers do this at the same time, and the second save silently erases the change of the first. Postgres at its default level (read committed) commits both, also inside a transaction. DDIA ch. 8, "Preventing Lost Updates", warns that ORMs make this unsafe cycle the easy path.

**Test:** a value that app code reads, changes, and writes back, with none of these: an atomic `UPDATE ... SET x = x + ?`, an update of only the changed columns when no new value comes from the read, `WHERE version = ?` plus a check of the rows affected, `SELECT ... FOR UPDATE` in the same transaction as the write, or SQLite `BEGIN IMMEDIATE`. A settings or JSON blob that is loaded, changed in one field, and saved whole is the common case.

**Fix:** prefer the forms that make the conflict impossible: an atomic `SET`, or an update of only the changed columns (`Increment(id)` or `SetName(id, name)` in place of `Get` and `Save`). Use a version check only when the user must see the conflict, and then return it to the user. A whole-record write is acceptable only when the diff says that the loss is acceptable (last write wins, on purpose).

### Check-then-insert

A read checks that a row is absent, or that a count is under a limit, and a later write depends on that answer. Two requests both pass the check, and both insert. A transaction around the two statements does not fix it under read committed or snapshot isolation, because the check finds no row to lock (DDIA ch. 8, "Phantoms causing write skew"). An in-process mutex fixes it only when one process owns the data. A CLI or a second instance on the same database file is a second process.

**Test:** `if !exists { insert }`, `SELECT COUNT(*)` then `INSERT`, or "already claimed?" then claim, with no unique index on the checked key, `ON CONFLICT DO NOTHING` on it (an `ON CONFLICT DO UPDATE` that changes the owner lets the second claimant win), conditional `UPDATE ... WHERE state = 'pending'` with a check of the rows affected, or serializable transaction that covers the pair. A unique index protects only the key that it covers: a count limit needs a conditional update of a counter row, a lock on the parent row, or a serializable transaction.

**Fix:** one conditional write at the store: a unique index plus `INSERT ... ON CONFLICT DO NOTHING`, or a conditional `UPDATE` whose rows-affected count says who won. For "make sure it exists", the upsert removes the error. For "claim this" or a create that the user starts, the caller needs to know that someone else won, so return the conflict.

### Split write

Two or more writes that one invariant connects (a row and its counter, a parent and its children, an item and its "seen" marker) run outside one transaction. A failure between them leaves the store half changed, and nothing reports which half (DDIA ch. 8, "Atomicity"). A variant: code inside a transaction calls the pool handle (`db.Exec`) in place of the transaction handle, so that write escapes the rollback. With SQLite and `SetMaxOpenConns(1)`, that call waits forever for the connection that the transaction holds.

**Test:** connected writes as separate statements with no transaction. Or, between `Begin` and `Commit`, a call that reaches the pool handle: follow each helper that the transaction body calls.

**Fix:** one store method per operation owns the transaction. When the caller must group calls, give it `InTx(func(Store) error)`, where the callback gets a `Store` with the same interface, bound to the transaction.

**Against APOSD:** a `*sql.Tx` passed down through each layer is a pass-through variable. The transaction stays inside one store method, or inside `InTx`. Flag a fix that threads `*sql.Tx` through layers that only forward it.

### Dual write

Request code writes one fact to two places, for example the database and an in-memory cache, or the app database and a remote system. Two requests can land in opposite orders in the two stores, and the copies disagree with no error (DDIA ch. 12, "Keeping Systems in Sync").

**Test:** one code path writes the same value to two stores, and neither copy is derived from the other.

**Fix:** name one store as the record, and make the other copy follow it: invalidate the cache in place of writing it, make one loop the only writer of the copy, or write an outbox row in the same transaction and send from it. The cache rules are in `copies.md`, Copy without owner.

### Effect inside the transaction

An external effect (an HTTP call, a notification, a push to another app) runs between `Begin` and `Commit`. The transaction aborts or retries, and the effect has already happened, once or twice. Or the "done" marker of an item (a seen ID, a processed flag) is written in a later statement than the data, and a crash between the two loses the item or repeats it. Or a loop stores its read position (a cursor, a last-seen ID) before the effect is durable, and a crash skips the items in between (DDIA ch. 8, "Exactly-Once Message Processing Revisited", and ch. 12, "Consumer offsets").

**Test:** list the writes and the effects of the path in order. A hit is any of these: a network call between `Begin` and `Commit`; a done marker outside the transaction of the data that it guards, or with no unique constraint; a cursor saved before the effect, or after an effect that is not safe to repeat.

**Fix:** write the data and its done marker in one transaction. Send each notification and remote effect after the commit. When the effect must happen also after a crash, write an outbox row in the same transaction, and send from it after the commit with retries and a dedupe key. Store the cursor after the effect is durable, and make the effect safe to repeat, because a crash after the effect and before the cursor repeats it.

### Stale writer

Work that can outlive its owner (a sync tick that timed out, a loop that was replaced after a settings change, a fetch for a filter that the user already changed) finishes late and writes its old result over the newer one. Cancellation alone does not stop it: a response already in flight, or a goroutine that does not check `ctx`, still writes. DDIA ch. 9 calls this a zombie, and fences it with a token that only goes up ("Fencing off zombies and delayed requests").

**Test:** the diff restarts a loop, a subscription, or a fetch, or gives work a timeout or a lease. Can a write from the old instance reach shared state after the new one started? A hit is a write with no check of a generation, a sequence number, or (in a web app) an `AbortController` or request id at the moment of the write.

**Fix:** give each instance a generation that only goes up, and make the store reject a write from an older generation: `Set(gen, value)`. In a web app, apply a response only when its request id is the latest one. Only writers that can go stale take the token.

### Rule on one write path

A new business rule sits in one handler or one component, and another path writes the same state without it: the background loop, an automation, a directory scan, an import, a restore, the CLI. The same bug comes from the other side when a new writer skips a rule that the old writers call. Evans puts the rule in the domain layer, where every write passes (DDD ch. 7, "Allocation Checking").

**Test:** for each new rule (a block list, a limit, a "never delete X"), take the writer list from step 2 and check that each writer of that state calls it. For each new writer, list the checks that the other writers of the same state call before they write (search the other add, import, or delete paths), and check that the new writer calls each one. One writer that skips a check is a hit.

**Fix:** move the rule into the function that every write path calls, usually the store method or the module that owns the state, and delete the copy in the handler.

### Race fix with no race test

A fix for a lost update, a check-then-insert, a split write, or a stale writer is proved only by `go test -race`, by a single-caller test, or on one database. `-race` sees memory races, not database races. SQLite has one writer, so a test that passes there says nothing about Postgres (DDIA ch. 8, "Weak Isolation Levels": concurrency bugs show only with unlucky timing).

**Test:** the diff fixes one of the rules above, and no test starts several callers at once against a real local database.

**Fix:** a test that starts at least 8 callers at once, released together (for example by a closed channel), on each database that the repo supports, and checks the invariant at the end. Prove the test: remove the guard, see the test fail, and put the guard back.

## Sources

- Martin Kleppmann and Chris Riccomini, _Designing Data-Intensive Applications_, 2nd edition, O'Reilly, February 2026, ISBN 9781098119065: https://oreilly.com/catalog/errata.csp?isbn=9781098119065
- Eric Evans, _Domain-Driven Design: Tackling Complexity in the Heart of Software_, Addison-Wesley, 2003, ISBN 0-321-12521-5: https://www.domainlanguage.com/ddd/
- PostgreSQL 18 documentation, "Transaction Isolation", read on 2026-11-08: read committed is the default level. https://www.postgresql.org/docs/current/transaction-iso.html
- SQLite documentation, "Transaction", read on 2026-11-08: one write transaction at a time, and what `BEGIN IMMEDIATE` does. https://www.sqlite.org/lang_transaction.html
