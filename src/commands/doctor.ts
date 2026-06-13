import { existsSync } from "node:fs";
import { type CliArgs } from "../core/args.js";
import { readConfig } from "../core/config.js";
import { resolveGitHubToken } from "../core/github-token.js";
import { resolvePaths } from "../core/paths.js";
import { formatSuccess, printResult } from "../core/output.js";
import { resolveTool, toolDisplayName } from "../core/tools.js";

export async function doctorCommand(args: CliArgs): Promise<void> {
  const tool = await resolveTool(args);
  const paths = await resolvePaths(args);
  const config = await readConfig(paths.configPath);
  const auth = checkAuth();
  const sessionExists = existsSync(paths.sessionDir);

  printResult(
    args,
    formatSuccess("Doctor report", [
      { label: "Tool", value: toolDisplayName(tool) },
      { label: "GitHub", value: auth ? "connected" : "needs gh auth login" },
      { label: "Sessions", value: sessionExists ? "found" : "not found" },
      { label: "Path", value: paths.sessionDir },
      { label: "Reason", value: paths.sessionReason },
      { label: "Config", value: existsSync(paths.configPath) ? "found" : "run install" },
      { label: "Installed", value: config.installedAt ?? "not installed" },
    ]),
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
