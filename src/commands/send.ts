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
import { printResult } from "../core/output.js";
import { resolveTool, toolDisplayName } from "../core/tools.js";

export async function sendCommand(args: CliArgs): Promise<void> {
  const tool = resolveTool(args);
  const paths = await resolvePaths(args);
  const git = getGitIdentity(paths.cwd);
  if (!git) {
    throw new FriendlyError(
      "No git repo found.",
      "Run this command from inside the repo you want to move, or pass --cwd <repo-path>.",
    );
  }

  const repoRemote = git.normalizedRemotes[0];
  if (!repoRemote) {
    throw new FriendlyError("No git remote found for this repo.", "Add a remote or run from a repo with a GitHub remote.");
  }

  const token = resolveGitHubToken();
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

  const gist = await createHandoffGist(
    token,
    payload,
    `sync-ai-sessions-handoff:${createdAt}:${os.hostname()}:${projectHint}`,
  );
  const receiveCommand = `npx sync-ai-sessions@latest receive --gist ${gist.id}`;
  const copied = hasFlag(args, "copy") ? copyToClipboard(receiveCommand) : false;

  printResult(
    args,
    [
      "Sent Claude Code session handoff",
      `Tool: ${toolDisplayName(tool)}`,
      `Gist: ${gist.id}`,
      copied ? "Clipboard: receive command copied" : `URL: ${gist.url}`,
      `Repo: ${repoRemote}`,
      "",
      "On the other device:",
      receiveCommand,
      "",
      "Keep the passphrase private.",
    ].join("\n"),
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
