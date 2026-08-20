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
| [labels](skills/labels/) | Label a GitHub PR or issue from the repo's existing labels, asking before it creates a new one |
| [pr-conflicts](skills/pr-conflicts/) | Sweep open PRs for merge conflicts, apply the repo's conflict label, and remove it from PRs that merge cleanly again |
| [perf-review](skills/perf-review/) | Review Go and TypeScript diffs, branches, or PRs for performance problems — allocations, O(n²) algorithms, N+1 queries, unbounded concurrency, re-render storms |
| [go-proverbs](skills/go-proverbs/) | Question a Go plan or spec with the 19 Go proverbs from Rob Pike's Gopherfest 2015 talk before any code exists |

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

MIT
