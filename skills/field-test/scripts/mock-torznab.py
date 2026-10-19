#!/usr/bin/env python3
"""Mock Torznab indexer for a local qui rig.

    python3 mock-torznab.py <port> [rss file]

Answers t=caps for movies and TV. Answers each search with the RSS file, or
with an empty feed. Prints the time and the query of each search, so the log
shows the order of the searches and the interval between them. Binds
127.0.0.1 only.
"""
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

PORT = int(sys.argv[1])
CAPS = b"""<?xml version="1.0" encoding="UTF-8"?><caps><server title="rig"/><limits max="100" default="100"/>
<searching><search available="yes" supportedParams="q"/><tv-search available="yes" supportedParams="q,season,ep"/><movie-search available="yes" supportedParams="q,imdbid,year"/></searching>
<categories><category id="2000" name="Movies"/><category id="5000" name="TV"/></categories></caps>"""
EMPTY = b"""<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:torznab="http://torznab.com/schemas/2015/feed"><channel><title>rig</title></channel></rss>"""
FEED = open(sys.argv[2], "rb").read() if len(sys.argv) > 2 else EMPTY


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        t = q.get("t", [""])[0]
        if t == "caps":
            body = CAPS
        else:
            print("%s SEARCH t=%s q=%s" % (time.strftime("%H:%M:%S"), t, q.get("q", [""])[0]), flush=True)
            body = FEED
        self.send_response(200)
        self.send_header("Content-Type", "application/xml")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
