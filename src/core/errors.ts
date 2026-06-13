export class FriendlyError extends Error {
  constructor(
    message: string,
    readonly fix?: string,
  ) {
    super(message);
  }
}

export function formatError(error: unknown): string {
  const debug = process.argv.includes("--debug");
  if (error instanceof FriendlyError) {
    const lines = ["Sync AI Sessions could not continue", "", `Reason: ${error.message}`];
    if (error.fix) lines.push(`Next: ${error.fix}`);
    return lines.join("\n");
  }

  if (debug && error instanceof Error) {
    return error.stack ?? error.message;
  }

  return "Sync AI Sessions could not continue\n\nReason: Something went wrong.\nNext: rerun with --debug";
}
