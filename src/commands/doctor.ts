import { existsSync } from "node:fs";
import { type CliArgs } from "../core/args.js";
import { readConfig } from "../core/config.js";
import { resolveGitHubToken } from "../core/github-token.js";
import { resolvePaths } from "../core/paths.js";
import { printResult } from "../core/output.js";
import { resolveTool, toolDisplayName } from "../core/tools.js";

export async function doctorCommand(args: CliArgs): Promise<void> {
  const tool = resolveTool(args);
  const paths = await resolvePaths(args);
  const config = await readConfig(paths.configPath);
  const auth = checkAuth();
  const sessionExists = existsSync(paths.sessionDir);

  printResult(
    args,
    [
      "Sync AI Sessions doctor",
      `Tool: ${toolDisplayName(tool)}`,
      `GitHub: ${auth ? "OK" : "WARN - run gh auth login"}`,
      `Sessions: ${sessionExists ? "OK" : "WARN - not found"}`,
      `Path: ${paths.sessionDir}`,
      `Reason: ${paths.sessionReason}`,
      `Config: ${existsSync(paths.configPath) ? "OK" : "WARN - run install"}`,
      `Installed: ${config.installedAt ?? "not installed"}`,
    ].join("\n"),
    {
      ok: auth && sessionExists,
      command: "doctor",
      tool,
      github: auth,
      sessionExists,
      sessionDir: paths.sessionDir,
      sessionReason: paths.sessionReason,
      configPath: paths.configPath,
      installedAt: config.installedAt,
    },
  );
}

function checkAuth(): boolean {
  try {
    resolveGitHubToken();
    return true;
  } catch {
    return false;
  }
}
