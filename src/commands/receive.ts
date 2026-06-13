import path from "node:path";
import { getFlag, type CliArgs } from "../core/args.js";
import { projectDirForCwd } from "../core/claude-project.js";
import { decryptBytes } from "../core/crypto.js";
import { FriendlyError } from "../core/errors.js";
import { findReposByRemote, getGitIdentity } from "../core/git.js";
import { getHandoffPayload } from "../core/gist-client.js";
import { resolveGitHubToken } from "../core/github-token.js";
import { resolvePaths } from "../core/paths.js";
import { askPassphrase } from "../core/prompt.js";
import { mergeSnapshot, readSnapshot } from "../core/snapshot.js";
import { printResult } from "../core/output.js";
import { resolveTool, toolDisplayName } from "../core/tools.js";

export async function receiveCommand(args: CliArgs): Promise<void> {
  const tool = resolveTool(args);
  const gistId = getFlag(args, "gist") ?? args.positionals[0];
  if (!gistId) throw new FriendlyError("Missing Gist ID.", "Run: npx sync-ai-sessions@latest receive --gist <gistId>");

  const paths = await resolvePaths(args);
  const token = resolveGitHubToken();
  const payload = await getHandoffPayload(token, gistId);
  const decrypted = await decryptWithRetry(payload);
  const snapshot = await readSnapshot(decrypted.bytes);
  const target = await resolveImportTarget(args, paths, snapshot.metadata.normalizedGitRemoteOrigin, gistId);
  const result = await mergeSnapshot(snapshot, target.dir);

  printResult(
    args,
    [
      "Received Claude Code session handoff",
      `Tool: ${toolDisplayName(tool)}`,
      `Gist: ${gistId}`,
      `Imported: ${result.added}`,
      `Renamed: ${result.renamed}`,
      `Skipped: ${result.skipped}`,
      `Destination: ${target.label}`,
      target.note,
      "",
      "Next: open Claude Code and resume imported session",
    ].filter(Boolean).join("\n"),
    {
      ok: true,
      command: "receive",
      tool,
      gistId,
      destination: target.dir,
      destinationType: target.type,
      ...result,
    },
  );
}

async function resolveImportTarget(
  args: CliArgs,
  paths: Awaited<ReturnType<typeof resolvePaths>>,
  normalizedRemote: string | undefined,
  gistId: string,
): Promise<{ dir: string; label: string; type: "cwd" | "matched-repo"; note?: string }> {
  if (!normalizedRemote) {
    throw new FriendlyError("This handoff is missing repo identity.", "Create a new handoff from inside a git repo.");
  }

  const explicitCwd = getFlag(args, "cwd");
  if (explicitCwd) {
    const cwd = path.resolve(explicitCwd);
    const explicitRepo = getGitIdentity(cwd);
    if (!explicitRepo?.normalizedRemotes.includes(normalizedRemote)) {
      throw new FriendlyError(
        "The --cwd repo does not match this handoff.",
        `Use the repo for ${normalizedRemote}, or rerun without --cwd to search automatically.`,
      );
    }

    return { dir: projectDirForCwd(paths.sessionDir, explicitRepo.cwd), label: explicitRepo.cwd, type: "cwd" };
  }

  const current = getGitIdentity(paths.cwd);
  if (current?.normalizedRemotes.includes(normalizedRemote)) {
    return { dir: projectDirForCwd(paths.sessionDir, current.cwd), label: current.cwd, type: "matched-repo" };
  }

  const matches = await findReposByRemote(normalizedRemote, paths.cwd);
  if (matches.length === 1) {
    return { dir: projectDirForCwd(paths.sessionDir, matches[0]), label: matches[0], type: "matched-repo" };
  }

  if (matches.length > 1) {
    throw new FriendlyError(
      "Multiple local repos match this handoff.",
      `Rerun with: npx sync-ai-sessions@latest receive --gist ${gistId} --cwd <repo-path>`,
    );
  }

  throw new FriendlyError(
    `No local repo found for ${normalizedRemote}.`,
    `Clone the repo, then rerun: npx sync-ai-sessions@latest receive --gist ${gistId} --cwd <repo-path>`,
  );
}

async function decryptWithRetry(payload: string) {
  try {
    return await decryptBytes(payload, await askPassphrase());
  } catch (error) {
    if (!(error instanceof FriendlyError)) throw error;
    console.error("Failed: Could not decrypt handoff.");
    console.error("Retry: enter the passphrase again.");
    return decryptBytes(payload, await askPassphrase());
  }
}
