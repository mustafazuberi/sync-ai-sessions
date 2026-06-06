# Edge Case: Repo Remote Is Not Called `origin`

## Simple Explanation

We want to find the same repo on Device B.

Usually git calls the main repo remote `origin`.

But sometimes the same remote is named something else, like `upstream`.

So this can happen:

```text
Device A says: github.com/owner/my-app
Device B has:  upstream -> github.com/owner/my-app
```

This is still the same repo.

The name `upstream` does not matter.

The URL matters:

```text
github.com/owner/my-app
```

## What We Should Do

```text
Check all git remotes.
If any remote URL matches, use that repo.
If none match, save sessions in archive.
```

## Final Rule

Match by remote URL, not by remote name.
