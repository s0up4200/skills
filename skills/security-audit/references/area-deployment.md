This file is the checklist of the deployment area (step 3 of `SKILL.md`). Check each item against the code in scope.

## Defaults of the app

- The listen address by default: `0.0.0.0` or `:port` listens on each interface. Together with login off or optional, each host on the network can use the app. Check what the docs tell the user.
- Default credentials (`admin`/`admin`, a password in the example config) that the app accepts with no prompt to change them.
- The first-run setup before the first user exists: who can reach it. This is also an item of the login area: write the finding once.
- A self-update that downloads a binary with no check of a signature or a checksum. A check on the bytes only is not enough either: a signature that does not cover the version, platform, and channel lets an attacker serve an old release that has a known hole.
- Health, status, and metrics routes with no login: what they show, for example versions, paths, or the names of other services.

## Container images

- No `USER` line in the Dockerfile: the app runs as root in the container. A file write hole then writes as root, and a container escape starts as root.
- Secrets in the image: `COPY` of a `.env` file or of a config with keys, `ENV` with a secret, or a build argument with a secret. Each layer keeps them, also when a later layer deletes the file.
- `ADD` of a URL, or a base image by a moving tag such as `latest`. Score it low.

## Compose, Kubernetes, and unit files

- Ports published as `"8080:8080"`: Docker binds them on each interface, and its iptables rules go around a host firewall such as ufw. `"127.0.0.1:8080:8080"` is the guard when a proxy sits in front.
- `privileged: true`, a mount of `/var/run/docker.sock`, `network_mode: host`, or `cap_add` that the app does not need. A mount of the Docker socket gives root on the host.
- Default passwords in the example files of a database or another service.
- systemd units with `User=root`, or with no hardening (`NoNewPrivileges`, `ProtectSystem`). Score the missing hardening low.

## Install scripts

- A script that downloads with `curl | sh`, from a moving URL, with no checksum.
- `chmod 777`, or files with secrets made readable by each local user.

## Cloud and infrastructure as code

Only for a repo with Terraform, IAM policies, Helm charts, serverless config, or service mesh config. The repo often shows only part of what runs: when the live setting decides it, the verdict is not proven.

- A workload, function, or pod identity with rights beyond its job, when input from a request picks the target. Check wildcards in resources, and role trust policies that do not tie the source account, audience, or repo.
- An app that trusts identity headers, tags, or account IDs from a caller, as if they came from the cloud or a proxy. Cloud IAM and the rights inside the app are two separate checks.
- A backend that takes forwarded identity from peers outside the proxy or the sidecar, or a second port or a health route that skips the mesh. What happens when the proxy is absent?
- Dev values, chart defaults, flags, and per-region overlays that turn off login, TLS, or scoping. Render the final config for each deployment that the repo maintains, not only the base file.
- Bucket policies, CDN origins, and signed URLs that do not tie the operation, the object prefix, and the expiry. Check list and write as well as read.
- A function that trusts the fields of an event body as proof of the source, with no check of the signed envelope, the account, or replay.
- A failed mount or refresh of a credential that makes the app fall back to a weaker identity, or keeps an old credential active.

## Sources

Checked on 2026-11-02. Read the source again when a version is newer than the one named here.

- Docker port publishing goes around ufw and firewalld: https://docs.docker.com/engine/network/packet-filtering-firewalls/
