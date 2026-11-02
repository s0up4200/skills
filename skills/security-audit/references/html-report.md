This file holds the layout of the HTML report, its pinned scripts, and the steps that serve it and stop serving it (steps 5 and 6 of `SKILL.md`). The layout comes from the report of `improve-codebase-architecture`, copied here so that the report needs no other bundle.

The report is one HTML file at `<run folder>/report/index.html`. Tailwind and Mermaid come from jsDelivr, so the page needs a network connection to render.

## Pinned scripts

The page lists security holes, and each script on it can read the page. So each script is an exact version that was at least 7 days old when it was pinned, with an SRI hash: the browser refuses a file that does not match its hash. Nothing updates a pin automatically.

Pinned on 2026-11-02. How SRI works: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

| Package | Published | File | SRI |
|---|---|---|---|
| `@tailwindcss/browser@4.3.3` | 2026-07-16 | `dist/index.global.js` | `sha384-2ql948lIdLcGEE0/qxNiudyTjgauA3RDJERu5xW75kFCvSl5a9odyQYCb6tEjnmB` |
| `mermaid@12.2.0` | 2026-10-13 | `dist/mermaid.min.js` | `sha384-8xUhuLNMjW/cI2Dacg3DR4WliYznvIg0LVG1stctThKD/YVrJFI9TNCFxft5NYgp` |

Use the one-file build of Mermaid, `mermaid.min.js`. The ESM build loads more files at run time, and the hash covers only the first one.

To bump a pin by hand:

```sh
# The publish date of each version. Pick one that is at least 7 days old.
npm view <package> time --json

# The files of a version, to find the path of the one-file build.
curl -s "https://data.jsdelivr.com/v1/packages/npm/<package>@<version>?structure=flat"

# The SRI hash of the file.
curl -sfL "https://cdn.jsdelivr.net/npm/<package>@<version>/<file>" | openssl dgst -sha384 -binary | openssl base64 -A
```

Then change the version, the file, the hash, and the pin date in this file and in the scaffold.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="referrer" content="no-referrer" />
    <title>Security audit for {{repo name}}</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3/dist/index.global.js"
      integrity="sha384-2ql948lIdLcGEE0/qxNiudyTjgauA3RDJERu5xW75kFCvSl5a9odyQYCb6tEjnmB"
      crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@12.2.0/dist/mermaid.min.js"
      integrity="sha384-8xUhuLNMjW/cI2Dacg3DR4WliYznvIg0LVG1stctThKD/YVrJFI9TNCFxft5NYgp"
      crossorigin="anonymous"></script>
    <script>
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      mermaid.initialize({ startOnLoad: true, securityLevel: "strict", theme: dark ? "dark" : "neutral" });
    </script>
    <style>
      .blocked { stroke-dasharray: 4 4; }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="findings" class="space-y-10">...</section>
      <section id="fix-first">...</section>
    </main>
  </body>
</html>
```

## Escape all text from the repo

A finding quotes attacker data: a torrent name with a `<script>` tag, a payload, a line of code. Escape each text that comes from the repo, a scanner, or a finding before it goes in the page: `&` as `&amp;`, `<` as `&lt;`, `>` as `&gt;`, `"` as `&quot;`. Otherwise the report runs the attack that it describes. In a Mermaid label, use the quoted form and leave out `<`, `>`, and quotes.

## Dark mode

The page follows the system color scheme. Give each color class a `dark:` pair (`bg-white dark:bg-slate-900`, `border-slate-200 dark:border-slate-700`), and give the colors in hand-built SVG a `@media (prefers-color-scheme: dark)` rule in the `<style>` block. The scaffold picks the Mermaid theme from the same setting.

## Header

The repo name, the date, and the scope. One line with who can reach the app, from the threat model. One count line, for example: "4 proven · 2 not proven · 3 disproved, with the reasons in findings.md". Then a small legend: red arrow = the attack path, dashed line = where the fix blocks it. No introduction paragraph.

## Finding card

