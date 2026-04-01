# Giving Claude Code Access to Multiple Directories

There are three ways to give Claude Code access to additional folders, such as separate frontend and backend directories in a monorepo.

## Option 1: `--add-dir` CLI Flag (Per Session)

When launching Claude Code, pass `--add-dir` for each additional directory:

```bash
claude --add-dir ../frontend --add-dir ../backend
```

Or if you start Claude from the monorepo root and want to explicitly add subdirectories:

```bash
claude --add-dir ./frontend --add-dir ./backend
```

You can pass `--add-dir` multiple times to add as many directories as you need.

## Option 2: `/add-dir` Slash Command (Mid-Session)

If you are already in a Claude Code session and realize you need access to another folder, run:

```
/add-dir ../frontend
```

This adds the directory for the current session without restarting.

## Option 3: `additionalDirectories` Setting (Persistent)

To permanently configure additional directories so they are available every time you start Claude Code in a project, add `additionalDirectories` to your settings file. For a project-level config that your team shares, add it to `.claude/settings.json`:

```json
{
  "additionalDirectories": [
    "../frontend",
    "../backend"
  ]
}
```

For personal-only config, use `.claude/settings.local.json` instead.

## Loading CLAUDE.md Files from Added Directories

By default, CLAUDE.md files from additional directories are **not** loaded. If each sub-repo has its own CLAUDE.md with project-specific instructions you want Claude to see, set the `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` environment variable:

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../frontend --add-dir ../backend
```

This loads `CLAUDE.md`, `.claude/CLAUDE.md`, and `.claude/rules/*.md` from each added directory.

## Permissions in Added Directories

Files in additional directories follow the same permission rules as the main working directory: they are readable without prompts, and file editing permissions follow the current permission mode. There is no extra approval step just because a file lives in an added directory.

## Recommendation for Monorepos

If you always work across both the frontend and backend, the best approach is to add `additionalDirectories` to your project settings so it is automatic. Start Claude from the monorepo root and point to the sub-repos:

```json
{
  "additionalDirectories": [
    "./frontend",
    "./backend"
  ]
}
```

If different team members work on different parts of the monorepo, use `.claude/settings.local.json` instead so each developer can configure their own set of directories without affecting others. You can also use `claudeMdExcludes` in that file to skip CLAUDE.md files from other teams that are not relevant to your work.
