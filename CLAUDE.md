# CLAUDE.md — Skills Repository

This is a personal skills repository for Claude Code and compatible AI coding tools. Skills are self-contained instruction sets that teach Claude how to perform specialized tasks.

This is a content-only repo — no package.json, no build system, no tests, no dependencies. All work is editing Markdown files and JSON.

## Repository Structure

```
CLAUDE.md            # Project instructions (this file)
AGENTS.md            # Symlink → CLAUDE.md (keeps both tools in sync)
README.md            # Installation instructions and skill index
LICENSE              # MIT
.gitignore
.claude-plugin/
  marketplace.json   # Plugin manifest — how Claude Code discovers installable bundles
skills/              # All skills live here, one directory per skill
template/
  SKILL.md           # Starter template for new skills
```

**Note:** `AGENTS.md` is a symlink to `CLAUDE.md`. Edits to CLAUDE.md automatically apply to both. Do not break the symlink by replacing it with a regular file.

## How Skills Work

A skill is a directory containing a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: skill-name        # Required. Lowercase hyphen-separated.
description: ...        # Required. Primary trigger mechanism — Claude reads this
                        # to decide when to invoke the skill.
---
```

The `description` field is critical — it determines whether Claude uses the skill. Claude tends to undertrigger (not use skills when they'd help), so descriptions should be explicit about contexts and trigger phrases.

### Progressive Disclosure

Skills use a three-level loading system to manage context efficiently:

1. **Metadata** (name + description) — always in Claude's context (~100 words)
2. **SKILL.md body** — loaded when the skill triggers (target: under 500 lines)
3. **Bundled resources** (references/, scripts/, assets/) — loaded on demand

Keep SKILL.md under 500 lines. If approaching that limit, move detailed content into `references/` files and add clear pointers from SKILL.md about when to read them.

## Adding a New Skill

1. Copy `template/SKILL.md` into a new directory under `skills/`:
   ```
   skills/your-skill-name/SKILL.md
   ```
2. Fill in the frontmatter (`name`, `description`) and the instruction body.
3. Add the skill path to the appropriate plugin bundle in `.claude-plugin/marketplace.json`.
4. If the skill needs supplementary material, organize it as:
   - `references/` — documentation loaded into context when needed. Include a table of contents for files over 300 lines.
   - `scripts/` — executable code for deterministic/repetitive tasks. Claude runs these without reading source to keep context clean.
   - `assets/` — templates, icons, fonts used in output.

### Naming Conventions

- **Directories:** lowercase, hyphen-separated (`mobile-adapt`, `data-pipeline`)
- **SKILL.md `name` field:** must match the directory name
- **Reference files:** descriptive names with context (`mobile-ui-2026.md`, not `ref.md`)

## Writing Good Skills

### Description (Frontmatter)

The description is the single most important field — it controls triggering. Include:

- What the skill does
- Specific user phrases and contexts that should trigger it
- Adjacent domains that should NOT trigger it (if ambiguity is likely)

Example of a good description:
```
Use when a user wants a site adapted for phones or mobile web, or mentions
responsive/mobile-first/iPhone/iOS Safari/touch/safe-area issues. Also use
for mobile audits, small-screen layout fixes, or form/table/chart adaptation.
```

### Instructions (Body)

- **Explain why, not just what.** "Every tap target should be 44x44px" is weaker than explaining that capacitive screens register finger center contact at ~44pt, and smaller targets cause mispress frustration in motion. Claude makes better judgment calls when it understands the reasoning.
- **Use imperative form.** "Audit the shell first" not "You should audit the shell first."
- **Include examples.** 2-3 before/after code snippets grounded in real platform behavior. Annotate examples with the source of truth (Apple HIG, WCAG spec, WebKit bug number).
- **Ground in research.** Reference specific standards, bug numbers, and dates. Platform behavior changes — skills should point to authoritative sources and encourage re-research for current guidance.
- **Keep it general.** Skills run across many projects. Write principles the model can apply with judgment, not rigid rules overfitted to one codebase.
- **Avoid heavy-handed MUSTs.** If you're writing ALWAYS or NEVER in all caps, reframe as reasoning. Claude is smart — explain the tradeoff and it will make the right call.

### Verification Sections

If the skill involves output that should be verified, include a verification section with:
- Specific pass conditions (not just "check X")
- Recommended tooling and how to use it
- Known platform bugs that affect verification
- Automated checks where possible (e.g., Playwright snippets)

### Reference Files

For platform-dependent skills, keep a dated reference file with:
- Authoritative sources and URLs
- Known bugs with workarounds and bug tracker links
- Practical defaults for common decisions
- Dates on all time-sensitive claims

This file should be updated when platform behavior changes. The SKILL.md body should point to it with guidance on when to read it.

## The Plugin Manifest

`.claude-plugin/marketplace.json` defines installable bundles:

```json
{
  "metadata": {
    "owner": "soup",
    "version": "1.0.0",
    "pluginRoot": "./skills"
  },
  "plugins": [
    {
      "name": "bundle-name",
      "description": "What this bundle contains",
      "source": "./skills",
      "skills": [
        "./skills/skill-one",
        "./skills/skill-two"
      ]
    }
  ]
}
```

When adding a skill, add its path to the relevant plugin's `skills` array. Group related skills into bundles (e.g., all UI/frontend skills in one bundle, all data processing skills in another). Create a new plugin entry when a skill doesn't fit existing bundles.

## Updating an Existing Skill

- Read the current SKILL.md before making changes.
- Preserve the `name` field — changing it breaks installed references.
- When updating reference files with new platform information, use absolute dates (not "recently" or "last month").
- After significant changes, verify the description still accurately reflects the skill's scope.

## Common Operations

Create a new skill:
```
cp template/SKILL.md skills/your-skill-name/SKILL.md
```

Verify a skill's frontmatter name matches its directory:
```
grep '^name:' skills/*/SKILL.md
```

Check marketplace.json lists all skills:
```
ls skills/*/SKILL.md
cat .claude-plugin/marketplace.json
```

## Quality Checklist

Before committing a new or updated skill:

- [ ] `name` in frontmatter matches directory name
- [ ] `description` is explicit about trigger contexts
- [ ] SKILL.md is under 500 lines
- [ ] Instructions explain "why" not just "what"
- [ ] Examples are grounded in authoritative sources
- [ ] Reference files have dated citations with URLs
- [ ] Skill path is listed in marketplace.json
