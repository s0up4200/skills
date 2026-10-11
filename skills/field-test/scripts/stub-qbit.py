#!/usr/bin/env python3
"""Stub qBittorrent WebUI for a local qui rig.

    python3 stub-qbit.py <port> [torrent count]

Serves a synthetic library with enough shape for qui to connect, sync, list,
and open a details panel. Every maindata poll bumps upspeed on each torrent,
so stream deltas carry rows and a handler that drops its row on an empty
delta shows up as stale values. GET /_counts returns requests per path as
JSON; diff two snapshots for a paired request count. Binds 127.0.0.1 only.
"""
import json
import sys
import time
from collections import Counter
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

PORT = int(sys.argv[1])
COUNT = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
NOW = int(time.time())

torrents = {}
for i in range(COUNT):
    h = "%040x" % (i + 1)
    torrents[h] = {
        "name": "Some.Release.Title.%d.S01E%02d.1080p.WEB-GRPA" % (i, i % 24 + 1),
        "infohash_v1": h, "infohash_v2": "", "state": "uploading",
        "added_on": NOW - i * 60, "completion_on": NOW - i * 30,
        "size": 1_000_000_000, "total_size": 1_000_000_000, "progress": 1,
        "category": "tv", "tags": "cross-seed",
        "tracker": "https://tracker.example.invalid/announce",
        "save_path": "/downloads", "content_path": "/downloads/x%d" % i,
        "ratio": 1.5, "uploaded": 1_500_000_000, "downloaded": 1_000_000_000,
        "dlspeed": 0, "upspeed": 1024 * (i % 7), "num_seeds": 1, "num_leechs": 0,
        "eta": 8640000, "priority": 0, "last_activity": NOW, "amount_left": 0,
    }

server_state = {"dl_info_speed": 0, "up_info_speed": 4096, "alltime_dl": 1, "alltime_ul": 1,
                "free_space_on_disk": 10**12, "connection_status": "connected", "dht_nodes": 100}
rid = 0
counts = Counter()

STATIC = {
    "/api/v2/app/webapiVersion": b"2.11.2",
    "/api/v2/app/version": b"v5.0.4",
    "/api/v2/app/defaultSavePath": b"/downloads",
    "/api/v2/app/buildInfo": b'{"qt":"6.7","libtorrent":"2.0.10","boost":"1.86","openssl":"3.0","bitness":64}',
    "/api/v2/app/preferences": b'{"save_path":"/downloads","web_ui_username":"admin"}',
    "/api/v2/torrents/categories": b'{"tv":{"name":"tv","savePath":"/downloads"}}',
    "/api/v2/torrents/tags": b'["cross-seed"]',
    "/api/v2/torrents/properties": b"{}",
    "/api/v2/sync/torrentPeers": b'{"peers":{}}',
    "/api/v2/transfer/info": b"{}",
}


def maindata():
    global rid
    rid += 1
    for t in torrents.values():
        t["upspeed"] += 1
    return json.dumps({
        "rid": rid, "full_update": True, "torrents": torrents,
        "categories": {"tv": {"name": "tv", "savePath": "/downloads"}}, "tags": ["cross-seed"],
        "trackers": {"https://tracker.example.invalid/announce": list(torrents)},
        "server_state": server_state,
    }).encode()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send(self, body, extra=()):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for k, v in extra:
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        self.do_GET()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/_counts":
            self.send(json.dumps(counts, indent=1).encode())
            return
        counts[path] += 1
        if path == "/api/v2/auth/login":
            self.send(b"Ok.", [("Set-Cookie", "SID=stub; Path=/")])
        elif path == "/api/v2/sync/maindata":
            self.send(maindata())
        elif path == "/api/v2/torrents/info":
            self.send(json.dumps([dict(t, hash=h) for h, t in torrents.items()]).encode())
        else:
            self.send(STATIC.get(path, b"[]"))


HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
