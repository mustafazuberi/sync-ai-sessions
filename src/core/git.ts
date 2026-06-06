import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type GitIdentity = {
  cwd: string;
  branch?: string;
  remotes: string[];
  normalizedRemotes: string[];
};

export function getGitIdentity(cwd: string): GitIdentity | undefined {
  const root = getGitRoot(cwd);
  if (!root) return undefined;

  const remotes = getRemoteUrls(root);
  const normalizedRemotes = remotes.map(normalizeGitRemote).filter((remote): remote is string => Boolean(remote));

  return {
    cwd: root,
    branch: getBranch(root),
    remotes,
    normalizedRemotes,
  };
}

export function normalizeGitRemote(remote: string): string | undefined {
  let value = remote.trim();
  if (!value) return undefined;

  value = value.replace(/^ssh:\/\/git@/i, "");
  value = value.replace(/^git@/i, "");
  value = value.replace(/^https?:\/\//i, "");
  value = value.replace(/^ssh:\/\//i, "");
  value = value.replace(/:/, "/");
  value = value.replace(/\.git$/i, "");
  value = value.replace(/\/$/, "");
  value = value.toLowerCase();

  return value || undefined;
}

export async function findReposByRemote(normalizedRemote: string, cwd: string): Promise<string[]> {
  const candidates = new Set<string>();
  const current = getGitRoot(cwd);
  if (current) candidates.add(current);

  for (const root of defaultScanRoots(cwd)) {
    for (const repo of await findGitRepos(root, 4)) {
      candidates.add(repo);
    }
  }

  const matches: string[] = [];
  for (const repo of candidates) {
    const identity = getGitIdentity(repo);
    if (identity?.normalizedRemotes.includes(normalizedRemote)) matches.push(repo);
  }

  return matches;
}

function getGitRoot(cwd: string): string | undefined {
  try {
    return execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

function getRemoteUrls(cwd: string): string[] {
  try {
    return execFileSync("git", ["-C", cwd, "remote", "-v"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/)[1])
      .filter((remote): remote is string => Boolean(remote));
  } catch {
    return [];
  }
}

function getBranch(cwd: string): string | undefined {
  try {
    return execFileSync("git", ["-C", cwd, "branch", "--show-current"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

function defaultScanRoots(cwd: string): string[] {
  const home = os.homedir();
  return [cwd, path.join(home, "code"), path.join(home, "dev"), path.join(home, "projects"), path.join(home, "Desktop")]
    .map((root) => path.resolve(root))
    .filter((root, index, roots) => existsSync(root) && roots.indexOf(root) === index);
}

async function findGitRepos(root: string, depth: number): Promise<string[]> {
  if (depth < 0 || !existsSync(root)) return [];

  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  if (entries.some((entry) => entry.isDirectory() && entry.name === ".git")) return [root];

  const repos: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || shouldSkipDir(entry.name)) continue;
    repos.push(...(await findGitRepos(path.join(root, entry.name), depth - 1)));
  }

  return repos;
}

function shouldSkipDir(name: string): boolean {
  return [".git", "node_modules", "dist", ".next", ".cache", "AppData", "Library"].includes(name);
}
