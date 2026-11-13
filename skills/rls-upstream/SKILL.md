---
name: rls-upstream
description: Audit a bump of github.com/autobrr/rls (the release-name parser) in qui, and map each upstream change onto qui as a regression, a simplification, a break in the API, or a new field qui could use. Use when a qui diff, branch, or pull request changes the rls line in go.mod, including a Dependabot bump, when the user says "bump rls" or "update the parser", or asks what a new rls version changes for qui.
---

# rls upstream audit

qui reads almost every field of `rls.Release` to match cross-seeds, scan directories, and run automations. A changed parse of one name shape can change which torrents match, with no compile error and no failing test. qui also carries its own fixes for names that rls once misread. When rls learns to parse such a name, the qui fix can go, or it can now apply twice. This skill turns the commits between two rls versions into a work list for qui.

The report is the deliverable. Fix nothing here, so the user decides what to change.

## Steps

1. **Resolve the range.** Old is the rls version on the qui base branch: `git show origin/HEAD:go.mod | grep autobrr/rls`. New is the version in the working tree, or the version that the pull request sets. A pseudo-version ends in the commit hash (`v0.10.1-0.20261113171516-c9ee0a124e72` is `c9ee0a124e72`); a plain version is a tag. In a checkout of `github.com/autobrr/rls` (clone it into the scratchpad when there is none), run `git fetch --tags` and then `git log --oneline <old>..<new>`. When old and new are the same, say so and stop.

2. **Read every commit in the range.** Read the patch, not the subject: a subject like "fix(title): split titles on AKA" hides a changed type of `Alt`. For each commit note:
   - the names whose parse changes. `tests.yaml` is the spec of rls, so its diff (`git diff <old> <new> -- tests.yaml`) shows each change in expected output for a name.
   - each change to the API outside tests: a field of `Release` that is added, removed, or changes type, a new or changed method on `Release`, a new or changed exported function or `taginfo` entry.

3. **Diff the parses of qui's own names.** The test names in qui are the name shapes that qui cares about. Run the scripts in this skill's `scripts/` folder from the qui root, with a work folder outside the repo:

   ```bash
   <skill>/scripts/names.sh internal pkg > <work>/names.txt
   <skill>/scripts/parse-diff.sh <work>/diff <old> <new> < <work>/names.txt > <work>/parse-diff.txt
   ```

   `parse-diff.txt` lists each name that parses differently, with the old (`-`) and new (`+`) value of each changed field. It covers the exported fields only, so check the methods from step 2 by hand. A changed name that no qui test asserts on is the strongest lead for a regression that the tests miss.

4. **Map each change onto qui.** Find the qui code that reads the changed field or method: `grep -rn '\.<Field>\b' --include=*.go internal pkg`, and the packages that import `github.com/autobrr/rls`. Then sort each change into one group:
   - **Regression**: qui reads a field whose value changes for a name shape qui handles, and the new value changes a match, a category, a season pack check, or a search query. Name the qui function and the name that shows it.
   - **Simplification**: qui code that repairs an rls parse that rls now gets right. Look first in `pkg/releases/parser.go` (its doc comment on `Parser` lists the known fixes, for example `enrichReleaseHDR`), then in the regular expressions and string checks on release names in the importing packages (for example `variant_overrides.go` and `parsing.go` in cross-seed). Prove it with the parse diff or the rls tests: the qui fix is redundant only when rls returns the same value for every name the fix handles.
   - **API break**: qui no longer compiles, or compiles with a changed meaning (a `string` that became `[]string` in a `%v` format or a comparison).
   - **New capability**: a new field or method that would let qui drop its own parse, or support a name shape it skips today.
   - **No qui impact**: the field or name shape is one qui never reads. Give the reason in one line.

5. **Run the tests at the new version.** Run `go build ./...` and the tests of every qui package that imports rls. A failing test is a regression or an expected change; say which, with the name that the test parses.

6. **Write the report.** Save it to the path the user names, or to `<work>/rls-report.md`, and give the summary in chat:

   ```markdown
   # rls <old> -> <new> in qui

   <N> rls commits. <M> of <K> qui test names parse differently. Build: <ok or error>. Tests: <ok or failing packages>.

   ## Regressions
   - <change> — rls <sha> (#PR). qui <file:function> reads <field>; `<name>` now gives <new> where it gave <old>.
   ## Simplifications
   - <qui file:function> can go: rls <sha> now parses <shape>. Evidence: <parse-diff entry or rls test>.
   ## API breaks
   ## New capabilities
   ## No qui impact
   - <sha> <subject> — <reason>
   ```

## Done when

Every commit in the range, and every name in `parse-diff.txt`, appears in the report: under a group with a qui location, or under "No qui impact" with a reason. A name in the parse diff that the report does not explain is the miss this skill exists to prevent.

## Judgement calls

- **A green test run proves little.** qui tests pin the names that broke before. A changed parse for a name with no test passes in silence, so the parse diff, not the test run, decides "No qui impact".
- **Matching compares two parses.** Cross-seed matching parses both release names and compares fields. A change that applies to both sides the same way often cancels out. A change that depends on the name form (dots or spaces, a leading `[group]`, a trailing site tag) can make two names of the same release stop matching. Check both forms before you call a change harmless.
- **A simplification needs proof, not a commit subject.** Keep a qui fix when rls fixes only some of the forms that the fix covers, and say which forms are left.
- **Upstream fixes belong upstream.** When the audit finds a parse that is wrong in rls, list it as an rls bug with the name and the expected fields, not as a new qui fix.
