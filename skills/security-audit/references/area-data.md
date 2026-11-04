This file is the checklist of the data isolation area (step 3 of `SKILL.md`). It follows one protected record through each copy and each state. For a single route that forgets a check, use the login and API access area. Check each item against the code in scope.

## Bar for a finding

Name the party, the protected data, its owner, the other copy or operation, and what the party reads or changes. An owner field on a record is not isolation: find the query, key, path, or policy that enforces it on each read and write. A privacy preference is not a finding unless the product promises a boundary or a delete. When a storage policy or a retention setting outside the repo decides it, the verdict is not proven.

## Start here

Pick one protected record. Follow its write, query, cache, search index, event, export, backup, delete, and restore paths, and mark who the party is on each. Then start at the code with no request identity: background jobs, migrations, admin clients, and global unique keys.

## Isolation

- A read, update, delete, list, count, or bulk query that names an object and not its owner, or that takes the owner from the request body.
- Cache keys, object paths, search document IDs, temp files, and dedupe keys that leave out the tenant or the user: two parties get the same key.
- ORM default scopes, row policies, and raw or service clients that apply different filters. Check joins, views, aggregates, and the path where the identity is missing.
- A shared link, a signed URL, or an attachment ID that allows more than the party that made it could do, or that still works after the rights change.

## Other copies

- A change of rights that leaves the old copy in a cache, search index, thumbnail, feed, or preview. Check the filter when the copy is read, not only when it is written.
- Logs, traces, metrics, and analytics that hold private data, with more readers or a longer life than the data. Name the data and the reader. A public ID is not enough.

## Export, restore, and migration

- A backup or an export that holds other tenants, deleted data, or secrets. Check the rights on each item, and who can download the file.
- A restore or an import that recreates a record the party cannot write, or that skips the owner, schema, or uniqueness rules.
- Old records with no owner or rights field after a migration: what default do they get? Check a partial rollout, a rollback, and a migration that resumes.

## Delete and revoke

- A soft-deleted record that a direct lookup, a search, a relation, or a background job still returns or acts on. Can someone register the old ID again while references to it remain?
- A removed member, a lower role, or a revoked secret that a session, cache, subscription, or queued job still honors.
- A delete that finishes in the main store while a queued job, retry, or export writes the data again.
- An undo, an undelete, or a backup that restores rights, credentials, or members that the current policy does not allow.
