import { getFlag, type CliArgs } from "./args.js";
import { FriendlyError } from "./errors.js";

export type SupportedTool = "claude";

export function resolveTool(args: CliArgs): SupportedTool {
  const tool = (getFlag(args, "tool") ?? "claude").toLowerCase();

  if (tool === "claude") return "claude";
  if (tool === "codex") {
    throw new FriendlyError(
      "Codex CLI sessions are not supported yet.",
      "Use --tool claude for now. Codex support is planned for a future Sync AI Sessions release.",
    );
  }

  throw new FriendlyError("Unsupported tool.", "Use --tool claude. Codex support is planned for a future release.");
}

export function toolDisplayName(tool: SupportedTool): string {
  if (tool === "claude") return "Claude Code";
  return tool;
}
