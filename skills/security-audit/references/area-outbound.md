This file is the checklist of the outbound requests area (step 3 of `SKILL.md`). Check each item against the code in scope.

## Find each request

List each place that sends a request: `http.Get`, `http.NewRequest` with `Client.Do`, resty and other clients, `net.Dial`, WebSocket clients, and `fetch` or axios in server-side JavaScript. For each one, find where the URL comes from:

- A user or an admin sets it: the URL of an indexer, a download client, a webhook, a notification service, or a "test connection" button.
- A remote response sets it: a redirect, a download URL in an RSS or Torznab feed, the announce URL in a torrent, or a link in an API reply.
- The config or a constant.

## SSRF

A URL that an attacker sets makes the server fetch a place that the attacker cannot reach: the cloud metadata address `169.254.169.254`, `127.0.0.1` and the admin routes of the app, or a router on the LAN.

- Score by who sets the URL. A remote response or a party with no login is high. A logged-in non-admin user is medium to high. An admin who can already run commands through the app is low, or by design.
- A self-hosted app must reach LAN services, for example Sonarr on `192.168.1.10`, so a block of private addresses can be wrong. The risk is who sets the URL, not where it points.
- A full SSRF sends the reply back to the caller, for example as the error of a test button. A blind SSRF does not. A full SSRF is worse.
- Guards that work: an allow list of schemes (`http`, `https`). The Go `net/http` client already refuses each other scheme, so in Go this guard adds nothing. An address check on the IP that the dialer connects to, in `net.Dialer.Control`, not on the host name before the dial: DNS can change between the check and the dial (DNS rebinding). A check of each redirect in `Client.CheckRedirect`.
- Guards that fail: a string check on the host name, which `0x7f.1`, `[::ffff:127.0.0.1]`, `2130706433`, or a DNS name that points to `127.0.0.1` pass.

## Credentials in requests

- On a redirect to another domain, Go drops `Authorization` and `Cookie`, but it sends other headers again, for example `X-Api-Key`. A remote server that redirects gets the key.
- An API key in the query of an outbound URL: the error of a failed request holds the full URL, and the log shows the key. This is also an item of the secrets area: write the finding once.
- `InsecureSkipVerify: true`, as the default or as a setting: a LAN attacker can read the credentials in the request. Score it by the default, and by whether the UI warns.

## Replies from remote services

- `io.ReadAll` on a remote body with no `io.LimitReader` or `http.MaxBytesReader`: a malicious tracker or indexer can send a reply that fills the memory. The same for a gzip body with no limit after the decompression.
- A client with no timeout (`http.DefaultClient`, or `http.Client{}`): a slow server holds the request open. Score it low unless an attacker can open many.
- A value from the reply put in a path or a query of the next request with no escape: the remote service can change which route the app calls next.

## Sources

Checked on 2026-11-02. Read the source again when a version is newer than the one named here.

- The headers that Go drops on a redirect to another domain: the `Client` docs at https://pkg.go.dev/net/http
- SSRF guards: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
