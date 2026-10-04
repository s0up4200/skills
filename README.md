# s0up4200/skills

A personal collection of agent skills for Claude Code and compatible AI coding tools.

## Installation

### Skills CLI (any agent)

The fastest way to install. Works with Claude Code, Cursor, Windsurf, Codex, and other AI coding tools.

```bash
# Install all skills from this repo
npx skills add s0up4200/skills

# Install a specific skill
npx skills add s0up4200/skills --skill mobile-adapt
```

Skills are installed to your agent's skill directory (e.g., `~/.claude/skills/` for Claude Code, `.agents/skills/` for universal agents).

### Claude Code plugin

Register this repo as a plugin marketplace for bundle-based installation:

```bash
# In Claude Code, register the marketplace
/plugin marketplace add s0up4200/skills

# Then install a skill bundle
/plugin install ui-skills@s0up4200-skills
```

### Manual

Clone and symlink individual skills directly:

```bash
git clone https://github.com/s0up4200/skills.git /tmp/s0up4200-skills
cp -r /tmp/s0up4200-skills/skills/mobile-adapt ~/.claude/skills/mobile-adapt
```

## Available Skills

| Skill | Description |
|---|---|
| [mobile-adapt](skills/mobile-adapt/) | Adapt sites and apps for iPhone-class mobile web — audits navigation, safe areas, forms, tables, and charts for phone usability |
| [release-announcement](skills/release-announcement/) | Write a Discord release announcement from everything on main since the latest release tag |
| [github-resolution-audit](skills/github-resolution-audit/) | Find open GitHub Issues and Discussions whose requested work has shipped, whose bugs are fixed, or which duplicate another item |
| [labels](skills/labels/) | Label a GitHub PR or issue from the repo's existing labels, asking before it creates a new one |
| [file-issue](skills/file-issue/) | Draft an upstream GitHub issue from the repo's template, bots, and a reproduction, and post it only after the user reads the draft |
| [pr-conflicts](skills/pr-conflicts/) | Sweep open PRs for merge conflicts, apply the repo's conflict label, and remove it from PRs that merge cleanly again |
| [branch-cleanup](skills/branch-cleanup/) | Find dead local branches and worktrees, including squash-merged PRs and local-only branches, and write a backed-up cleanup script for the user to run. Explicit invocation only |
| [focus](skills/focus/) | Show the state of large chained work (epics with sub-issues and blocked-by edges) and recommend what to work on next |
| [findability](skills/findability/) | Read the last 10 Claude Code and Codex sessions in a repo, find where agents searched too long or followed stale docs, and propose navigation fixes. Requires the [`retro`](skills/mattpocock/retro/) skill |
| [perf-review](skills/perf-review/) | Review Go and TypeScript diffs, branches, or PRs for performance problems — allocations, O(n²) algorithms, N+1 queries, unbounded concurrency, re-render storms |
| [full-review](skills/full-review/) | Check that a PR does what it promises: /code-review, review-pr, a design pass for architecture and negative space, and /verify-review, then /prove-review, then post or fix. Explicit invocation only |
| [prove-review](skills/prove-review/) | Prove every claim in a review report with a probe, a mutation, or a quote, then attack it with two fresh verifier agents each round until neither finds a problem. Explicit invocation only |
| [post-review](skills/post-review/) | Post the last review report on a PR as a request-changes review, after an AI disclosure line and the unslop pass. Explicit invocation only, posts only after approval |
| [fix-review](skills/fix-review/) | Resolve the judgment calls, fix the last code-review findings, and push the fixes to the PR's source branch. Explicit invocation only |
| [verify-review](skills/verify-review/) | Verify the unresolved AI review threads on a PR against the code and report the fixes and refutations. `--fix` commits the fixes and posts the refutations with approval. Explicit invocation only |
| [tldr](skills/tldr/) | Rewrite the last reply as a short version in simple terms, with the simple-english reply rules and an unslop pass. Runs on `/tldr` or on a message that is only "tldr" |
| [go-proverbs](skills/go-proverbs/) | Question a Go plan or spec with the 19 Go proverbs from Rob Pike's Gopherfest 2015 talk before any code exists |
| [native-web](skills/native-web/) | Replace custom JavaScript and UI libraries with native web platform features — 42 tips from htmlcat.net with support tiers and caveats |
| [qbittorrent-upstream](skills/qbittorrent-upstream/) | Audit unreleased qBittorrent WebAPI and session changes and map each onto the work go-qbittorrent and qui need before the next release |
| [challenge-request](skills/challenge-request/) | Challenge a feature request from Discord or GitHub: find the real problem, check for existing features and duplicates, and give a verdict of yes, not now, already possible, no, or need more info. Explicit invocation only |

