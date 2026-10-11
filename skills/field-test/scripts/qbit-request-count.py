#!/usr/bin/env python3
"""Count HTTP request lines from a daemon to an upstream service, per path.

Written for qui talking to qBittorrent WebUI ports; --ports and --path-prefix
point it at any plain-HTTP upstream (Sonarr, Radarr, an indexer proxy).

Run inside the network namespace that carries the traffic, on a host with no
tcpdump. Raw AF_PACKET socket, every interface in the namespace, IPv4 TCP only.

  nsenter -t "$(docker inspect <container> --format '{{.State.Pid}}')" -n \
      python3 qbit-request-count.py --ports <port>,<port> > counts.log 2>&1 &

Counters are cumulative. Dump them with SIGUSR1 (a handler is registered
below; without one SIGUSR1 kills a Python process) or wait for the periodic
dump. Snapshot before the action, snapshot after, and subtract.

A bulk `torrents/info` GET carries the whole hash list in the query, hundreds
of KB, so the request line spans TCP segments. The regex therefore never
anchors on " HTTP"; it reads the method and path from the first segment only.
Requests whose first segment is longer than --big-bytes get a "big-query"
suffix, which is how a bulk includeTrackers fetch shows up.
"""
import argparse, re, signal, socket, struct, sys, time
from collections import Counter

ap = argparse.ArgumentParser()
ap.add_argument("--ports", default="8080", help="qBittorrent WebUI ports, comma separated")
ap.add_argument("--big-bytes", type=int, default=1200, help="first-segment size that marks a bulk query")
ap.add_argument("--every", type=int, default=30, help="seconds between periodic dumps (0 = only on SIGUSR1)")
ap.add_argument("--path-prefix", default="/api/v2/", help="request path prefix to count; any HTTP upstream works, qBittorrent is the default")
args = ap.parse_args()

ports = {int(p) for p in args.ports.split(",") if p}
counts = Counter()
t0 = time.time()
line = re.compile(rb"^(GET|POST|PUT|DELETE) (" + re.escape(args.path_prefix.encode()) + rb"[A-Za-z0-9_/.-]+)")


def dump(*_):
    print(f"--- {time.strftime('%H:%M:%S')} +{int(time.time() - t0)}s", flush=True)
    for key, n in sorted(counts.items()):
        print(f"{n:7d} {key}", flush=True)


signal.signal(signal.SIGUSR1, dump)
signal.signal(signal.SIGTERM, lambda *_: (dump(), sys.exit(0)))

sock = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.htons(3))
last = time.time()
while True:
    pkt = sock.recv(65535)
    # tun devices hand over bare IP packets, ethernet devices prefix 14 bytes
    off = 0 if pkt and (pkt[0] >> 4) == 4 else 14
    if len(pkt) < off + 20 or (pkt[off] >> 4) != 4 or pkt[off + 9] != 6:
        continue
    tcp = off + (pkt[off] & 15) * 4
    dport = struct.unpack("!H", pkt[tcp + 2:tcp + 4])[0]
    if dport not in ports:
        continue
    payload = pkt[tcp + (pkt[tcp + 12] >> 4) * 4:]
    m = line.match(payload)
    if m:
        key = f"{dport} {m.group(2).decode()}"
        if len(payload) > args.big_bytes:
            key += " big-query"
        counts[key] += 1
    if args.every and time.time() - last > args.every:
        dump()
        last = time.time()
