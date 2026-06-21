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
    throw await gistAccessError(token, gistId, response.status);
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

async function gistAccessError(token: string, gistId: string, status: number): Promise<FriendlyError> {
  const login = await currentGitHubLogin(token);
  const account = login ? `@${login}` : "the current GitHub account";

  if (status === 401) {
    return new FriendlyError("GitHub authentication expired.", "Run: gh auth login, then try receive again.");
  }

  if (status === 403) {
    return new FriendlyError(
      `${account} does not have permission to read Gists.`,
      "Run: gh auth refresh -s gist, then try receive again.",
    );
  }

  if (status === 404) {
    return new FriendlyError(
      `Handoff not found, deleted, or not accessible by ${account}.`,
      "Check the Gist ID, switch to the GitHub account that created it, or create a new handoff.",
    );
  }

  return new FriendlyError(
    `GitHub could not open this Gist: ${gistId}.`,
    "Check the Gist ID and rerun receive with --debug if it continues.",
  );
}

async function currentGitHubLogin(token: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${apiBase}/user`, { headers: headers(token) });
    if (!response.ok) return undefined;
    const user = (await response.json()) as { login?: string };
    return user.login;
  } catch {
    return undefined;
  }
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
