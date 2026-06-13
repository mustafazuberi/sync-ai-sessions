# Sync AI Sessions

Encrypted session handoff for AI coding CLIs across devices.

Sync AI Sessions currently supports **Claude Code sessions**.

Tool support:

```text
Claude Code: Supported
Codex CLI:   Not supported yet
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

If you do not pass `--tool`, Sync AI Sessions shows the available session sources:

```text
Sync AI Sessions
Session source

  Claude Code   Supported
  Codex CLI     Not supported yet

Using Claude Code for this handoff.
Tip: use --tool claude to skip this screen in scripts.
```

You can pass Claude explicitly for scripts:

```bash
npx sync-ai-sessions@latest send --tool claude
```

Passing `--tool codex` shows a coming-soon message.

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
Handoff sent

Tool: Claude Code
Repo: github.com/owner/my-app
Gist: abc123
URL: https://gist.github.com/...

Next:
npx sync-ai-sessions@latest receive --gist abc123
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

If receive cannot open a Gist, confirm you are logged into the GitHub account that owns or can access that private Gist.

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

### Wrong passphrase

The passphrase is never uploaded or saved. If receive says the handoff could not be decrypted, rerun receive and enter the exact passphrase used during send.

## Development

```bash
npm install
npm run build
node bin/sync-ai-sessions.js --help
```

Use `node bin/sync-ai-sessions.js` while developing. Use `npx sync-ai-sessions@latest` only after publishing.

## Publish Checklist

```bash
npm run build
npm pack --dry-run
```
