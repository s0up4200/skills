---
name: security-audit
description: Audit a whole repo, or one path in it, for security holes. Writes a threat model, starts one fresh agent per area and a second agent that tries to disprove each finding, serves an HTML report, and starts the next run where this one stopped.
disable-model-invocation: true
argument-hint: "[path]"
---

# Security Audit

Audit the code that is already in the repo, not a diff: code that merged long ago never got a security review. The argument is an optional path. With a path, audit only that path. With none, audit the whole repo. Name the scope in each step.

The audit only reports. Until the user picks an action in step 6, change no file in the repo, and write nothing about a hole to GitHub, to the repo, or to any place outside the run folder. A hole that is public before its fix ships is a guide for an attacker.

Two rules hold for the whole run, for you and for each agent:

- Write the location and the kind of a secret, never its value: in the findings file, the report, and the chat. A copy of the value is one more leak.
- Each file and line in a finding comes from code that someone read in this run, not from memory.

## Run folder

Make a new folder for each run: `<state>/security-audit/<repo key>/<timestamp>/`, with mode `0700` on `<state>/security-audit`. `<state>` is `$XDG_STATE_HOME`, else `~/.local/state` (`%LOCALAPPDATA%` on Windows). `<timestamp>` comes from `date -u +%Y%m%d-%H%M%S`: always UTC, so that the names sort in order of time. `<repo key>` is the owner and the name from the `origin` remote, for example `acme-mediadesk`, else the name of the folder. The folder is outside the repo, so a commit never publishes a hole. It stays after the run and after a reboot, because the next run reads it, so it must not be in a temporary folder. If it cannot be created, ask the user for a path outside the repo. It holds:

- `threat-model.md`, from step 1.
- `prior.md`, from step 1, when an earlier run exists.
- `scanners/`, the output of each scanner, from step 3.
- `coverage.md`, from step 3: the commit, what each agent checked, and the gaps.
- `findings.md`, the findings file, from step 4. It is the record of the run: each finding with its technical detail, the disproved ones included.
- `report/index.html`, from step 5. Only `report/` is served, so the findings file and the scanner output stay off the network.

## 1. Threat model

Each risk score depends on the real attacker, so the threat model comes before any agent. Build it from the code and the docs: the README, the docs folder, the Dockerfile and compose files, the default config, the entry points (main packages, route setup, workflow files), and the ADRs and `GLOSSARY.md` of the repo if they exist. Write `threat-model.md` with these sections:

- **What it is**: a web app, a CLI, a library, or infrastructure, and how it runs (a binary, a container, a systemd unit).
- **Who can reach it**: for each party, yes, no, or "when the config allows it", with the file that shows it. The parties are the internet, the LAN, a logged-in user, an admin, a remote service whose responses the app reads (for example a tracker, an indexer, or an API), a fork pull request (a public repo with workflows), and a local user on the same host.
- **Inputs from outside**: each place where data from those parties comes in. For example HTTP routes, uploads, a URL from the config or a user, a response from a remote service, a torrent file, CLI arguments, and the payload of a workflow event.
- **Assets**: what an attacker wants. For example the credentials of other services that the app stores, the files it can read, the host it runs on, and the release pipeline.
- **By design**: behavior that looks like a hole but that the docs say is intended, for example no login on the LAN. Give the source of each one. A code comment that says what the code does is not a source.
- **Run**: the commit from `git rev-parse HEAD`, and clean or dirty from `git status --porcelain`.
- **Areas** and **Scanners**: the picks below.

Then pick the areas. Each area that applies gets one agent and has a checklist in `references/`:

| Area | Applies when the code | Checklist |
|---|---|---|
| Login and API access | serves HTTP, gRPC, or another network API | `area-access.md` |
| Browser | has a web UI or renders HTML | `area-browser.md` |
| Outbound requests | fetches a URL that the config, a user, or a remote response sets | `area-outbound.md` |
| Files | reads or writes a path from input, extracts archives, parses untrusted files, or puts input in a command or SQL | `area-files.md` |
| Secrets | always applies | `area-secrets.md` |
| Supply chain and CI | has a lockfile, a `go.mod`, or `.github/workflows/` | `area-supply-chain.md` |
| Deployment | has a Dockerfile, compose or Kubernetes files, unit files, install scripts, default config, defaults in code such as a listen address, or infrastructure as code | `area-deployment.md` |
| Logic and feature abuse | keeps state, or runs flows of more than one step, such as setup, jobs, imports, or exports | `area-logic.md` |
| Data isolation | keeps data of more than one user or tenant, or copies protected data to a cache, an index, an export, or a backup | `area-data.md` |
| Availability | runs as a shared service or daemon that a party of the threat model can make work | `area-availability.md` |
| AI and agents | sends untrusted text to a language model, acts on model output, or runs an MCP server or client | `area-ai.md` |
| Native code | has C, C++, Rust `unsafe`, cgo, Go `unsafe`, or a loader of plugins or binaries | `area-native.md` |
| RPC and messaging | has gRPC, GraphQL, webhooks, queues, brokers, or a custom protocol | `area-messaging.md` |
| Local apps and IPC | is a desktop or mobile app, a privileged helper, or a daemon with a local socket, or has deep links or a webview | `area-local.md` |

