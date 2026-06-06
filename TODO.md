# TODO

## Main Problem

Claude Code stores sessions by local folder path:

```text
~/.claude/projects/<encoded-cwd>/<session-id>.jsonl
```

Device A and Device B can have the same repo in different folders:

```text
Device A: C:\Users\Ali\work\my-app
Device B: /Users/ali/dev/my-app
```

If we restore using Device A's path on Device B, Claude Code may not show the session under the right project.

## Solution

Do not match projects by folder path.

Match projects by normalized Git remote origin.

Example:

```text
Device A remote: git@github.com:owner/my-app.git
Device B remote: https://github.com/owner/my-app
```

Both normalize to:

```text
github.com/owner/my-app
```

So we know they are the same repo even if their local paths are different.

## Receive Rule

Use remote origin to identify the repo.

Use Device B's local repo path to decide where Claude sessions should be placed.

Destination:

```text
~/.claude/projects/<encoded-device-b-path>/
```

## Current Behavior

```text
1. send detects the current repo remote origin.
2. send stores source metadata inside encrypted payload.
3. receive reads encrypted metadata after decrypting.
4. receive uses --cwd first if provided.
5. receive checks current folder for matching remote.
6. receive searches common local repo folders for matching remote.
7. if found, import sessions into Device B's Claude project folder for that repo.
8. if not found, stop and tell user to clone repo or rerun with --cwd.
9. never overwrite existing Device B session files.
```

Important:

```text
send is repo-based in v1.
It does not send every Claude session on the machine.
```

## Expected UX

Best case:

```bash
cd my-app
npx claude-context-sync@latest receive --gist <gistId>
```

If the current repo remote matches the handoff, sessions attach to this repo.

Explicit target:

```bash
npx claude-context-sync@latest receive --gist <gistId> --cwd /path/to/my-app
```

If no matching repo exists:

```text
No matching local repo was found.
Clone the repo, then rerun receive with --cwd.
```

## Safety Rule

Receive must be additive:

```text
If file does not exist: write it.
If file exists: write imported copy as <name>-imported-<hash>.jsonl.
Never delete local files.
Never overwrite local files.
```
