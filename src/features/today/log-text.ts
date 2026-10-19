import type { EntryData } from "@/lib/domain/types";

/** Whitespace-separated word count (same rule the server uses for `Entry.words`). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Returns a copy of `data` with `text` appended to Done (no-op if it is already there). */
export function appendToDone(data: EntryData, text: string, project: string | null = null): EntryData {
  if (data.done.some((item) => item.text === text)) return data;
  return { ...data, done: [...data.done, { text, project }] };
}

/** "owner/repo" from a GitHub URL, used as the project badge for missed commits. */
export function repoFromUrl(url: string): string | null {
  const match = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/.exec(url);
  return match ? match[1] : null;
}