### From mattpocock/skills

Copies of skills from [mattpocock/skills](https://github.com/mattpocock/skills). See [UPSTREAM.md](UPSTREAM.md) for the upstream commit and the local changes.

| Skill | Description |
|---|---|
| [ask-matt](skills/mattpocock/ask-matt/) | Ask which skill or flow fits your situation. |
| [code-review](skills/mattpocock/code-review/) | Review changes since a fixed point against the repo's standards and the spec. |
| [codebase-design](skills/mattpocock/codebase-design/) | Shared vocabulary for designing deep modules. |
| [diagnosing-bugs](skills/mattpocock/diagnosing-bugs/) | Diagnosis loop for hard bugs and performance regressions. |
| [domain-modeling](skills/mattpocock/domain-modeling/) | Build and sharpen a project's domain model. |
| [grill-with-docs](skills/mattpocock/grill-with-docs/) | Interview the user about a plan and write ADRs and glossary entries along the way. |
| [implement](skills/mattpocock/implement/) | Implement a piece of work based on a spec or set of tickets. |
| [implement-spec](skills/mattpocock/implement-spec/) | Implement the result of /to-spec and /to-tickets in code. |
| [improve-codebase-architecture](skills/mattpocock/improve-codebase-architecture/) | Find deepening opportunities, report them as HTML, then grill through the one you pick. |
| [pr](skills/mattpocock/pr/) | Write a PR body that fills the repo's PR template, with a diagram only when the diff needs one. |
| [prototype](skills/mattpocock/prototype/) | Build a throwaway prototype to answer a design question. |
| [research](skills/mattpocock/research/) | Research a question in primary sources and write the findings to a Markdown file. |
| [retro](skills/mattpocock/retro/) | Conduct a retrospective on a coding session. |
| [setup-matt-pocock-skills](skills/mattpocock/setup-matt-pocock-skills/) | Set up a repo for the engineering skills: issue tracker, triage labels, and doc layout. |
| [tdd](skills/mattpocock/tdd/) | Test-driven development. |
| [to-spec](skills/mattpocock/to-spec/) | Turn the conversation into a spec and publish it to the issue tracker. |
| [to-tickets](skills/mattpocock/to-tickets/) | Break a plan or spec into tracer-bullet tickets with blocking edges. |
| [triage](skills/mattpocock/triage/) | Move issues and external PRs through triage and write agent-ready briefs. |
| [wayfinder](skills/mattpocock/wayfinder/) | Plan work too big for one session as a map of decision tickets. |
| [wizard](skills/mattpocock/wizard/) | Generate an interactive bash wizard that walks a human through steps only they can perform. |
| [grilling](skills/mattpocock/grilling/) | Grill the user relentlessly about a plan, decision, or idea. |
| [handoff](skills/mattpocock/handoff/) | Compact the current conversation into a handoff document for another agent to pick up. |
| [teach](skills/mattpocock/teach/) | Teach the user a new skill or concept, within this workspace. |
| [writing-for-agents](skills/mattpocock/writing-for-agents/) | Writing documents for agents. |

### From cursor/plugins

Copies of skills from [cursor/plugins](https://github.com/cursor/plugins). See [UPSTREAM.md](UPSTREAM.md) for the upstream commit and the local changes.

| Skill | Description |
|---|---|
| [unslop](skills/cursor/unslop/) | Cut AI tells from any writing. |

## Skill Structure

Each skill is a self-contained directory under `skills/`:

```
skills/
└── your-skill/
    ├── SKILL.md          # Required — YAML frontmatter + instructions
    ├── references/       # Optional — docs loaded on demand
    ├── scripts/          # Optional — executable helpers
    └── assets/           # Optional — templates, icons, fonts
```

See `template/SKILL.md` for a starter template and `CLAUDE.md` for authoring guidelines.

## License

MIT. The skills from mattpocock/skills keep their own MIT license. See [UPSTREAM.md](UPSTREAM.md).
