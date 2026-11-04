This file is the checklist of the login and API access area (step 3 of `SKILL.md`). Check each item against the code in scope.

## Route inventory

Start here: the other items need it.

- List each route and the middleware that wraps it: the router setup (`net/http` `ServeMux`, chi, gorilla/mux, echo, gin, fiber), each sub-router, and each second listener. A route that sits outside the login group, on a second mux, or before the login middleware works with no session.
- `import _ "net/http/pprof"` adds `/debug/pprof/` to `http.DefaultServeMux`. A server that serves `DefaultServeMux`, or passes a nil handler, exposes it. Look for the same with `expvar` and metrics routes.
- WebSocket, SSE, and file download routes often skip the middleware of the API. Check each one. A WebSocket upgrade with no `Origin` check lets any website open it with the user's cookies.
- The first-run setup route, for example "create the first admin": check that it refuses once a user exists. Before setup, whoever reaches it first becomes the admin.

## Login checks

- Login checks that compare path strings: `strings.HasPrefix(r.URL.Path, "/api")` is passed by `/API`, `//api`, an encoded path, or a trailing slash, depending on the router. Check what the router sends to the handler.
- A login bypass for "local" requests: when the code trusts `X-Forwarded-For`, `X-Real-IP`, or `RemoteAddr` behind a proxy, any client can send the header. Check that the code takes the header only from a proxy address that the config names.
- Headers from an auth proxy (`Remote-User`, `X-Forwarded-User`): the same check. A client that reaches the app past the proxy can send the header itself.
- Login that the config can turn off: what the default is, and whether the docs say so. A login that is off by design goes in the by-design list of the threat model, not in a finding.
- `OPTIONS` and `HEAD` that skip the middleware, but reach a handler that acts on them.

## API keys and tokens

- An API key in the query string (`?apikey=`): it goes into access logs, proxy logs, browser history, and the `Referer` header. Check where the app logs URLs.
- The compare of a key or a token: `subtle.ConstantTimeCompare` in Go, not `==`. Over a LAN, the timing of `==` is hard to use, so score it low.
- Where a key comes from: generated with `crypto/rand` on install, or a default in code or in an example config that the app accepts.
- JWT: the algorithm is fixed by the server, `none` is refused, and the signing key is not a default.

## Sessions and passwords

- Cookie flags: `HttpOnly`, `Secure` when the app serves TLS or sits behind TLS, and `SameSite`.
- A new session ID after login, and a logout that ends the session on the server.
- The session secret: generated per install, not a constant in code.
- Password storage: bcrypt, scrypt, or argon2, not a plain or a fast hash such as SHA-256.
- A limit on login attempts, or a delay. Without one, a LAN attacker can guess passwords.

## Access between users

Only for an app with more than one user or role:

- Each route that takes an ID (`/api/instances/{id}`) checks that the user owns the object, or has the role for it.
- A non-admin user cannot reach the admin routes: settings, user management, backups, and external programs.

## Login flows

- OAuth and OIDC: the `state` value is checked, and the redirect URL is an exact match against the config.
- A redirect after login (`?next=`, `?redirect=`): it accepts only a path on the same site. `//evil.example` and `https:evil.example` are other sites.
- SAML: the element whose signature passes is the element that the code reads the identity from. Check the unsigned path, the XML parser, the validity window, the audience, and replay.

## Second factors and recovery

Only for an app that has them:

- MFA: adding, replacing, or turning off a factor, and making recovery codes, need fresh proof of identity. A first factor alone cannot do it, and a removed factor stops working.
- Step-up: the challenge is tied to the user, the session, the action, and an expiry, and it works once. Compare the UI, the API, and the recovery path.
- WebAuthn and passkeys: registration and login check the challenge, the RP ID, the origin, and that the credential belongs to the account.
- Account linking: adding an email, an external login, or a device needs a current session, proof that the party owns the new identity, and a callback tied to the account that started it.
- Password reset and recovery are often the weakest login. The token is random, tied to one user and one action, expires, and works once. The link does not take its host from the request. A reset ends the old tokens and sessions.

## Requests between a proxy and the app

Only when the docs or the config put a proxy or a cache in front of the app. What the proxy does is often outside the repo, so the verdict is often not proven: say what decides it.

- Framing: the proxy and the app disagree on where a request ends, through two `Content-Length` values, `Transfer-Encoding`, or an HTTP/2 downgrade. It matters mostly for a custom parser. Go `net/http` refuses most of these forms, so read what the code does before you report it.
- `Host` and `X-Forwarded-Host`: a value from the client that builds an absolute URL, a reset link, a callback, or a tenant route. Check that the proxy strips the client's copy.
- Cache poisoning: a request value changes the response, but the cache key leaves it out. Compare the key with each header and cookie that changes the response.
- Cache deception: a private route that the cache takes for a static file, for example `/account/x.css`. Check `Cache-Control` on private responses.
- Response headers: input in `Location`, `Set-Cookie`, or another header. Check whether the framework refuses a line break first.
- mTLS: the app trusts a client certificate header from any peer, or maps the text of a certificate subject to the wrong account.
