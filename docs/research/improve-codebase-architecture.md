# Research: improvements to improve-codebase-architecture

Date: 2026-10-24

Decisions on 2026-10-24 that change the proposals below:

- Item 5: the skill files each picked candidate as a `needs-grilling` issue, and writes a rejection ADR at once only when the user says yes. The agent cannot start `to-spec` itself, because that skill has `disable-model-invocation: true`.
- Item 8: the report keeps Tailwind, on the v4 browser CDN, because the user always runs the skill online. The report also follows the system dark mode.
- Item 2: the coupling command is the bundled `scripts/change-coupling.sh`.

Scope: `skills/mattpocock/improve-codebase-architecture/` (SKILL.md, HTML-REPORT.md), with the skills it loads (`codebase-design`, `grilling`, `domain-modeling`). Each item names a defect in the current text and a primary source. "Source" lines give what the source says. "Inference" lines give my reading.

## Summary

- Upstream did not change the skill after the recorded commit `5beb35b`. On 2026-10-24, the compare `5beb35b...main` is 0 commits ahead. Upstream has four open issues on the skill: #651 (the CDN breaks the report), #1256 (a Mermaid parse error on a dotted label), #1317 (no dark mode), and #923 (a refactor changed the UI).
- This note proposes ten improvements. Four have high confidence: the hot-spot command lists no files, the Mermaid example colours nodes where the text says edges, inline edge labels break on a period, and the local Domain Docs change leaves a rejected candidate's ADR with no place to land.
- The HTML report breaks offline. I verified this in headless Chromium. Item 8 has the fix.

---

## 1. The hot-spot command lists no files

Confidence: high.

Defect. SKILL.md step 1 says:

> Otherwise, walk back a good stretch of the commit history (`git log --oneline`) to find the codebase's hot spots, the files and areas that keep coming up

`git log --oneline` prints `<hash> <title-line>` for each commit and nothing else. It lists no files, so the agent cannot read "the files that keep coming up" from it. The agent guesses paths from commit subjects.

Source:

- git-log(1), 2.56.0: `--oneline` "is a shorthand for `--pretty=oneline --abbrev-commit` used together", and the `oneline` format is `<hash> <title-line>`. `--name-only` shows "only the name of each changed file in the post-image tree". https://git-scm.com/docs/git-log
- The upstream PR that added the step, mattpocock/skills#533, says it reads "the last ~20 commit messages (`git log --oneline -20`)". The PR reads messages, but the SKILL.md sentence asks for files. https://github.com/mattpocock/skills/pull/533
- Adam Tornhill defines a hot spot as the overlap of high change activity and complex code: "That overlap between complex code and high activity are the combined factors to guide our refactoring efforts." He measures complexity with lines of code or cyclomatic complexity. "Code as a Crime Scene", November 2013. https://www.adamtornhill.com/articles/crimescene/codeascrimescene.htm
- code-maat README: "Code churn is related to post-release defects. Modules with higher churn tend to have more defects." It limits the log with `--after=<date>`, because "many design issues do get fixed and we don't want old data to interfere". https://github.com/adamtornhill/code-maat (README at `50537ab`)

Fix. Replace the parenthesis with a command that counts changes per file. Add file size as the complexity proxy.

```sh
git log --since=6.months --format= --name-only | grep . | sort | uniq -c | sort -rn | head -20
```

Suggested wording:

> Otherwise, count how often each file changed in the last six months, and read the top of the list next to the size of each file: `git log --since=6.months --format= --name-only | grep . | sort | uniq -c | sort -rn | head -20`. A file that changes often and is large is a hot spot. Skip lock files and generated files.

Verification. I ran the command on this repo on 2026-10-24. The top results were `UPSTREAM.md` (54 changes), `README.md` (39), and `.claude-plugin/marketplace.json` (31). The command does not need `--no-merges`. git-log(1) says "unless one of --diff-merges variants ... is explicitly given, merge commits will not show a diff". The output was the same with and without `--no-merges` on this repo, which has 2 merge commits.

