This file holds the questions after the report and the steps of each action (step 6 of `SKILL.md`).

## Find out which options show

Read these once, before the questions:

- **Visibility**: `gh repo view --json visibility -q .visibility`. PRIVATE is private. Treat each other answer, and a repo that is not on GitHub, as public.
- **Releases**: the repo has a release when `gh release list --limit 1` or `git tag` prints a line.
- **Vault**: your instructions (`CLAUDE.md`, `AGENTS.md`, or the same files of your harness) name a notes vault with a bugs folder. Take its path from there.

## The questions

Ask one question for each finding in the report, all in one message, in order of risk. For a carried finding, `references/prior-runs.md` says when the earlier pick stands. Start the message with one line: the repo, the scope, the count of findings, and the URL or the path of the report. Leave out an option that does not show for the finding, and keep the letters of the others:

```markdown
**F1 · The indexer test button fetches any URL** · Risk 8/10 · proven
A logged-in user can make the server read the cloud metadata address and see the reply.
- A: Fix now
- B: Fresh window
- C: Vault note
- D: Open issue
- E: Draft advisory
- F: By design
```

| Option | Shows when |
|---|---|
| A: Fix now | always |
| B: Fresh window | always |
| C: Vault note | the instructions name a vault |
| D: Open issue | the repo is private |
| E: Draft advisory | the repo is public, and a release has the code of the finding |
| F: By design | always |

D is only for a private repo: an issue in a public repo shows the hole to everyone before the fix ships. E is only for a released version, because an advisory warns the users of a release. To find out, take the commit that added the code (`git log -S '<a line of the code>' --reverse`), and check that `git tag --contains <commit>` prints a tag.

After the last finding, add: **S: Stop serving the report**, yes or no. Leave it out when the report opened from a local file. Then a last line, for example: "Reply with a letter for each finding, for example `F1 A, F2 C, S yes`."

Add each pick to its finding in `findings.md`, with the URL or the path of what it made, so that the next run can read it. Do the picks in this order: by design, vault notes, issues, advisories, stop serving, then each fix now, one at a time in order of risk, then fresh window last. If the report is still served when the run ends, offer to stop serving it again in the last reply.

## A: Fix now

Call the Skill tool with "tdd", and give it the finding from `findings.md`: the files, the attack, and the fix. The first test proves the hole: it goes red on the attack. Then the fix makes it green. The test talks only to local fakes. If the harness has no `tdd` skill, do the same steps without it.

Where the work happens depends on the risk:

- **Risk 7 or more, when E shows for the finding** (a public repo, and a release has the code): in the temporary private fork of a GitHub security advisory, so that the hole stays private until the release ships. First do **E: Draft advisory** for the finding, if the user did not pick it. Then ask the user to create the draft advisory with that text at `https://github.com/<owner>/<repo>/security/advisories/new`, to click **Start a temporary private fork** on the advisory, and to send you the URL of the fork. Add the fork as a git remote, make a branch from the default branch, run `tdd`, and push the branch to the fork. Open the pull request in the fork. The user merges it from the advisory page.
- **Each other finding**: a normal branch and pull request, the way the repo instructions say. Write the commit and the pull request text in plain words: what the fix changes and what a user sees. Leave out the attack steps.

## B: Fresh window

Tell the user to type `/handoff` and to start a new session with the finding ID and the absolute path of `findings.md`. The skill cannot start `/handoff` itself, because it is user-only. If the harness has no `handoff` skill, write the finding ID, the path of `findings.md`, and the path of the repo in one line that the user can paste into a new session.

## C: Vault note

Write one note for each picked finding, in the bugs folder for the project in the vault. Read the instructions of the vault first, for example its `README.md`, for the name and the format of a note. The note holds the card of the finding in words: the title, the risk and the verdict, the files, the attack, who is exposed, the fix, and the proof.

## D: Open issue

Create one issue for each picked finding with `gh issue create`, or with the steps in `docs/agents/issue-tracker.md` when the repo has it. Start the body with an alert that gives the risk and the verdict, so that a reader sees how urgent the issue is before the details. Use `[!CAUTION]` for Risk 7 to 10, `[!WARNING]` for 4 to 6, and `[!NOTE]` for 1 to 3. For a not proven finding, add what decides it:

```markdown
> [!CAUTION]
> Risk 8/10 · proven · found by security-audit on 2026-11-02

> [!WARNING]
> Risk 5/10 · not proven: depends on whether the reverse proxy strips `X-Forwarded-For` · found by security-audit on 2026-11-02
```

Then the body holds the card of the finding, as in a vault note.

## E: Draft advisory

Write the text to `<run folder>/advisory-<id>.md`, and give the user the absolute path. The user posts it. Use the fields of the GitHub advisory form:

- **Title**: the hole in one line, with no attack steps.
- **Ecosystem and package**: for example Go and the module path, or npm and the package name.
- **Affected versions**: from the oldest release that has the code to the latest release. Find the commit that added the code with `git log -S '<a line of the code>' --reverse`, then `git tag --contains <commit>`.
- **Patched versions**: the next release, which the user fills in.
- **Severity**: Risk 9 to 10 is critical, 7 to 8 is high, 4 to 6 is moderate, 1 to 3 is low.
- **CWE**: the closest one, for example CWE-918 for SSRF or CWE-22 for path traversal.
- **Description**: the impact, who is exposed, the conditions (for example "when login is on and the user can add an indexer"), and a workaround if one exists. Leave out a working exploit.

## F: By design

Record the pick in `findings.md` in the run folder, and nowhere else: no file in the repo and no ADR. Later runs leave out the same claim while its files stay unchanged. When a file changes, the risk that the user accepted may have changed too, so the claim can come back.

## Sources

Checked on 2026-11-02.

- The temporary private fork of a security advisory: https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/collaborating-in-a-temporary-private-fork-to-resolve-a-repository-security-vulnerability
