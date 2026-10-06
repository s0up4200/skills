#!/usr/bin/env python3
"""Build the review-retro corpus: the team's review feedback on every PR of a GitHub repo.

Usage: corpus.py <owner/repo> --out <dir> [--team login,login]

Fetches inline review comments and PR conversation comments for the whole repo (two
paginated calls), then the review bodies of each PR (one call per PR, 8 in parallel).
Keeps a comment when its author is on the team and is not a bot. A team member's
comment on their own PR is kept only when it replies to a bot finding, because those
replies are where the team agrees with or refutes the bot.

Team: author_association OWNER, MEMBER, or COLLABORATOR, or the logins in --team
(which then replace the association test). Bot: user.type "Bot" or a "[bot]" login.

Writes <dir>/corpus.json and <dir>/chunk-<n>.json (items sorted by PR number, each
chunk at most 190 KB), and prints the counts the report header needs.
"""
import argparse
import collections
import json
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor

ENV = {**os.environ, "MISE_QUIET": "1"}  # a mise gh wrapper prints status lines to stdout
CHUNK_BYTES = 190 * 1024
TEAM_ASSOC = {"OWNER", "MEMBER", "COLLABORATOR"}
FIELDS = "u: .user.login, t: .user.type, at: .author_association, url: .html_url, body"


def api(path, jq, check=True):
    p = subprocess.run(["gh", "api", "--paginate", path, "--jq", jq],
                       capture_output=True, text=True, env=ENV, check=check)
    if p.returncode != 0:
        return None
    return [json.loads(line) for line in p.stdout.splitlines() if line]


def is_bot(c):
    return c["t"] == "Bot" or c["u"].endswith("[bot]")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repo")
    ap.add_argument("--out", required=True)
    ap.add_argument("--team", help="comma-separated logins; replaces the association test")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    team = set(a.team.split(",")) if a.team else None

    def on_team(c):
        return not is_bot(c) and (c["u"] in team if team else c["at"] in TEAM_ASSOC)

    prs = api(f"repos/{a.repo}/pulls?state=all&per_page=100", ".[] | {n: .number, a: .user.login}")
    author = {p["n"]: p["a"] for p in prs}
    inline = api(f"repos/{a.repo}/pulls/comments?per_page=100",
                 f'.[] | {{id, irt: .in_reply_to_id, path, date: .created_at, '
                 f'pr: (.pull_request_url | split("/") | last | tonumber), {FIELDS}}}')
    convo = api(f"repos/{a.repo}/issues/comments?per_page=100",
                f'.[] | select(.html_url | test("/pull/")) | {{date: .created_at, '
                f'pr: (.html_url | capture("/pull/(?<n>[0-9]+)").n | tonumber), {FIELDS}}}')

    def reviews(n):
        r = api(f"repos/{a.repo}/pulls/{n}/reviews?per_page=100",
                f'.[] | select((.body | length) > 0) | {{state, date: .submitted_at, pr: {n}, {FIELDS}}}',
                check=False)
        return n, r

    failed, revs = [], []
    with ThreadPoolExecutor(8) as ex:
        for n, r in ex.map(reviews, author):
            if r is None:
                failed.append(n)
            else:
                revs.extend(r)

    by_id = {c["id"]: c for c in inline}
    items = []

    def keep(kind, c, limit, **extra):
        items.append({"kind": kind, "u": c["u"], "pr": c["pr"], "pr_author": author.get(c["pr"]),
                      "date": c["date"], "url": c["url"], **extra, "body": c["body"][:limit]})

    for c in inline:
        if not on_team(c):
            continue
        parent = by_id.get(c["irt"])
        if parent and is_bot(parent):
            keep("inline", c, 1500, path=c["path"], reply_to_bot=parent["u"], bot_body=parent["body"][:800])
        elif c["u"] != author.get(c["pr"]):
            keep("inline", c, 1500, path=c["path"])
    for c in convo:
        if on_team(c) and c["u"] != author.get(c["pr"]):
            keep("pr_comment", c, 1500)
    for c in revs:
        if on_team(c) and c["u"] != author.get(c["pr"]):
            keep("review", c, 2500, state=c["state"])

    items.sort(key=lambda i: (i["pr"], i["date"]))
    with open(os.path.join(a.out, "corpus.json"), "w") as f:
        json.dump(items, f, indent=0)

    chunks, cur, size = [], [], 0
    for i in items:
        s = len(json.dumps(i))
        if cur and size + s > CHUNK_BYTES:
            chunks.append(cur)
            cur, size = [], 0
        cur.append(i)
        size += s
    if cur:
        chunks.append(cur)
    for k, ch in enumerate(chunks):
        with open(os.path.join(a.out, f"chunk-{k}.json"), "w") as f:
            json.dump(ch, f, indent=1)

    raw = inline + convo + revs
    print(f"PRs: {len(author)}  comments fetched: {len(raw)}  "
          f"(inline {len(inline)}, conversation {len(convo)}, review bodies {len(revs)})")
    if failed:
        print(f"review fetch failed for {len(failed)} PRs: {failed[:20]}")
    print(f"kept: {len(items)} {dict(collections.Counter(i['kind'] for i in items))}  "
          f"replies to bots: {sum('reply_to_bot' in i for i in items)}")
    if items:
        print(f"dates: {min(i['date'] for i in items)[:10]} to {max(i['date'] for i in items)[:10]}")
    print("kept reviewers:", collections.Counter(i["u"] for i in items).most_common(15))
    print("dropped humans (not on team):",
          collections.Counter(c["u"] for c in raw if not is_bot(c) and not on_team(c)).most_common(10))
    print(f"chunks: {len(chunks)} in {a.out}")


if __name__ == "__main__":
    main()
