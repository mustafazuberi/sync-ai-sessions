# How To Test During Development

Follow these steps while building the package locally.

## 1. Build The Local CLI

```bash
npm.cmd install
npm.cmd run build
```

## 2. Check The CLI Opens

```bash
node bin/claudesync.js --help
```

Expected:

```text
Claude Context Sync
```

## 3. Authenticate GitHub

Claude Context Sync creates private Gists in your GitHub account.

```bash
gh auth login
gh auth refresh -s gist
gh auth status
```

## 4. Test With A Real Repo

Go to a git repo that has been used with Claude Code.

```bash
cd C:\path\to\your-repo
```

Run local `send`:

```bash
node C:\Users\DELL\Desktop\side-projects\claude-context-sync\bin\claudesync.js send
```

Enter a passphrase.

Expected:

```text
Sent Claude handoff
Gist: <gistId>
Repo: github.com/owner/repo
```

Keep the printed Gist ID.

## 5. Test Receive

Go to the same repo on this machine or another machine.

```bash
cd C:\path\to\same-repo
```

Run:

```bash
node C:\Users\DELL\Desktop\side-projects\claude-context-sync\bin\claudesync.js receive --gist <gistId>
```

Enter the same passphrase.

Expected:

```text
Received Claude handoff
Imported: ...
Destination: C:\path\to\same-repo
```

## 6. Test Receive From Any Folder

You can receive from a random folder if the repo exists somewhere on this device.

```bash
cd C:\
node C:\Users\DELL\Desktop\side-projects\claude-context-sync\bin\claudesync.js receive --gist <gistId>
```

Claude Context Sync should search common folders and attach sessions to the matching repo.

If it cannot find the repo, use `--cwd`:

```bash
node C:\Users\DELL\Desktop\side-projects\claude-context-sync\bin\claudesync.js receive --gist <gistId> --cwd C:\path\to\same-repo
```

## 7. Safe Fake Session Testing

Use this if you do not want to touch real Claude sessions.

Set a fake Claude session root:

```powershell
$env:CLAUDESYNC_SESSION_DIR="C:\temp\fake-claude-projects"
```

Then run `send` from a real git repo:

```bash
cd C:\path\to\your-repo
node C:\Users\DELL\Desktop\side-projects\claude-context-sync\bin\claudesync.js send
```

If it says no Claude sessions were found, create the expected fake project folder and add a fake session file.

Rerun:

```bash
node C:\Users\DELL\Desktop\side-projects\claude-context-sync\bin\claudesync.js send
```

Clear the fake override when done:

```powershell
Remove-Item Env:\CLAUDESYNC_SESSION_DIR
```

## 8. Basic Dev Checks

Run these after code changes:

```bash
npm.cmd run build
node bin/claudesync.js --help
node bin/claudesync.js receive
```

Expected missing Gist error:

```text
Failed: Missing Gist ID.
Fix: Run: npx claude-context-sync@latest receive --gist <gistId>
```

## Notes

- Use `node bin/claudesync.js` during development.
- Use `npx claude-context-sync@latest` only after publishing.
- `send` must be run from inside a git repo with a remote.
- `receive` matches repos by Git remote URL, not by folder path.
- Existing Claude sessions are never overwritten.
