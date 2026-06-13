# Remaining Edge Cases

These are the things we still need to improve.

## 1. Claude Code Is Running During Receive

Problem:

```text
Claude Code may be reading or writing session files while we import.
```

Current behavior:

```text
We do not warn the user.
```

Recommended behavior:

```text
Before receive, warn:
"Close Claude Code before importing sessions."
```

Why:

```text
This reduces the chance of file conflicts.
```

## 2. Source Branch Is Not Shown

Problem:

```text
The handoff stores the branch from Device A, but receive does not show it.
```

Current behavior:

```text
Import works, but user does not know which branch the session came from.
```

Recommended behavior:

```text
Show source branch in receive output when available.
```

Example:

```text
Source branch: feature/login
```

## 3. Handoff Is Too Large

Problem:

```text
Claude sessions may become large.
GitHub Gist may reject a very large upload.
```

Current behavior:

```text
We do not check size before upload.
```

Recommended behavior:

```text
Check payload size before upload.
If too large, fail with a clear message.
```

Why:

```text
The user should get a clear reason before upload fails.
```

## 4. Wrong GitHub Account

Problem:

```text
Device B may be logged into a different GitHub account than Device A.
That account may not have access to the private Gist.
```

Current behavior:

```text
The error is not specific enough.
```

Recommended behavior:

```text
Say:
"This GitHub account cannot access the Gist."
```

## 5. Gist Was Deleted

Problem:

```text
The handoff Gist may have been deleted.
```

Current behavior:

```text
The error is not specific enough.
```

Recommended behavior:

```text
Say:
"Handoff not found or deleted."
```

## Already Decided

```text
Different remote URL:
Treat as different repo.

Same normalized remote URL:
Treat as same repo, even if local folder path is different.

Remote name:
Ignore it. Match by URL, not by names like origin/upstream.

Partial import failure:
Handled. We stage files in a temporary folder before moving them into Claude's real session folder.
```
