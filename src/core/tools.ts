import { getFlag, type CliArgs } from "./args.js";
import { FriendlyError } from "./errors.js";

export type SupportedTool = "claude";

export async function resolveTool(args: CliArgs): Promise<SupportedTool> {
  const explicitTool = getFlag(args, "tool");
  const tool = explicitTool ? explicitTool.toLowerCase() : await showToolAvailability();

  if (tool === "claude") return "claude";
  if (tool === "codex") {
    throw new FriendlyError(
      "Codex CLI sessions are not supported yet.",
      "Use --tool claude for now. Codex support is planned for a future Sync AI Sessions release.",
    );
  }

  throw new FriendlyError("This session source is not supported.", "Use --tool claude. Codex support is planned for a future release.");
}

export function toolDisplayName(tool: SupportedTool): string {
  if (tool === "claude") return "Claude Code";
  return tool;
}

const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blueBg: "\x1b[44m\x1b[37m",
};

async function showToolAvailability(): Promise<SupportedTool> {
  if (!process.stdin.isTTY) return "claude";

  process.stdout.write(`${ansi.bold}${ansi.cyan}Sync AI Sessions${ansi.reset}\n`);
  process.stdout.write(`${ansi.dim}Session source${ansi.reset}\n\n`);
  process.stdout.write(`${ansi.blueBg}  Claude Code   Supported         ${ansi.reset}\n`);
  process.stdout.write(`${ansi.dim}  Codex CLI     Not supported yet ${ansi.reset}\n\n`);
  process.stdout.write(`${ansi.green}Using Claude Code for this handoff.${ansi.reset}\n`);
  process.stdout.write(`${ansi.dim}Tip: use --tool claude to skip this screen in scripts.${ansi.reset}\n\n`);

  return "claude";
}
