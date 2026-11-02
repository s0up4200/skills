This file lists the scanners of the audit (steps 1 to 3 of `SKILL.md`): when each one applies, what it catches, the command to run, the area agent that reads its output, and the install command to show at the stop.

A scanner finds known CVEs and known patterns, which an agent can only guess at. Its output is a list of leads, and the area agent decides which ones an attacker can reach.

## Scanners

| Scanner | Applies when | Catches | Read by |
|---|---|---|---|
| golangci-lint with gosec | Go code | Go patterns: a path from a variable, a URL from a variable, `InsecureSkipVerify`, SQL built from strings, weak crypto, hard-coded credentials, loose file modes | each area agent with Go code in scope |
| govulncheck | a `go.mod` | known CVEs in Go modules and the standard library, marked as called or only imported | supply chain and CI |
| pnpm audit, npm audit, or bun audit | `pnpm-lock.yaml`, `package-lock.json`, or `bun.lock` | known CVEs in npm packages | supply chain and CI |
| actionlint | `.github/workflows/` | workflow errors, and script injection through `${{ }}` in `run:` | supply chain and CI |
| zizmor | `.github/workflows/` | `pull_request_target` with a checkout of fork code, template injection, loose token permissions, actions not pinned to a commit, leaked credentials | supply chain and CI |
| gitleaks | a git repo | secrets in the files and in the whole git history, also a key that a later commit deleted | secrets |

## Commands

Run each command from the repo root, unless its comment names another folder, and write the output to the run folder. `<scope>` is the path of the audit, or `.` for the whole repo. `<out>` is `<run folder>/scanners`.

```sh
# The two Go scanners run once in each folder that has a go.mod in scope.
# --no-config keeps the repo config from turning gosec rules off,
# and the two max flags keep every issue, not the first 50.
golangci-lint run --no-config --enable-only gosec --max-issues-per-linter 0 --max-same-issues 0 ./... > <out>/gosec-<module>.txt 2>&1
govulncheck ./... > <out>/govulncheck-<module>.txt 2>&1

# The audit of the package manager whose lockfile the repo has, run in the folder of the lockfile.
pnpm audit > <out>/npm-audit.txt 2>&1     # or: npm audit, bun audit

actionlint > <out>/actionlint.txt 2>&1
zizmor .github/workflows > <out>/zizmor.txt 2>&1

# gitleaks over the whole history. --redact keeps the secret values out of the report.
gitleaks git --redact --no-banner --report-format json --report-path <out>/gitleaks.json .
```

- For a path scope, give gitleaks `--log-opts="-- <scope>"`.
- gitleaks before version 8.19 has no `git` command. Use `gitleaks detect --source . --redact --no-banner --report-format json --report-path <out>/gitleaks.json`.
- govulncheck and the package audits send the names and versions of the modules to their vulnerability database. They send no code.
- A scanner that exits with an error still writes useful output. Keep the file, and tell the area agent that the scanner failed.

## Install commands

Show these at the stop for each scanner that applies but is missing. The skill installs nothing. In each command, `<version>` is a release that is at least 7 days old, for the same reason as the report pins in `html-report.md`: a bad new release has time to be found.

| Scanner | Install |
|---|---|
| golangci-lint | `brew install golangci-lint`, or `go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@<version>` |
| govulncheck | `go install golang.org/x/vuln/cmd/govulncheck@<version>` |
| pnpm, npm, or bun audit | comes with the package manager |
| actionlint | `brew install actionlint`, or `go install github.com/rhysd/actionlint/cmd/actionlint@<version>` |
| zizmor | `brew install zizmor`, or `uv tool install zizmor==<version>` |
| gitleaks | `brew install gitleaks`, or `go install github.com/zricethezav/gitleaks/v8@<version>` |

## Sources

Checked on 2026-11-02. Read the source again when a version is newer than the one named here.

- The `gitleaks git` command came in gitleaks 8.19.0: https://github.com/gitleaks/gitleaks/releases/tag/v8.19.0
- golangci-lint 2.14.0 has `--no-config`, `--enable-only`, `--max-issues-per-linter`, and `--max-same-issues` (`golangci-lint run --help`).
