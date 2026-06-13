import os from "node:os";
import { encryptBytes } from "../core/crypto.js";
import { readConfig, writeConfig } from "../core/config.js";
import { resolveGitHubToken } from "../core/github-token.js";
import { resolvePaths } from "../core/paths.js";
import { askConfirmedPassphrase } from "../core/prompt.js";
import { formatSuccess, printResult } from "../core/output.js";
import type { CliArgs } from "../core/args.js";
import { resolveTool, toolDisplayName } from "../core/tools.js";

export async function installCommand(args: CliArgs): Promise<void> {
  const tool = await resolveTool(args);
  const paths = await resolvePaths(args);
  resolveGitHubToken();
  const passphrase = await askConfirmedPassphrase();
  const config = await readConfig(paths.configPath);
  const verifier = await encryptBytes(Buffer.from("sync-ai-sessions", "utf8"), passphrase, {
    createdAt: Date.now(),
  });

  await writeConfig(paths.configPath, {
    ...config,
    installedAt: new Date().toISOString(),
    sessionDir: paths.sessionDir,
    sessionReason: paths.sessionReason,
    passphraseVerifier: verifier,
  });

  printResult(
    args,
    formatSuccess(
      "Sync AI Sessions installed",
      [
        { label: "Tool", value: toolDisplayName(tool) },
        { label: "GitHub", value: "connected" },
        { label: "Sessions", value: paths.sessionDir },
        { label: "Config", value: paths.configPath },
      ],
      "npx sync-ai-sessions@latest send",
    ),
    {
      ok: true,
      command: "install",
      tool,
      host: os.hostname(),
      sessionDir: paths.sessionDir,
      configPath: paths.configPath,
    },
  );
}
