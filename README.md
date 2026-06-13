# Sync AI Sessions

Encrypted session handoff for AI coding CLIs across devices.

Sync AI Sessions currently supports **Claude Code sessions**.

Tool support:

```text
Claude Code: supported
Codex CLI:   coming in a future version
```

## What It Does Today

Sync AI Sessions packages the Claude Code session files for the current git repo, encrypts them on your machine, uploads the encrypted payload to a private Gist in your GitHub account, and imports them on another device without deleting existing Claude sessions.

## Quick Start

```bash
# Device A
cd my-app
npx sync-ai-sessions@latest send

# Device B
npx sync-ai-sessions@latest receive --gist <gistId>
```

Optional explicit tool selection:

```bash
npx sync-ai-sessions@latest send --tool claude
```

## Requirements

- Node.js 20 or newer
- GitHub CLI
- Claude Code already used at least once on the source machine

Authenticate GitHub:

```bash
gh auth login
gh auth refresh -s gist
```

## Install

Run once on each device:

```bash
npx sync-ai-sessions@latest install
```

Use the same passphrase when receiving the handoff on another device.

## Send From Device A

Run from inside the git repo you want to move:

```bash
cd my-app
npx sync-ai-sessions@latest send
```

Every `send` creates a separate private Gist. The Gist contains one encrypted file with the session handoff.

Example output:

```text
Sent Claude Code session handoff
Gist: abc123
URL: https://gist.github.com/...
Repo: github.com/owner/my-app

On the other device:
npx sync-ai-sessions@latest receive --gist abc123

Keep the passphrase private.
```

## Receive On Device B

```bash
npx sync-ai-sessions@latest receive --gist <gistId>
```

Sync AI Sessions matches repos by Git remote URL, not local folder path. This means the same repo can live at different paths on different devices.

Example:

```text
Device A: C:\work\my-app
Device B: /Users/you/dev/my-app
Remote:   github.com/owner/my-app
```

If no matching repo is found, Sync AI Sessions stops and explains how to clone the repo or pass `--cwd`. It does not attach sessions to the wrong project.

## Where Claude Sessions Are Read From

```text
Windows: C:\Users\<you>\.claude\projects
macOS:   /Users/<you>/.claude/projects
Linux:   /home/<you>/.claude/projects
```

For development or debugging only:

```bash
CLAUDESYNC_SESSION_DIR=/path/to/test-sessions npx sync-ai-sessions@latest send
```

## Useful Commands

```bash
npx sync-ai-sessions@latest doctor
npx sync-ai-sessions@latest send --copy
npx sync-ai-sessions@latest send --tool claude
npx sync-ai-sessions@latest send --json
npx sync-ai-sessions@latest receive --gist <gistId> --json
```

After global install, you can use the shorter alias:

```bash
aisessions send
aisessions receive --gist <gistId>
```

## Security

- Session data is encrypted locally before upload.
- GitHub stores only encrypted ciphertext.
- The Gist ID identifies the handoff, but it is not enough to decrypt it.
- The passphrase is never uploaded.
- Existing local sessions are never overwritten.

## Troubleshooting

### GitHub login required

```bash
gh auth login
gh auth refresh -s gist
```

### No Claude sessions found

Open Claude Code once in the git repo you want to move, then rerun:

```bash
cd /path/to/repo
npx sync-ai-sessions@latest send
```

### No matching repo found

Clone the repo, then rerun receive with an explicit target:

```bash
npx sync-ai-sessions@latest receive --gist <gistId> --cwd /path/to/repo
```

## Development

```bash
npm install
npm run build
node bin/claudesync.js --help
```

Use `node bin/claudesync.js` while developing. Use `npx sync-ai-sessions@latest` only after publishing.

## Publish Checklist

```bash
npm run build
npm pack --dry-run
```
