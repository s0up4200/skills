# Giving Claude Code Access to Multiple Folders

When working in a monorepo or across multiple repositories, you can use the `/add-dir` command within Claude Code to add additional directories to your session's context.

## Using `/add-dir`

While inside a Claude Code session, type:

```
/add-dir /path/to/other/folder
```

For example, if you launched Claude Code from your frontend repo but also need it to see the backend:

```
/add-dir /Users/you/projects/backend
```

You can add multiple directories by running the command more than once:

```
/add-dir /Users/you/projects/frontend
/add-dir /Users/you/projects/shared-libs
```

## Alternative: Start from the Monorepo Root

If both your frontend and backend live under a single monorepo root, the simplest approach is to just start Claude Code from that root directory:

```bash
cd /Users/you/projects/my-monorepo
claude
```

Claude Code will then have visibility into all subdirectories, including `frontend/`, `backend/`, `packages/`, and so on. This is often the easiest solution for true monorepos.

## Tips

- **CLAUDE.md files**: You can place a `CLAUDE.md` at the monorepo root with instructions that apply to the whole project, and additional `CLAUDE.md` files in subdirectories (e.g., `frontend/CLAUDE.md`, `backend/CLAUDE.md`) for context specific to each part. Claude Code reads these hierarchically.
- **Paths**: When using `/add-dir`, provide absolute paths to avoid ambiguity.
- **Working directory**: Claude Code's working directory is where you launched it from. Adding a directory gives Claude visibility into those files but does not change the working directory.
