import os from "node:os";
import path from "node:path";
import { hasFlag, type CliArgs } from "../core/args.js";
import { projectDirForCwd } from "../core/claude-project.js";
import { copyToClipboard } from "../core/clipboard.js";
import { encryptBytes } from "../core/crypto.js";
import { FriendlyError } from "../core/errors.js";
import { getGitIdentity } from "../core/git.js";
import { createHandoffGist } from "../core/gist-client.js";
import { resolveGitHubToken } from "../core/github-token.js";
import { resolvePaths } from "../core/paths.js";
import { askPassphrase } from "../core/prompt.js";
import { createSnapshot } from "../core/snapshot.js";
import { formatSuccess, printResult } from "../core/output.js";
import { resolveTool, toolDisplayName } from "../core/tools.js";

const maxGistPayloadBytes = 10 * 1024 * 1024;

export async function sendCommand(args: CliArgs): Promise<void> {
  const tool = await resolveTool(args);
  const paths = await resolvePaths(args);
  const git = getGitIdentity(paths.cwd);
  if (!git) {
    throw new FriendlyError(
      "This folder is not a git repo.",
      "Run this command from inside the repo you want to move, or pass --cwd <repo-path>.",
    );
  }

  const repoRemote = git.normalizedRemotes[0];
  if (!repoRemote) {
    throw new FriendlyError("This repo has no Git remote.", "Add a GitHub remote, then rerun send.");
  }

  const token = resolveGitHubToken();
  explainPassphrase(args);
  const passphrase = await askPassphrase();
  const createdAt = new Date().toISOString();
  const sourceCwd = git.cwd;
  const projectHint = path.basename(sourceCwd);
  const sourceClaudeProjectDir = projectDirForCwd(paths.sessionDir, sourceCwd);
  const snapshot = await createSnapshot(sourceClaudeProjectDir, {
    sourceCwd,
    sourceClaudeProjectDir,
    projectName: projectHint,
    gitRemoteOrigin: git.remotes[0],
    normalizedGitRemoteOrigin: repoRemote,
    gitBranch: git.branch,
  });

  const payload = await encryptBytes(snapshot, passphrase, {
    createdAt,
    host: os.hostname(),
    projectHint,
    normalizedGitRemoteOrigin: repoRemote,
  });
  assertPayloadSize(payload);

  const gist = await createHandoffGist(
    token,
    payload,
    `sync-ai-sessions-handoff:${createdAt}:${os.hostname()}:${projectHint}`,
  );
  const receiveCommand = `npx sync-ai-sessions@latest receive --gist ${gist.id}`;
  const copied = hasFlag(args, "copy") ? copyToClipboard(receiveCommand) : false;

  printResult(
    args,
    formatSuccess(
      "Handoff sent",
      [
        { label: "Tool", value: toolDisplayName(tool) },
        { label: "Repo", value: repoRemote },
        { label: "Gist", value: gist.id },
        { label: copied ? "Clipboard" : "URL", value: copied ? "receive command copied" : gist.url },
      ],
      receiveCommand,
    ),
    {
      ok: true,
      command: "send",
      tool,
      gistId: gist.id,
      url: gist.url,
      receiveCommand,
      copied,
      repo: repoRemote,
    },
  );
}

function explainPassphrase(args: CliArgs): void {
  if (args.flags.json) return;

  console.error(color("◇ Choose a passphrase. You’ll need it on the other device.", "cyan"));
  console.error("");
}

function assertPayloadSize(payload: string): void {
  const payloadBytes = Buffer.byteLength(payload, "utf8");
  if (payloadBytes <= maxGistPayloadBytes) return;

  throw new FriendlyError(
    `This handoff is ${formatBytes(payloadBytes)}, which is over the ${formatBytes(maxGistPayloadBytes)} safe upload limit.`,
    "Open Claude Code in this repo and clear older session history, then send again.",
  );
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function color(text: string, tone: "cyan"): string {
  if (!process.stderr.isTTY) return text;
  const codes = {
    cyan: ["\x1b[36m", "\x1b[0m"],
  };
  const [start, end] = codes[tone];
  return `${start}${text}${end}`;
}