---

## 2. Add change coupling as the signal for leaks across a seam

Confidence: medium-high.

Defect. SKILL.md asks the explorer "Where do tightly-coupled modules leak across their seams?" but gives no method except reading code. A code reading misses coupling that has no import between the files.

Source:

- Tornhill: "Logical coupling refers to modules that tend to change together. Modules that are logically coupled have a hidden, implicit dependency between them." "Once we see the pattern of change, it usually suggests there's some smaller module looking to get out." "Typically, I ignore logical coupling below 30 percent." https://www.adamtornhill.com/articles/crimescene/codeascrimescene.htm
- code-maat computes the degree as "the number of shared revisions divided by the average number of revisions for the two coupled modules" (`src/code_maat/analysis/logical_coupling.clj`). Its defaults are 5 shared revisions minimum and 30 % coupling minimum, and it leaves out change sets of more than 30 files. https://github.com/adamtornhill/code-maat
- CodeScene, Tornhill's product, says: "Change coupling in itself is neither good nor bad." The meaning depends on which modules change together, and why. https://codescene.io/docs/guides/technical/change-coupling.html
- codebase-design defines locality as: "Change, bugs, knowledge, and verification concentrate in one place rather than spreading across callers."

Inference. Two files that change in the same commits most of the time hold one piece of knowledge in two places. In the skill's terms, that is low locality. If the two files are on different sides of a seam, the knowledge leaks across it. Some pairs change together by design, for example a file and its own test, or a migration and its model. Those pairs are not candidates. The signal shows where to look, and the deletion test still decides.

Fix. Add one optional command after the hot-spot command. It uses only git and awk, so the agent installs nothing.

```sh
git log --since=6.months --format='@%h' --name-only | awk '
/^@/ { flush(); n = 0; next }
NF   { f[++n] = $0 }
END  { flush()
       for (p in shared) { split(p, x, SUBSEP)
         if (shared[p] >= 5) printf "%d\t%d%%\t%s\t%s\n", shared[p], 200*shared[p]/(revs[x[1]]+revs[x[2]]), x[1], x[2] } }
function flush(  i, j) {
  if (n > 30) return
  for (i = 1; i <= n; i++) { revs[f[i]]++
    for (j = 1; j <= n; j++) if (f[i] < f[j]) shared[f[i], f[j]]++ } }
' | sort -rn | head -20
```

The columns are: shared commits, degree, file A, file B. The degree is the shared commits divided by the average commit count of the two files, as code-maat computes it. The limits (5 shared commits, commits of 30 files or fewer) are the code-maat defaults.

Suggested wording:

> To find coupling that a code reading misses, list the file pairs that change together (command). A pair above about 30 % that is not a file and its own test is a sign that one concept is split across a seam. Apply the deletion test before it becomes a candidate.

Verification. I ran the command on this repo on 2026-10-24. The top pair was `.claude-plugin/marketplace.json` and `README.md`, with 29 shared commits and 85 %. That is a real case: each new skill needs the same edit in two files. The command needs a POSIX shell with awk. Git Bash on Windows has one.

---

## 3. The Mermaid example colours nodes, but the text and legend say edges

Confidence: high.

Defect. HTML-REPORT.md says "Style with classDef to colour leakage edges red", and the header legend says "red arrow = leakage". The example is:

```
C -.leak.-> D[PricingClient]
classDef leak stroke:#dc2626,stroke-width:2px;
class C,D leak
```

`class C,D leak` applies the class to the nodes `C` and `D`. The arrow keeps the default colour.

Source. The Mermaid flowchart docs attach a class with `class nodeId1 className;`. Links "have no ids in the same way as nodes", so you style a link by its order number with `linkStyle`, for example "linkStyle 3 stroke:#ff3,stroke-width:4px,color:red;". An edge can also get an ID (`A e1@--> B`) and then take `class e1 name`. https://mermaid.js.org/syntax/flowchart.html (source file `packages/mermaid/src/docs/syntax/flowchart.md`)

