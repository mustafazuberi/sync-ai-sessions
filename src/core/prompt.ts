import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { FriendlyError } from "./errors.js";

export async function askPassphrase(label = "Passphrase"): Promise<string> {
  if (process.stdin.isTTY) {
    const value = await askHidden(label);
    if (!value) throw new FriendlyError("A passphrase is required.", "Rerun the command and enter a passphrase.");
    return value;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const value = await rl.question(`${label}: `);
    if (!value) throw new FriendlyError("A passphrase is required.", "Rerun the command and enter a passphrase.");
    return value;
  } finally {
    rl.close();
  }
}

export async function askConfirmedPassphrase(): Promise<string> {
  const first = await askPassphrase("Create passphrase");
  const second = await askPassphrase("Confirm passphrase");
  if (first !== second) throw new FriendlyError("The passphrases did not match.", "Rerun: npx sync-ai-sessions@latest install");
  return first;
}

function askHidden(label: string): Promise<string> {
  return new Promise((resolve) => {
    let value = "";
    process.stdout.write(`${label}: `);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onData = (char: string) => {
      if (char === "\r" || char === "\n") {
        cleanup();
        process.stdout.write("\n");
        resolve(value);
        return;
      }

      if (char === "\u0003") {
        cleanup();
        process.stdout.write("\n");
        process.exit(130);
      }

      if (char === "\u007f" || char === "\b") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }

      value += char;
      process.stdout.write("•");
    };

    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    process.stdin.on("data", onData);
  });
}
