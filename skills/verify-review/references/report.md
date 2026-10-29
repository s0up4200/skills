This file holds the layout and the rules of the verify-review report (step 6 of `SKILL.md`).

Write for a person who has several pull requests open and reads the report once: friendly plain sentences, a short list in each section, and no table. Describe each problem by what happens when someone uses the app: what goes wrong, when, and who notices. Leave out file names, line numbers, function names, test names, and commit hashes. If a technical word is necessary, explain it in a few words at its first use. The evidence stays in your verification and in the GitHub replies, where developers read it. Keep the sections in this order, and leave out a section that is empty:

```markdown
**owner/repo#123** · I checked 3 bot comments and 2 points from @alice's review · 1 thread waits on the reviewer
**Read:** the PR body, #120, and its parent #118.
**Status:** the fixes are saved and on GitHub.

**Fixed**
- **Risk 8/10**: when a request to Sonarr or Radarr failed, the error in the log showed your API key. Now the key is removed first, and a new test fails if it comes back. Codex and CodeRabbit both found this.

**Already fixed:** 1 comment, by a later commit on this PR.

**The reviewer was wrong**
- CodeRabbit says part of the web address can still reach the log. It can't, because the code removes that part before it writes the log. I posted this reply. In plain words, it says the code already removes it:
  > `RedactURL` clears `Fragment` before `String()` (core/service.go:190), so the fragment never reaches the log.

**Your call**

❓ **Q1** - **Should sync retry forever?** · Risk 4/10

If a sync fails, it tries again forever. Codex wants a limit. The claim is true. The app already shows the error, though, so an endless retry only fills the log and uses a little memory. It loses no data.
- A: Stop after 3 tries, then show the error. A small change with one new test.
- B: Leave it as it is and accept the risk.

➡️ **A.** The fix is cheap, and an endless loop is hard to spot in production.

---

**Not in the patch:** if Sonarr sends back a reply that the app cannot read, the app ignores the problem and carries on with empty data. No bot found this.

**Checks:** the project's automatic checks pass.

**Done:** I closed 3 comment threads, gave 1 Codex comment a 👍, and I wait for the next bot review.

**Reply with** your answer to Q1, or **go** for my pick. Then I fix it, post the answer to @alice's review, and ask @alice to review again.
```

- **Risk N/10** tells how bad it is if the pull request ships with the finding unfixed: 1 to 3 is cosmetic or unlikely, 4 to 6 is a real but contained problem, and 7 to 10 is security, data loss, or a crash. Give a score to each confirmed finding and each judgment call. A wrong or stale finding has no risk, so it gets no score. The report shows only the score, not this legend.
- **Read**: a PR with no closing issue says "the PR body (no closing issue)".
- **Status** is one of: the fixes are saved and on GitHub, the fixes are on this machine and not saved yet, or no changes.
- Each finding is one list item of three sentences at most. For a fix, say whether a test guards it. Put duplicate findings in one item and name each bot.
- **Your call** asks one question for each open judgment call, in the `grilling` round format, all in one round. Leave those threads unresolved until the user answers. Each option that fixes the finding says whether it turned the red test from step 2 green.
- Under each option that leaves a finding as it is, show the reply that the option posts (step 4), in the same form as a reply under **The reviewer was wrong**. The answer that picks the option then approves its reply too, so the reply needs no second round.
- Recommend the fix when it removes copied code, a rule that lives in two places, or behavior that only a comment explains, and the change is small or medium. This holds when the fix touches code older than the pull request: the maintainer pays for the cleanup now or later, and now is cheaper. Recommend leaving it when the fix is a large change, or when it costs more than the failure it prevents.
- Keep each question body near 100 words. Start with the verdict. Then give one concrete case that a user could meet, for example the two names that match by mistake. Name the proof in a few words, without its steps. Say what the pull request changes and what was already there. Give each option one line with its cost in plain terms.
- **Done** lists the writes that the run made. Count the threads that it resolved and the threads that stay open by the list in step 4. Say what is left, for example "wait for CI".
- A reply to a person is not posted yet, so its item says "Reply to post" in place of "I posted this reply".
- **Reply with** is the last line, and only a report with an open judgment call or a reply to a person has it. It tells the user what to reply with and lists the writes that the answer starts.