Verification. I rendered the example with `mermaid@11`, which resolved to 11.17.2, in headless Chromium. The red stroke was on the nodes "OrderRepo" and "PricingClient", and on no edge. With `linkStyle 2 stroke:#dc2626,stroke-width:2px;`, the third edge was red and no node was red.

Fix. Replace the example. The new example also fixes item 4.

```
flowchart LR
  A[OrderHandler] --> B[OrderValidator]
  B --> C[OrderRepo]
  C -.->|"leak"| D[PricingClient]
  linkStyle 2 stroke:#dc2626,stroke-width:2px;
```

Change the sentence to: "Colour a leakage edge red with `linkStyle <n>`, where `<n>` counts edges from 0 in the order you write them. Use `classDef` and `class` for nodes, for example the deep module."

---

## 4. Inline edge labels break on a period

Confidence: high.

Defect. The example uses the inline dotted label `C -.leak.-> D`, and agents copy it. Mermaid ends that label at the first `.`, so a label such as `variable.pending` stops the whole diagram.

Source:

- mattpocock/skills#1256 (open): a real run wrote `S -.walks variable.pending.-> FV[(FormalVariable)]` and got "Lexical error on line 2. Unrecognized text." The maintainer's triage brief says to change the example to the pipe form and to "always write edge labels as -->|"..."| or -.->|"..."|". https://github.com/mattpocock/skills/issues/1256
- The Mermaid flowchart docs show the pipe form `A-->|text|B` and say "It is possible to put text within quotes in order to render more troublesome characters." https://mermaid.js.org/syntax/flowchart.html

Verification. In headless Chromium with Mermaid 11.17.2, the #1256 line rendered a "Syntax error in text" box. The pipe form with a quoted label, `C -.->|"leak: repo.price()"| D`, rendered.

Fix. Use the example from item 3, and add one rule under the Mermaid pattern:

> Write every edge label in pipe form with quotes, `-->|"label"|` or `-.->|"label"|`. Quote node labels that hold `( ) [ ] : .` or a code name: `A["Order (new)"]`. A diagram with a syntax error shows an error box in the browser, and you do not see it, because you do not open the page.

If upstream lands #1256, keep the upstream text.

---

## 5. A rejected candidate's ADR never lands (local change)

Confidence: high.

Defect. The local Domain Docs change changed step 3 to "Record the term as Domain Docs". UPSTREAM.md records this change as "Glossary entries and ADRs are Domain Docs in the plan until implementation". `domain-modeling` now says:

> While you plan (grilling, a wayfinder ticket, a spec), record each glossary entry and ADR as **Domain Docs** in the plan: the ticket resolution or the spec. Write `GLOSSARY.md` and `docs/adr/` files only on the implementation branch, during `/implement` or `/implement-spec`, with the code.

This skill makes no ticket and no spec, so the Domain Docs have no plan to go into. Step 3 also offers an ADR when the "User rejects the candidate", "so future architecture reviews don't re-suggest it". A rejected candidate never reaches `/implement`. Under the local rule, nobody writes its ADR, and the next review suggests the candidate again.

Source:

- The upstream text at `5beb35b` writes `GLOSSARY.md` directly ("Add the term to `GLOSSARY.md`"), so upstream does not have this gap. The local change made it. I diffed the local copy against `skills/engineering/improve-codebase-architecture/SKILL.md` at `5beb35b`.
- The reason for the local rule is mattpocock/skills#299: an ADR for work that is planned but not built reads as "in force" to later agents. https://github.com/mattpocock/skills/issues/299
- The maintainer's answer on mattpocock/skills#664: "file one ticket per candidate you want to pursue, then grill each in a fresh session, with the tracker carrying the state." https://github.com/mattpocock/skills/issues/664

Inference. A rejection ADR records a decision not to change the code. It is in force when the user makes it, so the #299 risk does not apply.

Fix. Add to step 3:

