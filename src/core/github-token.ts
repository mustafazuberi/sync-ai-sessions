import { execFileSync } from "node:child_process";
import { FriendlyError } from "./errors.js";

export function resolveGitHubToken(): string {
  try {
    const token = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!token) throw new Error("empty token");
    return token;
  } catch {
    throw new FriendlyError("GitHub CLI is not authenticated.", "Run: gh auth login, then gh auth refresh -s gist.");
  }
}
