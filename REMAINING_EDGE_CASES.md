# Remaining Edge Cases

These are the important cases not fully handled yet.

## Repo Matching

```text
Fork vs upstream:
Device A may use a fork remote, while Device B uses the upstream remote.
Current behavior: exact remote match only.
Needed: allow user to attach with --cwd after showing a clear mismatch message.
```

## Import Safety

```text
Partial import failure:
Current behavior: writes files during import.
Needed: stage files in temp first, then move into final location after validation.

Claude Code running:
Current behavior: receive does not warn.
Needed: warn user to close Claude Code before modifying session files.
```

## Session Data

```text
Different branch:
Current behavior: branch is stored but not shown.
Needed: show source branch in receive output when available.

Huge handoff:
Current behavior: no size check before Gist upload.
Needed: check payload size and fail with a clear message if too large.
```

## GitHub

```text
Wrong GitHub account:
Current behavior: access failure is generic.
Needed: say this GitHub account cannot access the Gist.

Deleted Gist:
Current behavior: not found looks like a generic read failure.
Needed: say handoff not found or deleted.
```

## Already Handled

```text
Remote not named origin:
Handled. We check all git remote URLs, not only origin.

Repo paths differ across devices:
Handled. We match by normalized Git remote URL.

Multiple matching repos:
Handled safely. We stop and suggest --cwd.

Repo missing on Device B:
Handled safely. We stop and tell user to clone repo or use --cwd.

Same Gist received twice:
Handled. Existing files are not overwritten; imported copies get a suffix.

Claude storage path override:
Handled. CLAUDESYNC_SESSION_DIR and doctor exist.
```
