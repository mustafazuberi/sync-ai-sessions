import os from "node:os";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { getFlag, type CliArgs } from "./args.js";
import { FriendlyError } from "./errors.js";

export type ResolvedPaths = {
  homeDir: string;
  configPath: string;
  sessionDir: string;
  sessionReason: string;
  backupDir: string;
  cwd: string;
};

export async function resolvePaths(args: CliArgs): Promise<ResolvedPaths> {
  const homeDir = path.join(os.homedir(), ".sync-ai-sessions");
  const cwd = path.resolve(getFlag(args, "cwd") ?? process.cwd());
  try {
    await mkdir(homeDir, { recursive: true });
    await mkdir(path.join(homeDir, "backups"), { recursive: true });
  } catch {
    throw new FriendlyError(
      "Sync AI Sessions cannot write its local config folder.",
      `Check permissions for ${homeDir}, then retry.`,
    );
  }
  const session = await resolveSessionDir(path.join(homeDir, "config.json"));

  return {
    homeDir,
    configPath: path.join(homeDir, "config.json"),
    sessionDir: session.path,
    sessionReason: session.reason,
    backupDir: path.join(homeDir, "backups"),
    cwd,
  };
}

async function resolveSessionDir(configPath: string): Promise<{ path: string; reason: string }> {
  if (process.env.CLAUDESYNC_SESSION_DIR) {
    return { path: path.resolve(process.env.CLAUDESYNC_SESSION_DIR), reason: "CLAUDESYNC_SESSION_DIR" };
  }

  const configSessionDir = await readConfigSessionDir(configPath);
  if (configSessionDir) {
    return { path: path.resolve(configSessionDir), reason: "Sync AI Sessions config" };
  }

  const home = os.homedir();
  return { path: path.join(home, ".claude", "projects"), reason: "Claude Code default: ~/.claude/projects" };
}

async function readConfigSessionDir(configPath: string): Promise<string | undefined> {
  if (!existsSync(configPath)) return undefined;
  try {
    const config = JSON.parse(await readFile(configPath, "utf8")) as { sessionDir?: string };
    return config.sessionDir;
  } catch {
    return undefined;
  }
}
