import { installCommand } from "./commands/install.js";
import { sendCommand } from "./commands/send.js";
import { receiveCommand } from "./commands/receive.js";
import { doctorCommand } from "./commands/doctor.js";
import { FriendlyError, formatError } from "./core/errors.js";
import { parseArgs } from "./core/args.js";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args.command;

  if (!command || args.flags.help) {
    printHelp();
    return;
  }

  if (command === "install") return installCommand(args);
  if (command === "send" || command === "push") return sendCommand(args);
  if (command === "receive" || command === "pull") return receiveCommand(args);
  if (command === "doctor") return doctorCommand(args);

  throw new FriendlyError(`Unknown command: ${command}`, "Run: npx sync-ai-sessions@latest --help");
}

function printHelp() {
  console.log(`Sync AI Sessions\n\nUsage:\n  sync-ai-sessions install [--tool claude]\n  sync-ai-sessions send [--tool claude] [--copy]\n  sync-ai-sessions receive --gist <gistId> [--tool claude]\n  sync-ai-sessions doctor [--tool claude]\n\nAlias:\n  aisessions send\n\nTools:\n  claude    Supported\n  codex     Not supported yet\n\nOptions:\n  --cwd <path>    Resolve paths from another folder\n  --json          Print machine-readable output\n  --debug         Show technical errors`);
}

main().catch((error: unknown) => {
  console.error(formatError(error));
  process.exit(error instanceof FriendlyError ? 1 : 2);
});
