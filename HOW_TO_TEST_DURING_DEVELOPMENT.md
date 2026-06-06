# How To Test During Development

Use this file when testing the local package before publishing.

## 1. Build

```bash
npm.cmd install
npm.cmd run build
```

## 2. Check CLI

```bash
node bin/claudesync.js --help
```

Expected:

```text
Claude Context Sync
```

## 3. GitHub Auth

```bash
gh auth login
gh auth refresh -s gist
gh auth status
```

## 4. Send From Current Repo

Run from inside the repo you want to test.

For this package repo:

```bash
cd ~/Desktop/side-projects/claude-context-sync
node bin/claudesync.js send
```

Enter a passphrase.

Expected:

```text
Sent Claude handoff
Gist: <gistId>
Repo: github.com/<owner>/<repo>
```

Keep the Gist ID.

## 5. Receive On Same Device

Run from the same repo:

```bash
node bin/claudesync.js receive --gist <gistId>
```

Enter the same passphrase.

Expected:

```text
Received Claude handoff
Imported: ...
Destination: <this repo path>
```

This proves:

```text
Gist download works.
Passphrase decrypt works.
Repo remote matching works.
Session import works.
```

## 6. Test Fresh Restore Locally

Use this only if you are okay clearing local Claude sessions.

Close Claude Code first.

Backup real sessions:

```bash
cp -r ~/.claude/projects ~/.claude/projects.backup
```

Delete current sessions:

```bash
rm -rf ~/.claude/projects
```

Receive again:

```bash
node bin/claudesync.js receive --gist <gistId>
```

Check restored files:

```bash
find ~/.claude/projects -type f
```

Restore backup if needed:

```bash
rm -rf ~/.claude/projects
mv ~/.claude/projects.backup ~/.claude/projects
```

## 7. Receive From Random Folder

Run receive away from the repo:

```bash
cd ~
node ~/Desktop/side-projects/claude-context-sync/bin/claudesync.js receive --gist <gistId>
```

Expected:

```text
It should find the matching repo by Git remote URL.
```

If it cannot find the repo automatically:

```bash
node ~/Desktop/side-projects/claude-context-sync/bin/claudesync.js receive --gist <gistId> --cwd ~/Desktop/side-projects/claude-context-sync
```

## 8. Basic Checks After Code Changes

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

```text
Use node bin/claudesync.js during development.
Use npx claude-context-sync@latest only after publishing.
send must run inside a git repo with a remote.
receive matches repos by Git remote URL, not folder path.
Existing Claude sessions are never overwritten.
```