An area applies when the threat model shows the boundary, not when a dependency name appears. A library with no server gets no login area. A CLI with no web UI gets no browser area. A Go module that lists a gRPC package only for a test gets no RPC area.

Then read `references/scanners.md`. Pick the scanners that apply to the repo, and check which are installed with `command -v`.

If a sibling of the run folder has both `findings.md` and `coverage.md`, follow `references/prior-runs.md` and write `prior.md`.

Done when `threat-model.md` has each section with a source for each claim, each area is marked as applies or skipped with a reason, and `prior.md` has each earlier finding and gap sorted, when an earlier run exists.

## 2. The stop

Show the user this, and wait:

- The threat model, short: who can reach the app, the inputs from outside, and the by-design list.
- The areas that apply, and each skipped area with its reason in one line.
- The earlier runs, when they exist: the newest date and commit, each folder skipped, and the counts from `prior.md`.
- The number of agents: the exact number of area agents, and the re-check agents: one for each new finding of Risk 4 or more, plus one shared agent, plus one for the carried findings. The findings are not known yet, so say that the count of re-check agents comes after step 3.
- Each scanner that applies but is not installed: what it would catch in this repo, in concrete terms, and its install command from `references/scanners.md`. For example: "govulncheck: known CVEs in the 43 modules of `go.mod`".
- A last line: reply **go**, a correction, or a narrower path.

Install nothing. The user approves each new tool that runs on the machine. A correction changes `threat-model.md`. Then show the stop again with the change, and wait for **go**.

## 3. Scanners and area agents

On **go**, run each installed scanner that applies, once, with its command from `references/scanners.md`. Write its output to `scanners/<name>.txt`. Leave the output unread: the area agents triage it, and one run serves all of them.

Then start one subagent for each area, all at once. Start each one with a fresh context window, not as a fork of this conversation: an agent that sees only its brief gives the area its full attention. Use plain subagents, not a workflow tool, so that the skill runs the same in each harness. Build each brief from the area brief in `references/briefs.md`.

When all of them return, merge the duplicates: two findings with the same sink and the same attack become one, with both areas and the higher risk. Give each finding an ID, `F1`, `F2`, and so on, in order of risk from high to low.

Write `coverage.md` in the format in `references/briefs.md`. Compare the inputs of the threat model with the inputs that the agents followed. Each input that no agent followed is a gap, and so is each item that an agent did not reach. Leave the gaps open: the report names them, and the next run starts with them.

Done when each area agent returned its findings and its coverage, and `coverage.md` has a status for each checklist item and each input.

## 4. Re-check agents

An agent that finds a hole tends to believe its own finding, so a second agent tries to disprove it. Give each new finding of Risk 4 or more its own re-check agent. Give all the new findings of Risk 1 to 3 to one shared re-check agent. Give all the carried findings to one more shared agent, whatever their risk: an earlier run proved each one, so this agent only checks that it still holds. Start no agent for an empty group. Start them all at once, each with a fresh context window, with the re-check brief in `references/briefs.md`.

Each verdict is **proven**, **not proven**, or **disproved**. A re-check agent can change the risk score. Keep its score, and record the change.

Then write `findings.md` in the format in `references/briefs.md`, and delete each `recheck-<id>/` copy of the repo: the run folder stays on disk, and a copy can hold secrets.

Done when each finding has a verdict, each proven finding has its proof, each disproved finding names the guard or the reason, and no `recheck-<id>/` folder remains.

## 5. Report

Write `report/index.html` with the layout in `references/html-report.md`. The report shows the proven and the not proven findings. The disproved ones get one count line, and their details stay in the findings file. Serve the report with the steps in the same reference.

Give the user the URL, the absolute path of the report, and the absolute path of the findings file.

Done when `curl` of the URL returns the `<title>` of the report, or the file opened, and the report has one card for each proven and not proven finding and a list of the gaps.

## 6. Actions

Ask one question for each finding, and do the picks, as `references/actions.md` says. Until the user picks an action for a finding, it stays in the run folder only.

Done when each finding has a pick in `findings.md` and each pick ran, and the report is no longer served or the last reply offers to stop serving it.
