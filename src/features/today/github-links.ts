import type { Ticket } from "@/lib/domain/types";

const GITHUB_ORIGIN = "https://github.com";
/** Same shape the server accepts for `repo` (owner/repo), minus dot-only segments like "..". */
const REPO_PATTERN = /^(?!\.+\/)[\w.-]+\/(?!\.+$)[\w.-]+$/;

export function isValidRepo(repo: string): boolean {
  return REPO_PATTERN.test(repo.trim());
}

/** Returns `url` only if it is an https://github.com link; anything else (javascript:, other hosts) → null. */
export function safeGithubUrl(url: string): string | null {
  try {
    return new URL(url).origin === GITHUB_ORIGIN ? url : null;
  } catch {
    return null;
  }
}

/** A prefilled "new issue" link for `repo`, or null when the repo is not a valid owner/repo. */
export function buildIssueUrl(repo: string, ticket: Ticket): string | null {
  const name = repo.trim();
  if (!isValidRepo(name)) return null;
  const params = new URLSearchParams({ title: ticket.title, body: ticket.body });
  if (ticket.labels.length) params.set("labels", ticket.labels.join(","));
  return safeGithubUrl(`${GITHUB_ORIGIN}/${name}/issues/new?${params}`);
}

/** Plain-text version of a ticket for the clipboard. */
export function ticketToText(ticket: Ticket): string {
  const labels = ticket.labels.length ? `\n\nLabels: ${ticket.labels.join(", ")}` : "";
  return `${ticket.title}\n\n${ticket.body}${labels}`;
}
