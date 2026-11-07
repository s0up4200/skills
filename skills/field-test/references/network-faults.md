# Force a one-sided drop

Use this when the change is about how the app recovers from a dropped TCP connection, and a natural drop can take days. The common case is an IRC client that reconnects while the server still holds the old connection and the nick.

In a one-sided drop, the client sees an error at once, but the server sees nothing. The server keeps the old connection until its own ping timeout, which takes minutes. The steps below make that drop on one connection of one container, on demand.

Run each command inside the network namespace of the container (`nsenter -t <container pid> -n <command>`), not on the host, so that only this container is touched. The host file can name a helper for this. The rule goes away with the namespace when the pod restarts.

1. Read the local port of the connection: `ss -Htn state established dst <server ip>`.
2. Drop the packets that the client sends on that port: `iptables -I OUTPUT -p tcp -d <server ip> --sport <port> -j DROP`. The rule also drops the RST that the kernel sends when the server writes to the closed socket, so the server gets no close.
3. Kill the socket: `ss -K dst <server ip> sport = :<port>`. The app logs `software caused connection abort` and reconnects on a new port. The rule does not match the new port.
4. Watch the app log for the case that the change fixes, then for the recovery.
5. Delete the rule: `iptables -D OUTPUT` with the same arguments as step 2.

`ss -K` can print `RTNETLINK answers: Invalid argument` and still kill the socket. Read the app log for the abort, not the `ss` output.

Step 3 sets the timing. Without it, the client notices the drop only at its own keepalive timeout, and the server's ping timeout can close the old connection first. Then the reconnect is clean, and the case does not reproduce.

These commands change the production host, so give them to the user to run. Before the user runs them, name the side effects. That network misses events until it recovers, and if the fix fails, it stays down until a restart. The server sees one extra disconnect and one extra login, so do one run for each observable.
