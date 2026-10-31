# Label work without a UI

The release workflow leaves PRs with the `no-ui-yet` label out of the Highlights, because users cannot reach their feature in the app yet. The labels must be final before the tag push. The release publishes without a review, and Discord posts the release body one time.

List each PR in the range that has no `no-ui-yet` label, and has the `remote-agent` label or changes the remote code. Some remote PRs have no `remote-agent` label, so the path check is necessary:

```bash
git log <latest-tag>..HEAD --format='%H %s' | while read -r sha subject; do
  [[ $subject =~ \(#([0-9]+)\)$ ]] || continue
  n=${BASH_REMATCH[1]}
  labels=,$(gh pr view "$n" --json labels --jq '[.labels[].name] | join(",")'),
  [[ $labels == *,no-ui-yet,* ]] && continue
  if [[ $labels == *,remote-agent,* ]] ||
    git show --name-only --format= "$sha" | grep -qE '^internal/(sshpool/|fsops/remote/|fsops/fileid\.go)'; then
    echo "#$n $subject"
  fi
done
```

The step is done when the user answered for each listed PR. Show the list, and for each PR ask if users can reach the change in the app today. Add the label only to the PRs that the user says no for:

```bash
gh pr edit <n> --add-label no-ui-yet
```

- A mixed PR stays unlabeled. A mixed PR has a remote part and also a part that users can reach.
- The PR that adds the SSH setup screen stays unlabeled. That work is #2917, and it can come as several PRs. Its body must describe the whole remote feature, because the earlier remote PRs got no Highlight.
- If the body of a PR that gets the label has a real Breaking change section, also add the `BREAKING CHANGE` label. The workflow keeps a labeled PR only for that label or for a `!` in the commit subject.
- After the release with the SSH setup screen is out, tell the user to remove the remote check from this file. Keep the label, because `to-tickets` puts it on the tickets of each feature with a hidden UI.
