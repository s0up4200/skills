# Forgejo pull requests

On Forgejo, the AI review comes from a Forgejo Actions workflow that runs Claude. It posts one plain PR comment per run as user `forgejo-actions`. It makes no review threads. Each comment ends with `<!-- reviewed-sha: <sha> -->`, and the next run reviews only the commits after that SHA.

The next run also reads every `forgejo-actions` comment and every comment by the repository owner. It does not report again a finding that the owner replied is fixed or accepted, unless the code at head shows that it is not fixed. Thus an owner reply is the record on Forgejo. There is no thread to resolve and no reaction to add.

## Step 1 on Forgejo

Use `fj` from the repository root. It finds the repository from the `origin` remote. Read the PR with `fj pr view <n> body`, and read a closed issue with `fj issue view <n>` and `fj issue view <n> comments`. Check out the branch with `fj pr checkout <n>`.

`fj` does not show comment IDs, so read the comments from the API. Take the host, the owner, and the repository from the `origin` remote. `fj` keeps the token in `~/.local/share/forgejo-cli/keys.json`. Read it inside the command so that it never prints:

```bash
curl -fsS -H "Authorization: token $(jq -r --arg h "$host" '.hosts[$h].token' ~/.local/share/forgejo-cli/keys.json)" \
  "https://$host/api/v1/repos/$owner/$repo/issues/$pr/comments?limit=50"
```

Each run reviews only new commits, so the open findings can be in more than one comment. Collect the findings from each `forgejo-actions` comment that no owner comment answers with its `(#<id>)`. Each item in a review comment is one finding. Its comment ID goes with it into the reply.

## Steps 2 and 3

Do them as in SKILL.md. Leave out "Resolve the thread after the push".

## Steps 4 and 5 become one owner reply

Write one PR comment that lists every finding you collected, one line each:

- `Fixed in <sha> (#<comment id>)` for a confirmed finding, or for a judgment that the user chose to fix.
- `Accepted: <reason> (#<comment id>)` for a judgment that the user declined.
- `Refuted: <evidence at file:line or command output> (#<comment id>)` for a wrong finding.
- `Stale: fixed by <sha> (#<comment id>)` for a stale finding.

Leave an open judgment call out of the reply. The next run then reports it again.

The reply goes out under the user's account. Show the full text to the user and wait for an explicit yes before you post it. Post it with `fj pr comment <n> --body-file <file>`.
