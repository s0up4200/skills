This file is the checklist of the browser area (step 3 of `SKILL.md`). Check each item against the code in scope.

## Where attacker text comes from

Treat each of these as attacker text: a torrent name, the file names in a torrent, a tracker message, an indexer title or description, an RSS item, a release name, a log line shown in the UI, an error from a remote service, and each field that another user can set. Follow each one from where it comes in to where the UI shows it.

## XSS sinks in React and other front ends

- `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, and `document.write`, with any value that is not a constant.
- Markdown and HTML renderers: `marked` or `markdown-it` output put in the page with no sanitizer, `react-markdown` with `rehype-raw`, and a DOMPurify config that allows `style`, `on*` attributes, or `<iframe>`.
- A URL from data in `href`, `src`, `action`, or `window.location`: a `javascript:` URL runs script. Check that the code allows only `http:` and `https:`, whatever the React version does.
- Vue `v-html`, Svelte `{@html}`, and Angular `bypassSecurityTrust*`.
- `postMessage` handlers that do not check `event.origin`.
- Tokens in `localStorage`: any XSS can read them. This raises the risk of an XSS finding, but is no finding alone.

## XSS sinks in Go

- `text/template` used for HTML: it escapes nothing. `html/template` escapes by context.
- `template.HTML`, `template.JS`, `template.URL`, or `template.HTMLAttr` around a value that is not a constant.
- A handler that writes input into the response with `fmt.Fprintf(w, ...)` or `w.Write`, with an HTML content type, or with no content type, which lets the browser sniff it. Error pages that echo the path or a query value.
- A file from a user served inline on the origin of the app: an SVG or an HTML upload runs script there. Look for `Content-Disposition: attachment`, a fixed content type, and `X-Content-Type-Options: nosniff`.

## CSRF and cross-site requests

- Each route that changes state and takes a cookie session: does it need a CSRF token, a custom header, or a JSON content type that a form cannot send? A JSON handler that accepts `text/plain` or form bodies can be posted from any page.
- A `GET` route that changes state: an `<img>` tag on any page can call it.
- `SameSite=Lax` stops a cross-site `POST`, but not a request from the same site. Self-hosters often run many apps on subdomains of one domain, and sibling subdomains are the same site.
- CORS: `Access-Control-Allow-Origin` that copies the request `Origin`, or `*` together with credentials.
- DNS rebinding: an app with no login on the LAN can be reached by any website that the user opens, through a DNS name that points to the LAN address. A check of the `Host` header against the names in the config stops it. This is a real hole even when no login is by design.

## Other headers

- `frame-ancestors` in a CSP, or `X-Frame-Options`. Without one, another page can frame the app (clickjacking). Score it low unless one click does harm.
- A `Content-Security-Policy` limits the harm of an XSS. Its absence raises the risk of an XSS finding, but is no finding alone.
- An open redirect: a route that redirects to a URL from the query.