Each finding is one `<article id="F1">`, in order of risk from high to low. The diagram carries the weight. The prose is short and plain.

- **Title**: the ID and a short name of the hole, for example "F1 · The indexer test button fetches any URL".
- **Badge row**: `Risk N/10` (7 to 10 red, 4 to 6 amber, 1 to 3 slate), `proven` (emerald) or `not proven` (slate outline), and a tag for the area.
- **Files**: a monospaced list, `font-mono text-sm`, as path:line.
- **What an attacker does**: the attack steps, one line each.
- **Who is exposed**: one sentence.
- **Fix**: one sentence, the change and where.
- **Proof**: the hops of the proof in short, or for a not proven finding, what decides it.
- **Attack path, before and after the fix**: two diagrams side by side. Before: the attacker, the input, each hop, and the sink, with the path in red. After: the same path with the fix as a node where the path stops, and the edges after it dashed and grey.

No paragraphs of explanation. If the diagram needs a paragraph, redraw the diagram.

## Mermaid diagrams

```html
<div class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
  <pre class="mermaid">
    flowchart LR
      A["Logged-in user"] -->|"indexer URL"| B["POST /api/indexers/test"]
      B --> C["http.Get(url)"]
      C -->|"reads"| D["169.254.169.254"]
      linkStyle 0,1,2 stroke:#dc2626,stroke-width:2px;
  </pre>
</div>
```

`linkStyle <n>` counts the edges from 0, in the order that you write them. `classDef` and `class` style only nodes, for example the fix node. Write each edge label in the pipe form with quotes, `-->|"label"|`: the inline form (`-.label.->`) ends the label at the first `.`, so a label such as `http.Get` breaks the whole diagram. Quote each node label that holds `( ) [ ] : .` or a code name. Keep a `;` away from the end of a color: Mermaid 12 reads `stroke:#94a3b8;` as an HTML entity and fails, so write `stroke:#94a3b8,stroke-width:1px;` or leave out the `;`. A syntax error shows only as an error box in the browser, and you do not open the page, so write the safe form each time.

When the Mermaid layout fights the point, draw the path as `<div>` boxes and inline SVG arrows in a relative container.

## Style

- Editorial, not a dashboard. Much white space. A serif for headings works well (`font-serif`).
- Color: red for the attack path and for Risk 7 to 10, amber for Risk 4 to 6, emerald for proven and for the fix.
- Keep each diagram near 320px tall, so that before and after fit side by side.
- The only scripts are the two pinned files and the Mermaid setup. The page is otherwise static.

## Fix first

One larger card at the end: the finding to fix first, one sentence on why, and a link to its card. Pick by risk, then by how many users the hole exposes, then by how small the fix is.

## Serve the report

Serve the report on the tailnet, so that the user can read it from each of their devices:

1. Run `tailscale serve status`, and pick an HTTPS port that no route uses, for example 8444. Use a port and not a path: an app on `/` of the same port can take the path over in the browser, for example with a service worker, and a port is a separate origin. Leave each other route as it is.
2. Start `python3 -m http.server <local port> --bind 127.0.0.1 --directory <run folder>/report` in the background, on a free local port. Serve `report/` only, so that the findings file and the scanner output stay off the network. `tailscale serve` sends a file or a folder only when it runs as root, and it proxies a local port without root.
3. Run `tailscale serve --bg --https=<https port> http://127.0.0.1:<local port>`.
4. Read the host name from the `DNSName` field of `tailscale status --self --json`, and make sure that `curl -s https://<host>:<https port>/` returns the `<title>` of the report.
5. Give the user the URL and the absolute path of the file.

If `tailscale` is not installed, or the host is not on a tailnet, open the file instead (`xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows), and tell the user why.

## Stop serving

When the user picks it: run `tailscale serve --https=<https port> off` for the port of the report only. Then stop the `http.server` by its process ID: `ss -ltnp 'sport = :<local port>'` shows it, and `kill <pid>` stops it. A `pkill -f` pattern also matches the shell that runs the command, and kills that shell.
