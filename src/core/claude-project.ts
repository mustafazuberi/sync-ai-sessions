import path from "node:path";

export function projectDirForCwd(projectsRoot: string, cwd: string): string {
  return path.join(projectsRoot, encodeClaudeProjectPath(path.resolve(cwd)));
}

export function archiveProjectDir(projectsRoot: string, homeDir: string, handoffId: string): string {
  return projectDirForCwd(projectsRoot, path.join(homeDir, "archive", handoffId));
}

export function encodeClaudeProjectPath(cwd: string): string {
  return encodeURIComponent(cwd)
    .replace(/%2F/gi, "-")
    .replace(/%5C/gi, "-")
    .replace(/%3A/gi, "-");
}
