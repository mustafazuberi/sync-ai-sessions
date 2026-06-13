import { FriendlyError } from "./errors.js";

const apiBase = "https://api.github.com";
const fileName = "claude-sessions.enc";

export type CreatedGist = {
  id: string;
  url: string;
};

export async function createHandoffGist(token: string, content: string, description: string): Promise<CreatedGist> {
  const response = await fetch(`${apiBase}/gists`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      description,
      public: false,
      files: {
        [fileName]: { content },
      },
    }),
  });

  if (!response.ok) {
    throw new FriendlyError("GitHub could not create the private Gist.", "Run: gh auth refresh -s gist, then retry.");
  }

  const gist = (await response.json()) as { id: string; html_url: string };
  return { id: gist.id, url: gist.html_url };
}

export async function getHandoffPayload(token: string, gistId: string): Promise<string> {
  const response = await fetch(`${apiBase}/gists/${gistId}`, {
    headers: headers(token),
  });

  if (!response.ok) {
    throw new FriendlyError(
      `This Gist could not be opened: ${gistId}.`,
      "Check the Gist ID, GitHub account, or run: gh auth refresh -s gist.",
    );
  }

  const gist = (await response.json()) as { files?: Record<string, { content?: string; raw_url?: string }> };
  const file = gist.files?.[fileName];
  if (!file) {
    throw new FriendlyError("This Gist is not a Sync AI Sessions handoff.", "Use a Gist created by sync-ai-sessions send.");
  }

  if (file.content) return file.content;
  if (file.raw_url) {
    const raw = await fetch(file.raw_url, { headers: headers(token) });
    if (raw.ok) return raw.text();
  }

  throw new FriendlyError("The encrypted handoff file could not be downloaded.", "Rerun receive with --debug for details.");
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sync-ai-sessions",
  };
}
