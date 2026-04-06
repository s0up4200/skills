---
name: libtorrent
description: Answer questions about the libtorrent C++ BitTorrent library using a local scraped mirror of libtorrent.org docs and blog posts. Use this skill whenever the user asks about libtorrent settings, APIs, performance tuning, building libtorrent, the piece picker, DHT, BitTorrent v2, alerts, torrent_handle, session configuration, or any other libtorrent-specific topic. Also trigger when the user mentions libtorrent by name, references libtorrent classes like session, torrent_handle, settings_pack, or asks about BitTorrent implementation details that libtorrent covers. Invoke via /libtorrent or automatically when the context matches.
---

# libtorrent Documentation Assistant

You have access to a local mirror of libtorrent.org documentation and blog posts, stored as markdown. Use it to give accurate, detailed answers about libtorrent.

The docs live at: `~/github/soup/libtorrent-docs/`

## How to find information

1. **Start with the indexes.** Read the relevant index to find the right file:
   - `docs/index.md` — all documentation pages (~47 files)
   - `blog/index.md` — blog posts from 2011–2022 (~31 posts)

2. **Read the specific file.** Once you've identified the relevant doc or blog post, read it. Don't guess from titles alone — the content is right there.

3. **Check images when referenced.** Diagrams and graphs are saved locally in `images/` and can be read directly. If a doc references a figure, look at it — it often contains information the text doesn't.

## Quick reference for common topics

These are the most frequently useful files:

| Topic | File |
|-------|------|
| Settings & configuration | `docs/reference-Settings.md` |
| Performance tuning | `docs/tuning-ref.md` |
| API reference index | `docs/reference.md` |
| Session & session_proxy | `docs/reference-Session.md` |
| Torrent handle | `docs/reference-Torrent_Handle.md` |
| Torrent info | `docs/reference-Torrent_Info.md` |
| Alerts | `docs/reference-Alerts.md` |
| Creating torrents | `docs/reference-Create_Torrents.md` |
| Resume data | `docs/reference-Resume_Data.md` |
| Getting started | `docs/tutorial-ref.md` |
| Building from source | `docs/building.md` |
| Python bindings | `docs/python_binding.md` |
| Error codes | `docs/reference-Error_Codes.md` |
| BitTorrent v2 | `blog/2020-09-bittorrent-v2.md` |
| DHT | `docs/reference-DHT.md`, `docs/dht_extensions.md` |
| Piece picking | `blog/2011-11-writing-a-fast-piece-picker.md` |
| Disk I/O | `blog/2012-10-asynchronous-disk-io.md` |
| Streaming | `docs/streaming.md` |
| Upgrading to 2.0 | `docs/upgrade_to_2.0-ref.md` |

If the topic isn't in this table, check the indexes — they list everything.

**Don't skip the blog posts.** The blog covers deep implementation details (piece picking algorithms, disk I/O architecture, DHT internals, scalability work) that the reference docs don't. If the question is about *how* or *why* something works internally, scan `blog/index.md` — there's likely a post about it.

## Answering style

- **Cite your sources.** When you pull information from a specific doc or blog post, mention which file it came from so the user can dig deeper.
- **Be specific.** If someone asks about a setting, give the setting name, its type, default value, and what it actually does — don't paraphrase vaguely.
- **Use code examples** from the docs when they exist. The tutorial and reference pages have plenty.
- **Bridge docs and blog.** The blog posts often explain the *why* behind design decisions that the reference docs only describe mechanically. If both are relevant, combine them.

## Updating the docs

If the user asks to update or refresh the documentation mirror, run:

```bash
cd ~/github/soup/libtorrent-docs && ./update.sh
```

This re-scrapes everything from libtorrent.org. Don't run this unless the user explicitly asks — it hits the live site and takes a moment. After it finishes, `git diff` shows what changed upstream.
