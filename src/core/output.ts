import type { CliArgs } from "./args.js";

export type MessageField = {
  label: string;
  value: string | number | undefined;
};

export function printResult(args: CliArgs, human: string, json: unknown): void {
  if (args.flags.json) {
    console.log(JSON.stringify(json, null, 2));
    return;
  }

  console.log(human);
}

export function formatSuccess(title: string, fields: MessageField[], next?: string): string {
  const lines = [title, ""];

  for (const field of fields) {
    if (field.value === undefined || field.value === "") continue;
    lines.push(`${field.label}: ${field.value}`);
  }

  if (next) {
    lines.push("", "Next:", next);
  }

  return lines.join("\n");
}

export function formatNotice(title: string, body: string[], next?: string): string {
  return [title, "", ...body, ...(next ? ["", "Next:", next] : [])].join("\n");
}
