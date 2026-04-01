# Giving Claude Code Access to Multiple Folders

Use the `--add-dir` flag to give Claude access to additional directories beyond your main working directory. This is exactly what you need for a monorepo where the frontend and backend live in separate folders.

## Basic Usage

```bash
claude --add-dir ../frontend ../backend
```

Or if you're launching from the monorepo root:

```bash
claude --add-dir ./apps/frontend ./apps/backend
```

You can pass multiple directories to `--add-dir` -- each path is validated to confirm it exists as a directory.

## Loading CLAUDE.md from Additional Directories

By default, `--add-dir` gives Claude file access to those directories but does **not** load their CLAUDE.md files. If your frontend and backend each have their own CLAUDE.md with project-specific instructions, set the `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` environment variable to also load those:

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../frontend ../backend
```

This loads `CLAUDE.md`, `.claude/CLAUDE.md`, and `.claude/rules/*.md` from each additional directory.

## Recommended Setup for a Monorepo

A practical approach for day-to-day use:

1. **Launch from the monorepo root** so Claude naturally picks up the top-level CLAUDE.md.
2. **Use `--add-dir`** to explicitly include the subdirectories you need if they are outside your working directory, or simply work from the root and let Claude navigate into subdirectories as needed.
3. **Put shared instructions in the root CLAUDE.md** and team-specific instructions in each sub-project's CLAUDE.md or `.claude/rules/` directory.

If you find yourself always passing the same flags, you can wrap the command in a shell alias:

```bash
alias claude-mono="CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ./frontend ./backend"
```

## Excluding Irrelevant CLAUDE.md Files

In large monorepos where other teams have their own CLAUDE.md files that are not relevant to your work, use the `claudeMdExcludes` setting in `.claude/settings.local.json` to skip them:

```json
{
  "claudeMdExcludes": [
    "**/other-team/CLAUDE.md",
    "**/other-team/.claude/rules/**"
  ]
}
```

This keeps your context clean and avoids conflicting instructions from parts of the monorepo you do not work on.
