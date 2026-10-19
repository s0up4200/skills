# A failed release run

Some jobs in a release run can publish before another job fails. For example, a Docker job can push the image tags while GoReleaser fails. Find what already went out before you give the user the options.

List the jobs of each failed run. The run ID is the last part of the run URL:

```bash
gh run view <run-id> --json jobs --jq '.jobs[] | "\(.conclusion) \(.name)"'
gh release view <tag> --json isDraft,url
```

For each job that succeeded, read in the workflow file what it publishes, for example image tags, a GitHub release, or a package.

The step is done when the user picked an option. Show the list of what went out, the run link, and these two options:

- Tag the same version again on a fixed commit. The version keeps one release, and its changelog compares with the correct previous tag. Each image tag that already went out gets a new digest, so users who pulled it see a changed image.
- Tag the next patch version on the fixed commit. Nothing that already went out changes. The release notes and the changelog of the patch compare with the failed tag, so they cover only the fix. If the failed run made no release, the changes of the failed version get no release notes.

Each option needs a fix on the release branch first. Make the fix the normal way for the repo, then go back to step 4 with the version that the user picked.

To tag the same version again, delete the old release and the tag first. These commands delete published objects, so ask for a separate yes that names the tag:

```bash
gh release delete <tag> --yes    # only when the release exists
git push origin --delete <tag>
git tag -d <tag>
```
