This file is the checklist of the secrets area (step 3 of `SKILL.md`). Check each item against the code in scope.

## Git history

- Triage each gitleaks result: a real key, a test value, or an example. A real secret in an old commit stays public in a public repo, even after a later commit deletes it. The fix is to revoke and rotate the key. A rewrite of the history comes second, because each clone and fork keeps the old commits.
- Look for what gitleaks misses: default passwords, session secrets, and signing keys in code or in an example config that the app accepts as is.

## Logs

- A request log that writes the full URL: a key in the query (`?apikey=`) reaches the log.
- The error of a failed request in Go (`*url.Error`) holds the URL. Go removes the password of a `user:pass@` URL from it, but keeps the query. `url.URL.Redacted()` removes only the password too.
- Logs of request or response headers, of a response body, or of a config struct at startup (`%+v`, `slog.Any("config", cfg)`).
- Debug logs that are on by default, or that a user asks for to attach to a bug report.

## API responses

- Routes that send stored credentials to the browser: the passwords of download clients, the API keys of other services, tokens. Even a logged-in user should get a mask, and a field that is write-only. An XSS in the browser area can then read every key.
- Errors that send internal details to the client: a stack trace, a SQL error, a file path, or the URL with a key.
- Exports and backups: what they hold, which route serves them, and to whom.

## Storage

- Secrets stored in plain text in the database or the config. This is common in self-hosted apps, so score it by the threat model: with a file read hole elsewhere, plain text turns into credential theft. An encryption key that sits beside the data adds little.
- The file modes of the files that hold secrets are an item of the files area.

## Front end and build

- Secrets in the built JavaScript: Vite puts each `VITE_` variable in the bundle, and other bundlers have their own prefixes. Each value in the bundle is public.
- Source maps served in production. Score them low: they show code, not secrets, unless a secret is in the code.
- Secrets in a Docker image layer or in a build argument are an item of the deployment area.

## Sources

Checked on 2026-11-02. Read the source again when a version is newer than the one named here.

- Vite puts each `VITE_` variable in the bundle: https://vite.dev/guide/env-and-mode
