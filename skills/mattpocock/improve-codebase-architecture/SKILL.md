---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then file the picked ones as issues or grill one now.
disable-model-invocation: true
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities**: refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

This command is _informed_ by the project's domain model and built on a shared design vocabulary:

- Call the Skill tool with "codebase-design" for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its principles (the deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real"). Use these terms exactly in every suggestion, and don't drift into "component," "service," "API," or "boundary."
- The domain language in `GLOSSARY.md` gives names to good seams; ADRs in `docs/adr/` record decisions this command should not re-litigate.

## Process

### 1. Explore

**Scope before you scan: YAGNI.** Deepening a module pays off by making future changes to it easier, so put extra weight on the parts of the codebase that have recently changed. Decide *where* to look before you look:

- If the user named a direction (a module, a subsystem, a pain point), take it, and skip the inference below.
- Otherwise, find the codebase's hot spots: the files that change often and are large. Count the changes per file in the last six months, and read the top of the list next to the size of each file. Skip lock files and generated files.

  ```sh
  git log --since=6.months --format= --name-only | grep . | sort | uniq -c | sort -rn | head -20
  ```

  If `git rev-list --count --since=6.months HEAD` is below about 50, drop `--since` and read all of the history. If the changes are scattered with no clear hot spot, widen the net.
- Then list the file pairs that change in the same commits: run `scripts/change-coupling.sh 6.months` from this skill's folder, in the repo root (no argument reads all of the history). A pair above about 30 % that is not a file and its own test is a sign that one concept is split across a seam, which a code reading misses when no import joins the files.

Read the project's domain glossary (`GLOSSARY.md`) and any ADRs in the area you're touching first.

Then spawn a sub-agent to walk the codebase. A sub-agent sees none of what you loaded, so give it the paths in scope, the hot spots and coupled pairs, the codebase-design glossary and the deletion test, the `GLOSSARY.md` terms, and the decisions of the ADRs in the area. Don't follow rigid heuristics; explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow**, with an interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates as an HTML report

Before you write a card, check at the code each fact that its badge rests on: count the callers with a search, look for the tests of the module, and make sure that each listed file exists. Lower the badge or drop the card when a fact is wrong. Read `../codebase-design/DEEPENING.md` to pick the dependency category of each card.

Write a single HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>/index.html` so each run gets a fresh folder.

Serve the report on the tailnet, so the user can read it from any of their devices:

1. Run `tailscale serve status`, and pick a path that no route uses, for example `/arch-review`. Leave every other route as it is.
2. Start `python3 -m http.server <port> --bind 127.0.0.1 --directory <report folder>` in the background, on a free port. `tailscale serve` sends a file or a folder only when it runs as root, and it proxies a local port without root.
3. Run `tailscale serve --bg --set-path /<path> http://127.0.0.1:<port>`.
4. Read the host name from the `DNSName` field of `tailscale status --self --json`, and make sure that `curl -s https://<host>/<path>/` returns the report's `<title>`.
5. Give the user the URL and the absolute path of the file.

If `tailscale` is not installed, or the host is not on a tailnet, open the file instead (`xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows), and tell the user why.

The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals: use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.

For each candidate, render a card with:

- **Files**: which files/modules are involved
- **Problem**: why the current architecture is causing friction
- **Solution**: plain English description of what would change
- **Benefits**: explained in terms of locality and leverage, and how tests would improve
- **Before / After diagram**: side-by-side, custom-drawn, illustrating the shallowness and the deepening
- **Recommendation strength**: one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

**Use GLOSSARY.md vocabulary for the domain, and the `/codebase-design` vocabulary for the architecture.** If `GLOSSARY.md` defines "Order," talk about "the Order intake module," not "the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly in the card (e.g. a warning callout: _"contradicts ADR-0007, but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

See [HTML-REPORT.md](HTML-REPORT.md) for the full HTML scaffold, diagram patterns, and styling guidance.

Do NOT propose interfaces yet. After the report is served, ask the user which candidates to file as issues, which to reject, and whether to grill one now. In the same list, offer to stop serving the report. On a yes, run `tailscale serve --https=443 --set-path /<path> off` and stop the `http.server` process. Do not run `tailscale serve --https=443 off`, because it removes every route on port 443, also the routes of the user. Offer the teardown again in the last reply of the run while the report is still served.

### 3. File the picked candidates

File each picked candidate as one issue in the project issue tracker (`docs/agents/issue-tracker.md`). The body carries its card: files, problem, solution, the before/after structure in words, and the recommendation strength. Apply the `needs-grilling` triage label (`docs/agents/triage-labels.md` maps the role to its label string), and the repo's refactor label when `gh label list` shows one. If the repo has no `needs-grilling` label yet, ask the user, then create it and add its row to `docs/agents/triage-labels.md`. Each issue is grilled later in a fresh session, with the tracker carrying the state.

**User rejects a candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing; skip ephemeral reasons ("not worth it right now") and self-evident ones. On a yes, write the ADR to `docs/adr/` at once, with the `domain-modeling` format. A rejection is in force when the user makes it, because no code waits for it, so it does not wait for an implementation branch.

### 4. Grilling loop (when the user grills one now)

Call the Skill tool with "grilling" to walk the decision tree with them: constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize; call the Skill tool with "domain-modeling" to keep the domain model current as you go. Record the Domain Docs in the candidate's issue, and file the issue first if it does not exist:

- **Naming a deepened module after a concept not in `GLOSSARY.md`?** Record the term as Domain Docs.
- **Sharpening a fuzzy term during the conversation?** Record the sharpened term as Domain Docs right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR as in step 3.
- **Want to explore alternative interfaces for the deepened module?** Call the Skill tool with "codebase-design" and use its design-it-twice parallel sub-agent pattern.
