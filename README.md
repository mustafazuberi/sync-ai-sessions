# Sync AI Sessions

Encrypted handoff for AI coding CLI sessions across devices.

Move local AI coding session context from one machine to another using your own private GitHub Gist. Your sessions are encrypted before upload, and existing local sessions are not overwritten.

Sync AI Sessions is designed for multiple AI coding CLIs. Claude Code is supported today; Codex CLI is shown in the product flow and planned next.

## Why

AI coding CLIs keep useful context in local session files. When you switch laptops or desktops, that context usually stays behind.

Sync AI Sessions creates a small encrypted handoff so you can continue the same repo work on another device. The package is tool-aware: users choose which AI session source they want to sync.

## Features

- Encrypts session data locally before upload
- Stores handoffs in your own private GitHub Gists
- Uses GitHub CLI auth, no token paste required
- Matches repos by Git remote URL, not local folder path
- Imports safely without overwriting existing sessions
- Works from any folder with `--cwd`
- Supports JSON output for scripts

## Requirements

- Node.js 20+
- GitHub CLI installed and authenticated
- Claude Code used at least once in the source repo for the current release

Authenticate GitHub:

```bash
gh auth login
gh auth refresh -s gist
```

## Quick Start

On device A:

```bash
cd my-app
npx sync-ai-sessions@latest send
```

Copy the printed Gist ID.

On device B:

```bash
npx sync-ai-sessions@latest receive --gist <gistId>
```

Use the same passphrase on both devices.

## Install

Run once per device:

```bash
npx sync-ai-sessions@latest install
```

The install command checks GitHub auth, stores local config under `~/.sync-ai-sessions`, and asks you to create a passphrase.

## Commands

| Command | Purpose |
| --- | --- |
| `sync-ai-sessions install` | Prepare this device |
| `sync-ai-sessions send` | Create an encrypted handoff |
| `sync-ai-sessions receive --gist <gistId>` | Import a handoff |
| `sync-ai-sessions doctor` | Check local setup |

Alias:

```bash
aisessions send
aisessions receive --gist <gistId>
```

## Supported Session Sources

| Tool | Status |
| --- | --- |
| Claude Code | Supported |
| Codex CLI | Planned next |

Use Claude explicitly in scripts:

```bash
npx sync-ai-sessions@latest send --tool claude
```

## How It Works

`send`:

1. Finds the selected AI session source.
2. Finds the current git repo.
3. Finds the session folder for that repo.
4. Packages only that repo's session files.
5. Encrypts the package locally with your passphrase.
6. Uploads the encrypted payload to a new private Gist.

`receive`:

1. Downloads the encrypted Gist payload.
2. Asks for the passphrase.
3. Decrypts locally.
4. Finds the matching local repo by Git remote URL.
5. Imports sessions into the correct local session folder for that tool.

## Repo Matching

Sync AI Sessions does not depend on both devices using the same folder path.

Example:

```text
Device A: C:\work\my-app
Device B: /Users/you/dev/my-app
Remote:   github.com/owner/my-app
```

As long as both folders point to the same Git remote, receive can attach the imported sessions to the correct local repo.

If the repo cannot be found, receive stops and tells you to clone the repo or pass `--cwd`.

```bash
npx sync-ai-sessions@latest receive --gist <gistId> --cwd /path/to/repo
```

## Security

- Session files are encrypted before leaving your machine.
- GitHub stores only ciphertext.
- The Gist ID is not enough to decrypt the handoff.
- The passphrase is never uploaded.
- The passphrase is not stored by Sync AI Sessions.
- Existing local sessions are never overwritten.

Encryption details:

```text
AES-256-GCM
scrypt key derivation
random salt and IV per handoff
```

## Session Locations

Today, Claude Code sessions are read from:

```text
Windows: C:\Users\<you>\.claude\projects
macOS:   /Users/<you>/.claude/projects
Linux:   /home/<you>/.claude/projects
```

Override for development or custom setups:

```bash
SYNC_AI_SESSIONS_SESSION_DIR=/path/to/sessions npx sync-ai-sessions@latest doctor
```

## Options

| Option | Purpose |
| --- | --- |
| `--tool claude` | Skip tool selection |
| `--cwd <path>` | Use a specific repo path |
| `--copy` | Copy receive command after send |
| `--json` | Print machine-readable output |
| `--debug` | Show technical errors |

## Troubleshooting

### GitHub auth fails

```bash
gh auth login
gh auth refresh -s gist
```

Make sure you are logged into the GitHub account that owns or can access the private Gist.

### No Claude sessions found

Open Claude Code once inside the repo, then send again:

```bash
cd /path/to/repo
npx sync-ai-sessions@latest send
```

### No matching repo found

Clone the repo on this device, then receive again:

```bash
npx sync-ai-sessions@latest receive --gist <gistId> --cwd /path/to/repo
```

### Wrong passphrase

Receive cannot decrypt the handoff unless the passphrase exactly matches the one used during send.

## Current Limitations

- Claude Code is the first supported session source.
- Codex CLI is intentionally visible in the CLI but disabled until its adapter is implemented.
- Each `send` creates a separate private Gist.
- The target repo must exist on the receiving device.
- Very large session folders may exceed practical Gist limits.

## Development

```bash
npm install
npm run build
node bin/sync-ai-sessions.js --help
```

Use the local CLI while developing:

```bash
node bin/sync-ai-sessions.js send --tool claude
```
