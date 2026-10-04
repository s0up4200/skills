#!/usr/bin/env python3
"""Count how often each skill in a folder ran in recent agent sessions.

Usage: usage.py <skills-dir>

Reads Claude Code transcripts (~/.claude/projects, subagents excluded) and
Codex rollouts (~/.codex/sessions) of the last 30 days. Counts two kinds of
use per skill: typed (a slash command or a /name inside a user message, in
either tool) and model (a Skill tool call). Prints one row per skill and the
projects where it ran most. Codex projects start with "codex:". Stdlib only.
"""

import collections
import json
import re
import sys
import time
from pathlib import Path

HOME = Path.home()
DAYS = 30
SLASH = re.compile(r"(?:^|\s)/([a-z][\w-]+)(?=[\s.,:;!?)]|$)")
COMMAND = re.compile(r"<command-name>/?([\w:-]+)</command-name>")


def main():
    skills = {p.parent.name for p in Path(sys.argv[1]).glob("*/SKILL.md")}
    cutoff = time.time() - DAYS * 86400
    typed, model = collections.Counter(), collections.Counter()
    sessions = collections.defaultdict(set)
    projects = collections.defaultdict(collections.Counter)

    def count(names, ctr, f, project):
        for s in set(names) & skills:
            ctr[s] += 1
            if f not in sessions[s]:
                sessions[s].add(f)
                projects[s][project] += 1

    claude = [f for f in (HOME / ".claude/projects").glob("*/*.jsonl") if f.stat().st_mtime > cutoff]
    for f in claude:
        project = f.parent.name.replace(str(HOME).replace("/", "-") + "-", "")
        for line in f.open(errors="ignore"):
            try:
                d = json.loads(line)
            except ValueError:
                continue
            c = (d.get("message") or {}).get("content")
            if isinstance(c, list):
                for b in c:
                    if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "Skill":
                        count([b["input"].get("skill", "")], model, f, project)
            elif d.get("type") == "user" and not d.get("isMeta") and isinstance(c, str):
                if c.startswith("<system-reminder>"):
                    continue
                count(COMMAND.findall(c) or SLASH.findall(c), typed, f, project)

    rollouts = [f for f in (HOME / ".codex/sessions").rglob("*.jsonl") if f.stat().st_mtime > cutoff]
    for f in rollouts:
        project = "codex"
        for line in f.open(errors="ignore"):
            try:
                d = json.loads(line)
            except ValueError:
                continue
            p = d.get("payload") or {}
            if d.get("type") == "turn_context" and p.get("cwd"):
                project = "codex:" + Path(p["cwd"]).name
            elif p.get("type") == "message" and p.get("role") == "user":
                for b in p.get("content") or []:
                    text = b.get("text", "")
                    # Skip injected context such as <environment_context>.
                    if not text.startswith("<"):
                        count(SLASH.findall(text), typed, f, project)

    print(f"{len(claude)} Claude sessions, {len(rollouts)} Codex sessions, last {DAYS} days")
    print(f"{'skill':32}{'typed':>6}{'model':>7}{'sessions':>9}  top projects")
    for s in sorted(skills, key=lambda s: -len(sessions[s])):
        top = ", ".join(f"{p} {n}" for p, n in projects[s].most_common(3))
        print(f"{s:32}{typed[s]:>6}{model[s]:>7}{len(sessions[s]):>9}  {top}")


if __name__ == "__main__":
    main()
