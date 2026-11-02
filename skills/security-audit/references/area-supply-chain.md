This file is the checklist of the supply chain and CI area (step 3 of `SKILL.md`). Check each item against the code in scope.

## Dependencies

- Triage each govulncheck result: a vulnerability in a function that the code calls comes first. One in a module that the code only imports comes second. A fix is often one version bump: give the version.
- Triage each npm audit result: a package in the production bundle or on the server comes first. A dev tool comes second.
- The lockfile is committed, and CI installs from it: `npm ci`, `pnpm install --frozen-lockfile`, or `bun install --frozen-lockfile`.
- Dependencies from a git URL, a tarball URL, or a fork in a `replace` line of `go.mod`: who controls that source.
- Install scripts of npm packages: pnpm 10 and later runs them only for the packages that its config allows: `allowBuilds` in pnpm 11, `onlyBuiltDependencies` in pnpm 10. npm runs them all.
- Bots that merge dependency updates on their own (Dependabot or Renovate with automerge): a bad release reaches the default branch with no review.

## GitHub Actions

Read each workflow, with the actionlint and zizmor output as leads.

- `pull_request_target` or `workflow_run` that checks out the code of the pull request (`ref: ${{ github.event.pull_request.head.sha }}`, `head.ref`, or the merge ref) and then runs it: a build, a test, an install, or a script from the checkout. The code of a fork then runs with the secrets and a token that can write. This is Risk 9 or more in a public repo.
- Script injection: `${{ github.event.issue.title }}`, `pull_request.title`, `pull_request.body`, `head_ref`, `comment.body`, or another field that an outsider sets, inside `run:`. The guard is to pass the value through `env:` and to quote it.
- `permissions:`: a workflow with no `permissions` block gets the default token of the repo, which can write in older repos. Each job needs only what it uses.
- Third-party actions pinned by a tag or a branch: the owner can move the tag. A full commit SHA is the guard. Actions from `actions/` and from the owner of the repo are lower risk.
- Secrets passed to a step that runs code from a fork, from an artifact, or from a cache that a fork can write.
- `actions/checkout` keeps the token in `.git/config` unless `persist-credentials: false`. An upload of the whole folder as an artifact then publishes the token.
- Self-hosted runners in a public repo: a fork pull request can run code on the machine.
- Release workflows: who can start them (a tag push, a manual run), and what they sign or publish.

## Sources

Checked on 2026-11-02. Read the source again when a version is newer than the one named here.

- `pull_request_target` with a checkout of fork code: https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/
- The install scripts that pnpm runs (`allowBuilds`, pnpm 11): https://pnpm.io/cli/approve-builds
- The zizmor audits: https://docs.zizmor.sh/audits/
