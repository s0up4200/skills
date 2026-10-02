#!/usr/bin/env python3
"""Find the newest coding-agent sessions for a repo and write a digest of each.

Usage: sessions.py <repo-path> [-n 10] [--out DIR]

Reads Claude Code transcripts (~/.claude/projects) and Codex rollouts
(~/.codex/sessions) whose working directory is the repo or one of its git
worktrees. Writes DIR/<id>.txt per session and prints one summary line each.
Stdlib only.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

HOME = Path.home()
CLAUDE = HOME / ".claude" / "projects"
CODEX = HOME / ".codex" / "sessions"

# A tool call counts as a search when it only looks for or reads information.
SEARCH_TOOLS = {"Read", "Grep", "Glob", "LS", "WebFetch", "WebSearch", "ToolSearch"}
SEARCH_CMD = re.compile(r"^\s*(cd [^;&|]+(&&|;)\s*)?(rg|grep|find|fd|ls|cat|head|tail|sed -n|tree|wc|jq|type|command -v|git (status|diff|branch|remote|rev-parse|log|show|grep|blame|ls-files)|(\S*/)?gh (issue|pr|api|search) )")
EDIT_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit", "apply_patch"}
FAIL = re.compile(r"No such file|not found|No matches found|No files found|does not exist|exit_code\":\s*[1-9]|Exit code [1-9]|error:", re.I)
NOISE_PROMPT = re.compile(r"^(<local-command|<command-name>/clear|Caveat:|# AGENTS\.md instructions|<environment_context>|<skill>|<permissions|<user_instructions>)")


def worktrees(repo):
    try:
        out = subprocess.run(["git", "-C", repo, "worktree", "list", "--porcelain"],
                             capture_output=True, text=True, check=True).stdout
        paths = [l[9:] for l in out.splitlines() if l.startswith("worktree ")]
    except (subprocess.CalledProcessError, FileNotFoundError):
        paths = []
    return sorted({os.path.realpath(p) for p in paths + [repo]})


def under(cwd, roots):
    cwd = os.path.realpath(cwd or "")
    return any(cwd == r or cwd.startswith(r + os.sep) for r in roots)


def slug(p):
    return re.sub(r"[^A-Za-z0-9]", "-", p)


def first_json(path, pred, limit=200):
    with open(path, errors="replace") as f:
        for i, line in enumerate(f):
            if i >= limit:
                break
            try:
                d = json.loads(line)
            except ValueError:
                continue
            if pred(d):
                return d
    return None


def ts(s):
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except (AttributeError, ValueError):
        return None


def clip(s, n):
    s = " ".join(str(s).split())
    return s if len(s) <= n else s[:n] + f"…[+{len(s) - n}]"


def find_claude(roots):
    prefixes = [slug(r) for r in roots]
    for d in CLAUDE.iterdir() if CLAUDE.is_dir() else []:
        if not any(d.name == p or d.name.startswith(p + "-") for p in prefixes):
            continue
        for f in d.glob("*.jsonl"):
            meta = first_json(f, lambda x: "cwd" in x)
            if meta and under(meta["cwd"], roots):
                yield {"harness": "claude", "path": f, "id": f.stem, "mtime": f.stat().st_mtime}


def find_codex(roots):
    cutoff = time.time() - 90 * 86400
    for f in CODEX.rglob("rollout-*.jsonl") if CODEX.is_dir() else []:
        st = f.stat()
        if st.st_mtime < cutoff:
            continue
        meta = first_json(f, lambda x: x.get("type") == "session_meta", limit=3)
        if not meta:
            continue
        p = meta.get("payload", {})
        # Subagent, guardian and forked threads belong to a parent session.
        if not isinstance(p.get("source"), str) or p.get("forked_from_id"):
            continue
        if under(p.get("cwd"), roots):
            yield {"harness": "codex", "path": f, "id": p.get("id", f.stem), "mtime": st.st_mtime}


class Digest:
    def __init__(self):
        self.lines, self.calls, self.searches = [], 0, 0
        self.first_edit, self.fails = None, 0
        self.prompt, self.t0, self.t1 = None, None, None

    def time(self, s):
        t = ts(s)
        if t:
            self.t0 = min(self.t0 or t, t)
            self.t1 = max(self.t1 or t, t)

    def user(self, text):
        text = text.strip()
        if not text or NOISE_PROMPT.match(text):
            return
        self.prompt = self.prompt or clip(text, 160)
        # A loaded skill body arrives as a user message; its first line is enough.
        self.lines.append(f"USER: {clip(text, 160 if text.startswith('Base directory for this skill') else 1500)}")

    def say(self, text):
        if text.strip():
            self.lines.append(f"ASSISTANT: {clip(text, 600)}")

    def call(self, name, args):
        self.calls += 1
        cmd = args.get("command") or args.get("cmd") or ""
        # Codex "exec" wraps shell commands in JavaScript: tools.exec_command({cmd:"..."}).
        cmds = re.findall(r'cmd:\s*"((?:[^"\\]|\\.)*)"', str(cmd)) if name == "exec" else []
        if cmds:
            cmd = " ; ".join(c.encode().decode("unicode_escape", "replace") for c in cmds)
        path = args.get("file_path") or args.get("path") or args.get("pattern") or ""
        search = name in SEARCH_TOOLS or (bool(cmds) and all(SEARCH_CMD.match(c) for c in cmds)) \
            or (not cmds and bool(SEARCH_CMD.match(str(cmd))))
        if name in EDIT_TOOLS or "apply_patch" in str(args)[:200]:
            self.first_edit = self.first_edit or self.calls
        if search:
            self.searches += 1
        tag = "SEARCH" if search else "TOOL"
        shown = cmd or path or json.dumps(args, ensure_ascii=False)
        self.lines.append(f"#{self.calls} {tag} {name}: {clip(shown, 400)}")

    def result(self, text, error=False):
        failed = error or bool(FAIL.search(text[:2000]))
        self.fails += failed
        self.lines.append(f"  {'FAIL' if failed else '->'} {clip(text, 300)}")

    def header(self, s):
        dur = f"{(self.t1 - self.t0) / 60:.0f}m" if self.t0 and self.t1 else "?"
        before = (self.first_edit - 1) if self.first_edit else self.calls
        return (f"session {s['id']} ({s['harness']}) {s['path']}\n"
                f"start {datetime.fromtimestamp(self.t0 or s['mtime']):%Y-%m-%d %H:%M} span {dur} "
                f"calls {self.calls} searches {self.searches} calls-before-first-edit {before} "
                f"failed-results {self.fails}\n")


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(c.get("text", "") if isinstance(c, dict) else str(c) for c in content)
    return json.dumps(content, ensure_ascii=False)


def digest_claude(path, d, label=None):
    if label:
        d.lines.append(f"== subagent: {label}")
    with open(path, errors="replace") as f:
        for line in f:
            try:
                e = json.loads(line)
            except ValueError:
                continue
            d.time(e.get("timestamp"))
            msg = e.get("message") or {}
            content = msg.get("content")
            if e.get("type") == "user":
                if isinstance(content, str):
                    if not label:
                        d.user(content)
                else:
                    for c in content or []:
                        if c.get("type") == "tool_result":
                            d.result(text_of(c.get("content")), c.get("is_error") is True)
                        elif c.get("type") == "text" and not label:
                            d.user(c.get("text", ""))
            elif e.get("type") == "assistant":
                for c in content or []:
                    if c.get("type") == "text":
                        d.say(c["text"])
                    elif c.get("type") == "tool_use":
                        d.call(c.get("name"), c.get("input") or {})


def digest_codex(path, d):
    with open(path, errors="replace") as f:
        for line in f:
            try:
                e = json.loads(line)
            except ValueError:
                continue
            d.time(e.get("timestamp"))
            if e.get("type") != "response_item":
                continue
            p = e.get("payload", {})
            t = p.get("type")
            if t == "message" and p.get("role") == "user":
                d.user(text_of(p.get("content")))
            elif t == "message" and p.get("role") == "assistant":
                d.say(text_of(p.get("content")))
            elif t in ("function_call", "custom_tool_call", "local_shell_call"):
                raw = p.get("arguments") or p.get("input") or p.get("action") or {}
                try:
                    args = json.loads(raw) if isinstance(raw, str) else raw
                except ValueError:
                    args = {"cmd": raw}
                if not isinstance(args, dict):
                    args = {"cmd": str(args)}
                d.call(p.get("name") or t, args)
            elif t in ("function_call_output", "custom_tool_call_output", "local_shell_call_output"):
                d.result(text_of(p.get("output")))
    # ponytail: Codex subagent threads are skipped; read them from their parent_thread_id if a session needs them.


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repo")
    ap.add_argument("-n", type=int, default=10)
    ap.add_argument("--out", default=".")
    a = ap.parse_args()

    roots = worktrees(os.path.realpath(a.repo))
    found = sorted([*find_claude(roots), *find_codex(roots)], key=lambda s: s["mtime"], reverse=True)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    kept = 0
    for s in found:
        if kept >= a.n:
            break
        d = Digest()
        if s["harness"] == "claude":
            digest_claude(s["path"], d)
            sub = s["path"].with_suffix("") / "subagents"
            for f in sorted(sub.glob("agent-*.jsonl")) if sub.is_dir() else []:
                meta = f.with_suffix(".meta.json")
                label = json.loads(meta.read_text()).get("description", f.stem) if meta.exists() else f.stem
                digest_claude(f, d, label)
        else:
            digest_codex(s["path"], d)
        if not d.prompt or d.calls == 0:
            continue  # empty or /clear-only session
        if "findability" in d.prompt.lower():
            continue  # an earlier run of this skill
        kept += 1
        short = s["id"][:8]
        h = d.header(s)
        (out / f"{short}.txt").write_text(h + "\n" + "\n".join(d.lines) + "\n")
        print(f"{short} {s['harness']:6} {h.splitlines()[1]} | {d.prompt}")
    mem = CLAUDE / slug(os.path.realpath(a.repo)) / "memory"
    print(f"memory: {mem if mem.is_dir() else 'none'}")
    if kept == 0:
        print(f"no sessions found for {roots}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
