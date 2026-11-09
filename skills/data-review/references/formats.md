# Data that outlives code

Check each change to a stored or wire format against these rules: a struct with `json` or `db` tags, a migration, a JSON column, a config or state file, `localStorage`, an enum whose values are stored or sent, and a field of an API response that another build reads. Data written today is read by the next release, and old data by today's code: "data outlives code" (DDIA ch. 5, "Different values written at different times").

Name the **old readers** and the **old data** first. Old readers: a web app bundle that a service worker still serves, the previous image after a rollback on the same database, another app or CLI that calls this API. Old data: rows, files, and backups written by each earlier release.

Each rule gives what it is, a test at the diff, and the fix. A hit needs an old row, file, or reader with concrete values, and the value or the error it produces.

### Shifted stored value

A constant whose value is stored or sent gets a new value in the middle of its block: a Go `iota` block or a TypeScript numeric `enum` gets an insert, a reorder, or a delete. After the upgrade, each old row with a later value decodes as the wrong constant. The fixtures use the new constants, so the tests pass (DDIA ch. 5, "Field tags and schema evolution": a tag number is never used again).

**Test:** the diff inserts, reorders, or deletes a constant of a type that reaches a database column, JSON, a file, or a URL.

**Fix:** give each stored constant an explicit value, add new values only at the end, and never reuse a removed one. Prefer a string value when the type is stored.

### Lossy round-trip

The code decodes a stored or remote record into a type, changes one field, and writes the whole record back. Each field that the type does not model is lost: a key that a newer release added, or a key that the user set in another tool (DDIA ch. 5, Figure 5-1: an old model object drops the unknown fields). An API that applies only the keys that are present (a partial preferences update) gets a zero for each key that the code never read.

**Test:** decode, change, and encode of one record, into a type with no catch-all for unknown fields (`map[string]json.RawMessage`, a `...rest` spread), where the write replaces the whole record or sends the whole struct.

**Fix:** send only the changed keys, or keep the unknown fields and write them back.

### Meaningful zero

A new field of a stored or decoded type reads as its zero value on old data, and the zero changes behavior: a new `Enabled bool` reads `false` on each old row, so each old filter turns off; a new `MaxRetries int` reads `0`. Or a `switch` on a value that another system defines has no case for a value that a newer version sends, and the new value falls into a branch by accident (DDIA ch. 5, "Schema evolution rules": a new branch of a union is backward compatible but not forward compatible).

**Test:** for each new stored or decoded field, name the value that old records get and the behavior that it gives. It must give the old behavior, or a migration gives each old row the value (`ADD COLUMN ... NOT NULL DEFAULT`, or an `UPDATE`), or the field is nullable and the code handles null. A `SET DEFAULT` on an existing column changes only later inserts. Each `switch` on an external enum has a case for an unknown value that logs it.

**Fix:** pick the field so that zero means the old behavior (`Disabled` in place of `Enabled`), or write the value of each old row in the migration. Handle an unknown external value on purpose, and log it.

**Against APOSD:** "define errors out of existence" holds here only when the default is the correct behavior. Mask a missing value with a default only then. Otherwise the caller needs to know that the value is missing.

### Format change with no old reader

The diff renames, removes, or retypes a field that is stored or sent, or makes a request field required, as if every reader deploys with it. A cached web app sends the old shape, or a rolled-back image reads the new rows, and it breaks or reads zeros. The tests encode and decode with the new code, so they pass (DDIA ch. 5, "Modes of Dataflow"; DDD ch. 14, "Published Language": the format that other parties read is not the internal model).

**Test:** a change to a name, a tag, a type, or an enum value of an encoded type, with no read path for the old shape, no single decoder that upgrades old shapes, or no test that decodes a payload of the previous release. A write of only the new shape that a supported old reader still reads is a hit too. A cast with no validation (`JSON.parse(raw) as Settings`) of stored data is a hit.

**Fix:** read every stored shape through one decode-and-upgrade function. Add a golden test: a payload captured from the previous release, committed as a fixture, that must still decode to the right values. Change a field in steps: add the new field, write both, and keep reading the old one. Before the reads move to the new field, wait until no old writer runs, then copy the old value, converted to the new type, into the new field where the two differ, in one `UPDATE` statement and not a read followed by a write. Stop writing the old field when no supported reader needs it, and remove the old read when no stored data or supported backup holds the old shape.

**Against APOSD:** a separate wire type with a one-to-one mapper starts as a pass-through. Use one type plus the golden test until the test breaks. Then split out a wire type for the format.

### Torn file write

The code writes over a file that the app reads back, with `os.WriteFile` or an open-and-truncate. A crash, an OOM kill, or a full disk leaves a truncated file, and the next start fails or loses the settings. The same holds for a multi-step write of a set of rows or a remote collection: a reader sees half of it, and a rerun duplicates or skips output (DDIA ch. 4: a crashed merge leaves a partial file that the engine deletes; ch. 11, "Serving Derived Data": a restarted task can duplicate the output of the failed one).

**Test:** the diff writes a path that the program parses later, with no temp file and rename. Or it writes a batch in several steps with no transaction or staging.

**Fix:** write to a temp file in the same directory, sync it, and rename it over the old file. Write a batch in one transaction, or into a staging table or folder that is swapped in at the end, so that a rerun starts clean.

### Strict check on the load path

The diff makes a validation stricter in a function that also loads existing data: a shared constructor, an `UnmarshalJSON`, a `Validate` that the list endpoint or startup calls. Old rows that were valid before now fail, so startup fails or the list returns an error after the upgrade. Fresh fixtures pass the new check, so the tests do not show it (DDD ch. 6, "Reconstituting Stored Objects": a factory rejects a new object that breaks an invariant, but a stored one may need a gentler path).

**Test:** a stricter rejection in a function that a load path calls: startup, a list, a restore, a sync of stored rows. Also an import or restore that does not keep the stored IDs, so references break.

**Fix:** apply the strict check to new input only. On the load path, choose for each case: accept the old value, repair it and log each repair, or show it to the user as invalid. Keep the stored IDs on a restore.

## Sources

- Martin Kleppmann and Chris Riccomini, _Designing Data-Intensive Applications_, 2nd edition, O'Reilly, February 2026, ISBN 9781098119065: https://oreilly.com/catalog/errata.csp?isbn=9781098119065
- Eric Evans, _Domain-Driven Design: Tackling Complexity in the Heart of Software_, Addison-Wesley, 2003, ISBN 0-321-12521-5: https://www.domainlanguage.com/ddd/
