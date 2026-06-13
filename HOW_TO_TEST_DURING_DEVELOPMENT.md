# How To Test During Development

Use this file when testing the local package before publishing.

## 1. Build

```bash
npm.cmd install
npm.cmd run build
```

## 2. Check CLI

```bash
node bin/sync-ai-sessions.js --help
```

Expected:

```text
Sync AI Sessions
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
cd /path/to/sync-ai-sessions
node bin/sync-ai-sessions.js send
```

It should show:

```text
Sync AI Sessions
Session source

  Claude Code   Supported
  Codex CLI     Not supported yet

Using Claude Code for this handoff.
Tip: use --tool claude to skip this screen in scripts.
```

Claude Code is used automatically. You can also be explicit:

```bash
node bin/sync-ai-sessions.js send --tool claude
```

Enter a passphrase.

Expected:

```text
Handoff sent
Tool: Claude Code
Repo: github.com/<owner>/<repo>
Gist: <gistId>
```

Keep the Gist ID.

## 5. Receive On Same Device

Run from the same repo:

```bash
node bin/sync-ai-sessions.js receive --gist <gistId>
```

Enter the same passphrase.

Expected:

```text
Handoff received
Tool: Claude Code
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

## 6. Test Push, Delete, Pull Again

Use this flow to confirm Sync AI Sessions can restore sessions after local Claude sessions are removed.

Close Claude Code first.

Start from this repo:

```bash
cd /path/to/sync-ai-sessions
```

Send a fresh handoff:

```bash
node bin/sync-ai-sessions.js send
```

Copy the printed Gist ID.

Backup current Claude sessions:

```bash
cp -r ~/.claude/projects ~/.claude/projects.backup
```

Delete current sessions:

```bash
rm -rf ~/.claude/projects
```

Pull sessions back from the Gist:

```bash
node bin/sync-ai-sessions.js receive --gist <gistId>
```

Enter the same passphrase used during `send`.

Check restored files:

```bash
find ~/.claude/projects -type f
```

Expected:

```text
You should see Claude session files restored under ~/.claude/projects.
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
node /path/to/sync-ai-sessions/bin/sync-ai-sessions.js receive --gist <gistId>
```

Expected:

```text
It should find the matching repo by Git remote URL.
```

If it cannot find the repo automatically:

```bash
node /path/to/sync-ai-sessions/bin/sync-ai-sessions.js receive --gist <gistId> --cwd /path/to/sync-ai-sessions
```

## 8. Basic Checks After Code Changes

```bash
npm.cmd run build
node bin/sync-ai-sessions.js --help
node bin/sync-ai-sessions.js receive
node bin/sync-ai-sessions.js send --tool codex
node bin/sync-ai-sessions.js send --tool claude
```

Expected missing Gist error:

```text
Sync AI Sessions could not continue

Reason: No Gist ID was provided.
Next: Run: npx sync-ai-sessions@latest receive --gist <gistId>
```

Expected Codex coming-soon error:

```text
Sync AI Sessions could not continue

Reason: Codex CLI sessions are not supported yet.
Next: Use --tool claude for now. Codex support is planned for a future Sync AI Sessions release.
```

## Notes

```text
Use node bin/sync-ai-sessions.js during development.
Use npx sync-ai-sessions@latest only after publishing.
send must run inside a git repo with a remote.
receive matches repos by Git remote URL, not folder path.
Existing Claude sessions are never overwritten.
```
