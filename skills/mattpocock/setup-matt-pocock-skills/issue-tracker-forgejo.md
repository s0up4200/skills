# Issue tracker: Forgejo

Issues and specs for this repo live as Forgejo issues. Use the `fj` CLI from the repository root. Infer the host and repository from the configured remote. Record any required remote selection here during setup.

## Conventions

- **Create an issue**: `fj issue create '<title>' --body-file <file> --no-template`. If the repository requires a template, use `--template` with an available template instead.
- **Read an issue**: `fj issue view <number>` and `fj issue view <number> comments`.
- **List issues**: `fj issue search --state open --all`. Use `--state all` when closed issues are needed.
- **Comment on an issue**: `fj issue comment <number> --body-file <file>`.
- **Apply / remove labels**: `fj issue edit <number> labels --add <label>` or `--rm <label>`. Apply labels after issue creation.
- **Edit a description**: `fj issue edit <number> body '<updated description>'`. Read the current description before editing and pass the replacement as one argument.
- **Close**: `fj issue close <number>`. Post an approved resolution comment first when one is required.
- **Label setup**: list labels with `fj repo labels view`. Create each approved missing label with `fj repo labels create '<name>' '<hex-color>'`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a Forgejo issue.

## When a skill says "fetch the relevant ticket"

Read its description, labels, and comments through **Read an issue** above.

## Map operations

These operations apply to specs and wayfinding maps. Membership states which issues belong to a parent. Blocking states which work must finish first.

- **Map**: one parent issue. A wayfinding map has the `wayfinder:map` label and its usual Notes / Decisions-so-far / Fog description.
- **Child ticket**: put `Part of #<parent>` at the top of the child description. Use the full parent URL across repositories. After creation, add the child under the parent's exact level-two heading `## Sub-issues`. Use `- [ ] #<child>` for the same repository, or a full issue URL for another repository. Optional descriptive text can follow the reference. Read the current parent description, preserve its other content, and add each child only once. Wayfinding children also use the configured `wayfinder:<type>` label.
- **Blocking**: use native dependencies. `fj issue depend add <child> <blocker>` makes the child depend on the blocker. Read its blockers with `fj issue depend list <child>`. A closed blocker no longer prevents work. Membership alone creates no blocking edge.
- **Frontier query**: follow the membership section in the parent and nested parents. Read each referenced issue and its native blockers. Keep open, unblocked, unclaimed issues. Use their order in the map. Report unreadable issues or blocker data as unavailable.
- **Claim**: `fj issue assign <number> <username>`, using the current Forgejo account.
- **Resolve**: post the resolution with `fj issue comment`, close the issue with `fj issue close`, and append a context pointer to the map's Decisions-so-far when the calling skill requires it.

### Membership format

```markdown
## Sub-issues

- [ ] #42
- [ ] #43 Optional description
- [ ] https://forgejo.example/owner/repo/issues/18
```

The section ends at the next level-one or level-two heading. Each task-list entry names one issue. References elsewhere, including comments, quoted text, and fenced examples, do not define membership.

Checked and unchecked entries both define membership. Read current issue state to determine whether work is complete. Nested parents use the same section. Remove duplicate issue identities and report cyclic paths or malformed entries as unavailable.
