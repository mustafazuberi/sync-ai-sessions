# Claude Context Sync

Move Claude Code sessions from one device to another with an encrypted GitHub Gist handoff.

Claude Context Sync packages the Claude Code session files for the current git repo, encrypts them on your machine, uploads the encrypted payload to a private Gist in your GitHub account, and imports them on another device without deleting existing Claude sessions.

## Why

Claude Code stores session history locally. When you switch computers, the new machine usually cannot continue the same project session. Claude Context Sync gives you a simple repo handoff flow:

```bash
# Device A
npx claude-context-sync@latest send

# Device B
npx claude-context-sync@latest receive --gist <gistId>
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

Claude Context Sync uses GitHub CLI auth so you do not need to paste a personal access token into the tool.

## Install

Run once on each device:

```bash
npx claude-context-sync@latest install
```

You will create a passphrase. Use the same passphrase when receiving the handoff on another device.

## Send From Device A

```bash
cd my-app
npx claude-context-sync@latest send
```

Run this from inside the git repo you want to move. Claude Context Sync creates a new private Gist and prints something like:

```text
Sent Claude handoff
Gist: abc123
URL: https://gist.github.com/...

On the other device:
npx claude-context-sync@latest receive --gist abc123

Keep the passphrase private.
```

Every `send` creates a separate private Gist, so each handoff has its own Gist ID.

## Receive On Device B

```bash
npx claude-context-sync@latest receive --gist <gistId>
```

Enter the same passphrase used on Device A.

Claude Context Sync imports the pulled sessions into the local Claude session directory. Existing sessions are preserved. If a file already exists, the imported copy is renamed with an `-imported-<hash>` suffix.

Claude Context Sync matches repos by Git remote URL, not local folder path. If Device A uses `C:\work\my-app` and Device B uses `/Users/you/dev/my-app`, the sessions still attach correctly when both folders point to the same GitHub repo.

If no matching repo is found, Claude Context Sync stops and explains how to clone the repo or pass `--cwd`. It does not attach sessions to the wrong project.

## Where Sessions Are Read From

Claude Context Sync reads Claude Code sessions from:

```text
Windows: C:\Users\<you>\.claude\projects
macOS:   /Users/<you>/.claude/projects
Linux:   /home/<you>/.claude/projects
```

You normally do not need to configure this.

For development or debugging only, you can override the session directory:

```bash
CLAUDESYNC_SESSION_DIR=/path/to/test-sessions npx claude-context-sync@latest send
```

## Check Setup

```bash
npx claude-context-sync@latest doctor
```

`doctor` checks GitHub auth, the resolved Claude session directory, and local Claude Context Sync config.

## Useful Options

Copy the receive command to clipboard when supported:

```bash
npx claude-context-sync@latest send --copy
```

Print machine-readable output:

```bash
npx claude-context-sync@latest send --json
npx claude-context-sync@latest receive --gist <gistId> --json
```

Show technical errors:

```bash
npx claude-context-sync@latest doctor --debug
```

## Security

- Session data is encrypted locally before upload.
- GitHub stores only encrypted ciphertext.
- The Gist ID identifies the handoff, but it is not enough to decrypt it.
- The passphrase is never uploaded.
- Normal output does not print secrets or stack traces.

## Troubleshooting

### GitHub login required

Run:

```bash
gh auth login
gh auth refresh -s gist
```

Then retry the Claude Context Sync command.

### No Claude sessions found

Open Claude Code once in the git repo you want to move, then rerun:

```bash
cd /path/to/repo
npx claude-context-sync@latest send
```

### Wrong passphrase

Use the same passphrase you entered when sending the handoff.

### Need diagnostics

Run:

```bash
npx claude-context-sync@latest doctor
```

### No matching repo found

This means Claude Context Sync could not find a local repo with the same Git remote as the handoff.

Clone the repo, then rerun receive with an explicit target:

```bash
npx claude-context-sync@latest receive --gist <gistId> --cwd /path/to/repo
```

## Development

Clone the repo and run:

```bash
npm install
npm run build
node bin/claudesync.js --help
```

Use a fake session directory while developing so you do not touch real Claude sessions:

```bash
CLAUDESYNC_SESSION_DIR=.dev-sessions/a node bin/claudesync.js send
CLAUDESYNC_SESSION_DIR=.dev-sessions/b node bin/claudesync.js receive --gist <gistId>
```

`.dev-sessions` is only a local test folder. Normal users should not use it.

## Publish Checklist

Before publishing:

```bash
npm run build
npm pack --dry-run
```

Confirm the package includes `bin/`, `dist/`, `README.md`, and `package.json`.

After global install, you can use the shorter alias:

```bash
ccsync send
ccsync receive --gist <gistId>
```
