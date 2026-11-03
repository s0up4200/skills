---
name: pr
description: "Use when writing a PR title or body."
metadata:
  credits:
    skill: show-me
    author: Dex Horthy
    organisation: Humanlayer
    url: "https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md"
---

Use the PR template of the repository. Look for it in `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE/`, `docs/`, or the repository root. Fill in every section that the template asks for, and tick only the checklist items that are true.

The default body is one sentence that says what the PR does and why: "adds X to get Y", "fixes Z when W". Add Summary and Evidence only when the diff alone would confuse a reviewer. Every body gets the Merge danger line. Put each part in the template section that fits it.

If the repository has no template, use this one:

```markdown
<one sentence: what the PR does and why>

<optional: diagram, diff-sketch, or tree>

**Merge danger:** <one-way or two-way door>, <blast radius in one word>
```

## Title

For a fix, name the symptom that users see, not the code that changed. Make the title as wide as the fix. If the fix covers SQLite and Postgres, the title does not name only SQLite.

## Parent issue

When the PR closes a sub-issue, read its parent and the siblings:

```bash
gh issue view <child> --json parent --jq .parent.number
gh issue view <parent> --json subIssues --jq '.subIssues.nodes[]|"#\(.number) \(.state)"'
```

If the PR closes every sub-issue that is still open, add `Closes #<parent>` too, so the parent closes when the PR merges. Skip a parent with the `wayfinder:map` label, because wayfinder decides when a map is done. On Forgejo, read the parent's `## Sub-issues` task list.

## Prose

Before you show or post the body, write all of its prose with the `simple-english` skill, then apply the `unslop` skill to it. Apply both to prose only: the template headings, checklists, code blocks, and diagrams stay as they are.

If the Skill tool cannot start a skill, find its `SKILL.md` in the installed skills folder, read it, and apply it. The upstream `unslop` sets `disable-model-invocation`, so this is the path for it.

If a skill is not installed, ask the user if they want to install it:

- `simple-english`: `npx skills add aminblg/simpleenglish --skill simple-english` ([skills.sh](https://www.skills.sh/aminblg/simpleenglish/simple-english))
- `unslop`: `npx skills add cursor/plugins --skill unslop` ([skills.sh](https://www.skills.sh/cursor/plugins/unslop))

If the user says no, write the body without that skill and tell the user which pass you skipped.

## Sections

Skip all preambles and keep prose brief. Use the user's domain language from `GLOSSARY.md`.

### Summary

Pick the smallest view that makes the key point clear.

- Show logic or an algorithm as pseudocode:

```text
on(save)
  if content is unchanged
    return cached result
  write new content
  return fresh result
```

- Show runtime control flow as a call tree:

```text
submitForm
  createSession
    persistPrompt
    launchAgent
  navigateToSession
```

- Show UI structure as a component tree, including state and module boundaries that matter:

```text
<SessionPage> (apps/example/src/routes/session.tsx)
  useSessionEvents()
  <SessionToolbar>
    <RunSkillButton> (packages/ui)
```

- Show file responsibility or a broad refactor as a shallow file tree:

```text
src/
├── commands/       # parses user actions
├── sessions/       # owns session state
└── transport/      # sends API requests
```

- Show component interaction, control flow, or data flow with Mermaid:

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Daemon
    User->>UI: choose command
    UI->>Daemon: send expanded prompt
    Daemon-->>UI: stream result
```

- Use `diff` when the point is what changes and the surrounding shape already exists. Match the diff shape to the topic.

For a component change:

```diff
 <SessionPage>
   useSessionEvents()
   <SessionToolbar>
+    <RunSkillButton />
   <SessionTimeline>
+    <SkillResultCard />
```

For a file-layout change:

```diff
 src/
 ├── commands/
+│   └── show-me.ts       # expands the slash command
 ├── sessions/
-└── transport.ts
+└── transport/
+    ├── client.ts
+    └── stream.ts
```

For a call-tree or call-stack change:

```diff
 submitForm
   createSession
     persistPrompt
+    expandSkillMention
     launchAgent
-  navigateToSession
+  navigateToSession
+    subscribeToEvents
```

For a state or control-flow change:

```diff
 on(save)
-  write content
+  if content is unchanged
+    return cached result
+  write new content
+  invalidate cache
```

- Show the whole block when most of it is new, when omitted context would hide ownership or order, or when the user needs a copyable target shape:

```ts
function expandSkill(command: string): string {
  const skillName = command.slice(1);
  return `use the ${skillName} skill`;
}
```

#### Guidance

Place each visual next to the short text it supports. Keep only the calls, files, props, states, and boundaries needed to answer the user's current question or the options to resolve the current discussion point.

You may use one of these, you may use several, it is unlikely you will use all of them. Use your judgement and don't overwhelm the user.

### Evidence

Give evidence only for what CI cannot see: a manual run of the built binary, real output, a screenshot of a visual change, or the specific edge case that the change targets. Do not list lint, unit tests, builds, or other commands that CI runs. If CI covers everything, write one short sentence that says so.

Screenshots are the best evidence when the change is visual and the environment can make them. Show a before and an after.

### Performance

When the template or the repo instructions ask for a Performance section, write it from the full measurement report. If the session kept the report's path, read the file. Give the reviewer the result, and leave the raw tool output in the file:

1. One sentence with the conclusion: faster, slower, or within noise, and by how much.
2. One table with a row for each measured path and a column for each metric. Each cell holds base → head, and the difference or `~` for within noise.
3. One line with the workload, the environment, the method, and the base and head revisions.

Fit each item that the template comment or the repo instructions ask for into these three parts. When they ask for the raw tool output, put it under the table in a collapsed `<details>` block. When nothing in the diff can affect performance, follow the template: keep the section with one sentence that says why, or delete it.

```markdown
## Performance

The new field adds no measurable cost to the torrent list.

| Path | Time | Memory | Allocs |
|---|---|---|---|
| `GetTorrentsWithFilters`, 1 instance | 9.83 → 9.69 ms ~ | 25.4 → 24.9 MiB ~ | 757 → 759 ~ |
| `GetCrossInstanceTorrentsWithFilters`, 2 instances | 23.7 → 22.7 ms ~ | 64.7 → 63.1 MiB ~ | 41.01k → 41.02k +0.03% |

10,000 torrents per instance from a fake qBittorrent, page limit 300. `go test -bench`, base and head alternated 10 times, `~` is within noise per benchstat. Base bddc8de, head c03f858, go1.27.3 on a Ryzen 7 8745HS.
```

### Merge danger

Use one line. Add a sentence only when the risk is not clear from the line. If the template has no section for risk, put the line at the end of the section that describes the change.

Describe whether it's a one-way or two-way door. You can walk back through two-way doors, but not one-way doors. A PR that is cheap to roll back is lower risk. Changes that involve destructive actions or hard-to-reverse decisions are one-way doors.

The blast radius is the potential impact or scope of the changes introduced by this PR. Consider all possibilities. Examples are layout shift, breakages for consumers, mobile responsiveness, etc.

## After the PR opens

When you opened the pull request in this turn, run the `verify-review` skill on it next. It waits for the first bot review, and it compacts the session when it stops.
