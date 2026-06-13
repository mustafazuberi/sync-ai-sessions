import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { FriendlyError } from "./errors.js";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export type SnapshotFile = {
  path: string;
  content: string;
  mtimeMs: number;
};

export type Snapshot = {
  v: 2;
  createdAt: string;
  sourceDir: string;
  metadata: SnapshotMetadata;
  files: SnapshotFile[];
};

export type SnapshotMetadata = {
  sourceCwd: string;
  sourceClaudeProjectDir: string;
  projectName: string;
  gitRemoteOrigin?: string;
  normalizedGitRemoteOrigin?: string;
  gitBranch?: string;
};

export async function createSnapshot(projectSessionDir: string, metadata: SnapshotMetadata): Promise<Buffer> {
  if (!existsSync(projectSessionDir)) {
    throw new FriendlyError("No Claude sessions found for this project.", `Check: ${projectSessionDir}`);
  }

  const files = await collectFiles(projectSessionDir, projectSessionDir);
  if (files.length === 0) {
    throw new FriendlyError("No Claude session files found.", "Open Claude Code once, then rerun send.");
  }

  const snapshot: Snapshot = {
    v: 2,
    createdAt: new Date().toISOString(),
    sourceDir: projectSessionDir,
    metadata,
    files,
  };

  return gzipAsync(Buffer.from(JSON.stringify(snapshot), "utf8"));
}

export async function readSnapshot(bytes: Buffer): Promise<Snapshot> {
  const raw = await gunzipAsync(bytes);
  return JSON.parse(raw.toString("utf8")) as Snapshot;
}

export async function mergeSnapshot(snapshot: Snapshot, targetDir: string): Promise<{ added: number; renamed: number; skipped: number }> {
  let added = 0;
  let renamed = 0;
  let skipped = 0;
  const stagedFiles: Array<{ stagedPath: string; destinationPath: string }> = [];

  await mkdir(targetDir, { recursive: true });
  const stagingRoot = await mkdtemp(path.join(os.tmpdir(), "sync-ai-sessions-"));

  try {
    for (const file of snapshot.files) {
      const safeRelative = sanitizeRelativePath(file.path);
      if (!safeRelative) {
        skipped += 1;
        continue;
      }

      let destination = path.join(targetDir, safeRelative);
      if (existsSync(destination)) {
        destination = withImportedSuffix(destination, file.content);
        renamed += 1;
      } else {
        added += 1;
      }

      const staged = path.join(stagingRoot, safeRelative);
      await mkdir(path.dirname(staged), { recursive: true });
      await writeFile(staged, Buffer.from(file.content, "base64"));
      stagedFiles.push({ stagedPath: staged, destinationPath: destination });
    }

    for (const stagedFile of stagedFiles) {
      await mkdir(path.dirname(stagedFile.destinationPath), { recursive: true });
      if (existsSync(stagedFile.destinationPath)) {
        throw new FriendlyError("Import destination changed during receive.", "Close Claude Code and rerun receive.");
      }
    }

    for (const stagedFile of stagedFiles) {
      await copyFile(stagedFile.stagedPath, stagedFile.destinationPath);
    }
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }

  return { added, renamed, skipped };
}

async function collectFiles(root: string, current: string): Promise<SnapshotFile[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: SnapshotFile[] = [];

  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, fullPath)));
    } else if (entry.isFile()) {
      const info = await stat(fullPath);
      const content = await readFile(fullPath);
      files.push({
        path: path.relative(root, fullPath).split(path.sep).join("/"),
        content: content.toString("base64"),
        mtimeMs: info.mtimeMs,
      });
    }
  }

  return files;
}

function sanitizeRelativePath(relativePath: string): string | undefined {
  const normalized = path.normalize(relativePath);
  if (path.isAbsolute(normalized) || normalized.startsWith("..")) return undefined;
  return normalized;
}

function withImportedSuffix(filePath: string, content: string): string {
  const parsed = path.parse(filePath);
  const shortHash = createHash("sha256").update(content).digest("hex").slice(0, 8);
  const base = path.join(parsed.dir, `${parsed.name}-imported-${shortHash}${parsed.ext}`);
  if (!existsSync(base)) return base;

  let counter = 2;
  while (existsSync(path.join(parsed.dir, `${parsed.name}-imported-${shortHash}-${counter}${parsed.ext}`))) {
    counter += 1;
  }

  return path.join(parsed.dir, `${parsed.name}-imported-${shortHash}-${counter}${parsed.ext}`);
}
