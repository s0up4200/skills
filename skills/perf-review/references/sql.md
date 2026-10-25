# SQL statement cost

Check every changed SQL statement against these patterns. Each entry gives the pattern, why it is slow, and the standard fix. N+1 queries (one query for each row in a loop) are in the language reference. This file covers the cost of one statement.

### Correlated subquery for each outer row
```sql
DELETE FROM accounts
WHERE NOT EXISTS (
    SELECT 1 FROM json_each(?) j
    WHERE j.value ->> 'provider' = accounts.provider
      AND j.value ->> 'id' = accounts.id
);
```
The subquery refers to columns of `accounts`, so the database runs it again for each row of `accounts`. Here it scans the whole bound list each time, which gives O(rows × list). With 5,000 kept accounts, one sweep took 12 s. Write the subquery so that it does not refer to the outer row. The database then builds it one time:
```sql
DELETE FROM accounts
WHERE (provider, id) NOT IN (
    SELECT j.value ->> 'provider', j.value ->> 'id' FROM json_each(?) j
);
```
The same sweep took 13 ms. The same bug occurs with `IN`, `EXISTS`, and a scalar subquery in the `SELECT` list.

### Filter or join with no index that fits
A `WHERE`, `JOIN ... ON`, or `ORDER BY` on columns that no index starts with makes the database read the whole table. A function on the column (`lower(name) = ?`) or a leading wildcard (`LIKE '%x'`) also stops the database from using an index on it. Add an index that starts with the filtered columns, or change the filter so that it can use one. Flag it only when the table grows with use. A table of 20 settings rows needs no index.

### Full scan inside a write
An `UPDATE` or `DELETE` that scans a whole table holds the write lock for the whole scan. SQLite has one writer, so each other write waits. Postgres locks each row that it changes and holds the locks until the transaction ends. Flag each scan in a write that runs on a timer, in a request, or on a table that grows. Fix the filter so that it uses an index, or delete in batches with a `LIMIT` in a loop.

## Verification

If you can build the schema, for example from the migrations or a test fixture, run the plan on each changed statement:

- SQLite: `EXPLAIN QUERY PLAN <statement>`. `CORRELATED` on a subquery means that it runs once for each outer row. `LIST SUBQUERY` runs one time. `SCAN <table>` reads the whole table. `SEARCH <table> USING INDEX` reads only the matching rows.
- Postgres: `EXPLAIN <statement>`, or `EXPLAIN ANALYZE` on a copy of the data because it runs the statement. `SubPlan` is a correlated subquery. `Seq Scan` reads the whole table. `Index Scan` and `Index Only Scan` read only the matching rows.

If you cannot build the schema, give these commands in the report.
