# Remaining Edge Cases

These are known cases we are not fully handling yet.

## Repo Matching

```text
Fork vs upstream:
Exact remote match may fail if Device A uses fork and Device B uses upstream.

Multiple matching repos:
Currently fails with --cwd suggestion. Later we may add interactive picker.
```

## Import Safety

```text
Partial import failure:
Need temp staging before writing final files.

Claude Code running:
Need warning or --force behavior before modifying session files.
```

## Session Data

```text
Absolute paths inside JSONL:
Need to decide whether to preserve or rewrite. Recommendation for v1: preserve.

Different branch:
Need to show source branch, but still import.

Huge handoff:
Need size check before uploading to Gist.
```

## GitHub

```text
Missing Gist permission:
Need exact fix: gh auth refresh -s gist

Wrong GitHub account:
Need clear error if Device B cannot access the private Gist.

Deleted Gist:
Need clear "handoff not found" message.
```

## Platform

```text
Claude storage changes:
Need doctor and CLAUDESYNC_SESSION_DIR override to remain reliable.
```