> Domain Docs need a plan to live in. When the grilling settles a candidate, call the Skill tool with "to-spec", or file a ticket for it, and put the Domain Docs there. An ADR for a rejected candidate is in force at once, because no code waits for it. Write it to `docs/adr/` on a new branch and offer a PR.

Add a matching line to the Domain Docs bullet in UPSTREAM.md.

---

## 6. The explorer sub-agent gets no scope, vocabulary, or glossary

Confidence: medium-high.

Defect. Step 1 decides the scope (hot spots or the user's direction), reads `GLOSSARY.md` and the ADRs, and loads `codebase-design`. Then it says: "Then spawn a sub-agent to walk the codebase." Nothing tells the agent to give the sub-agent the scope, the glossary terms, the ADRs in the area, or the deletion test. A sub-agent starts without them.

Source:

- Claude Code docs: a subagent "doesn't see your conversation history, the skills you've already invoked, or the files Claude has already read. Claude composes a delegation message that summarizes the task, and the subagent works from there." https://code.claude.com/docs/en/sub-agents
- The sibling pattern in `codebase-design/DESIGN-IT-TWICE.md` already says: "Include both [SKILL.md] vocabulary and GLOSSARY.md vocabulary in the brief".

Fix. After "Then spawn a sub-agent to walk the codebase", add:

> Give it the paths in scope, the codebase-design glossary and the deletion test, the `GLOSSARY.md` terms, and the decisions of the ADRs in the area. Then it explores where change lands and does not propose what an ADR settled.

---

## 7. Check the claims of a card before it goes into the report

Confidence: medium.

Defect. The report comes from the notes of one sub-agent. The cards state call-site counts ("leverage: one interface, N call sites"), deletion-test results, and test coverage. Nothing checks these facts at the code before a card gets a `Strong` badge.

Source:

- A sibling skill had the same failure, and a local change fixed it. `code-review` tells the agent to "check at the source each severity claim that depends on ... the behaviour of a caller", because "one sub-agent called a failed read 'silent at the default log level', but DEBUG was the default log level of the app". See `skills/mattpocock/code-review/SKILL.md` line 115 and the UPSTREAM.md local changes.
- mattpocock/skills#923 (open): a real run deepened a module and dropped a conditional-render branch, and types, tests, and review all passed. The commenter thinks that the agent called a wrapper "shallow" without a check of what its callers need. That cause is the commenter's inference. https://github.com/mattpocock/skills/issues/923

Fix. At the start of step 2, add:

> Before you write a card, check at the code each fact that its badge rests on. Count the callers with a search, look for the tests of the module, and make sure that each listed file exists. Lower the badge or drop the card when a fact is wrong.

The check costs a few searches per card, and it matches the repo rule to check each claim at its source. I found no run of this skill with a wrong card, so the confidence is medium.

---

## 8. The report breaks offline or when a CDN script is blocked

Confidence: medium. The failure has high confidence. The best fix is a design choice that upstream did not make yet.

Defect. HTML-REPORT.md starts with "a single self-contained HTML file", but the scaffold loads two scripts from CDNs:

```html
<script src="https://cdn.tailwindcss.com"></script>
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
```

The before/after columns use Tailwind classes. Without Tailwind, the columns stack and the side-by-side view is lost.

Source:

- mattpocock/skills#651 (open): a real run opened as "completely unstyled raw HTML", with "no Tailwind, no Mermaid rendering", after a security hook added SRI hashes. The maintainer's triage note calls it a design question. https://github.com/mattpocock/skills/issues/651
- Tailwind docs: "The Play CDN is designed for development purposes only, and is not intended for production." The current Play CDN is `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`. https://tailwindcss.com/docs/installation/play-cdn
- On 2026-10-24, `https://cdn.tailwindcss.com` redirected to `/3.4.17`, and the script logged "cdn.tailwindcss.com should not be used in production". The scaffold loads the v3 Play CDN, which the current docs do not show.

Verification. In headless Chromium with the network off, the `grid` element of the scaffold computed `display: block`, and the Mermaid `<pre>` showed raw source text. With the network on, both rendered.

Inference. "Not for production" matters little for a local report that the user throws away. The real cost is the network dependency and the false claim of "self-contained".

Fix. Drop Tailwind. Tell the agent to write the layout in the existing `<style>` block. A two-column grid, a card, a badge, and colour tokens take about 30 lines of CSS. Keep Mermaid from the CDN as the one network script. Say that when it does not load, the raw diagram text shows and the hand-built SVG diagrams still render. Change "The only scripts are the Tailwind CDN and the Mermaid ESM import" to match. If upstream decides #651 in a different way, follow upstream.

---

## 9. The dependency-category tag needs DEEPENING.md, which the skill never opens

Confidence: medium.

Defect. HTML-REPORT.md asks for "a tag for the dependency category (`in-process`, `local-substitutable`, `ports & adapters`, `mock`)". Only `codebase-design/DEEPENING.md` defines these categories. SKILL.md loads `codebase-design`, and that SKILL.md links DEEPENING.md only under "Going deeper". Nothing tells the agent to open it before it tags a card.

Source. The same gap happened with `GUARDING.md`. UPSTREAM.md says: "When the line pointed only to `codebase-design`, an agent loaded that skill but did not open `GUARDING.md`, and a spec shipped with no guard." The fix there named the file by its path.

Fix. In SKILL.md step 2, add: "Read `../codebase-design/DEEPENING.md` to pick the dependency category of each card."

---

## 10. The Tone rules ban "wrapper" and "layer", and the examples use them

Confidence: high. Impact: low.

Defect. The Tone section of HTML-REPORT.md says: "**Never substitute:** ... layer, wrapper (for module, when you mean module)." The same file has the Wins example "Delete 4 shallow wrappers", the glossary Wins example "implementation absorbs the wrappers", and the cross-section pattern "Before: 6 thin layers each doing nothing". In each example, the word means a module.

Source. HTML-REPORT.md itself, and the codebase-design glossary entry for Module: "_Avoid_: unit, component, service".

Fix. Use "Delete 4 shallow modules", "implementation absorbs the shallow modules", and "Before: 6 shallow modules that a call passes through, each doing nothing."

---

## Considered and rejected

- Pin Mermaid to an exact version (`mermaid@11.17.2`). The jsDelivr README documents major ranges such as `@3` as supported, and warns only against tags and `latest`. No run failed because of the range. Pin only if the report adds SRI.
- Change `securityLevel: "loose"` to `"strict"`. The Mermaid docs say that `strict` is the default and disables click functionality, and the report uses no clicks, so the change costs nothing. But in my test with Mermaid 11.17.2, an `onerror` payload in a node label ran under both `loose` and `strict`, and `strict` still rendered `<b>`. The change does not give the protection that the #651 comment expects. Do it as a cleanup with item 8, not as a security fix.
- Run `mermaid.parse` before the agent writes the file (#1256). It needs Node and a Mermaid download at run time, and the repo rules forbid that. Item 4 removes the known cause.
- Dark mode (#1317). The complaint is real, but it is about comfort, not a defect. With the inline CSS of item 8, it is one `prefers-color-scheme` block.
- A UI-preservation gate, or a UI sentence in the deletion test (#923). The failure happened during implementation, which this skill does not do. Upstream did not decide where a check belongs.
- A Markdown report in place of HTML (#920). The maintainer closed it: the HTML report is deliberate.
- Module secrets, connascence, and progressive disclosure as new lenses (#180, #303). Upstream closed them as new lenses with no failed run.
- One ticket per candidate after the report (#664). Item 5 covers the hand-off to to-spec or a ticket. No failure supports a wider workflow section.
- "Benefits" in SKILL.md and "Wins" in HTML-REPORT.md. The two names describe one field, and no run failed because of them.
- "collapse animations" in SKILL.md and "static" in HTML-REPORT.md. A CSS animation is not a script, so the two do not conflict.
