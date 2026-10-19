import type { EntryData, Section } from "@/lib/domain/types";

/**
 * Immutable edits to a structured entry. Each returns the same `data` object when nothing would
 * change (blank text, unchanged text, out-of-range index), so callers can skip a pointless save.
 */

/** Replaces the text of one item, keeping its project. Blank text is ignored (use `removeItem`). */
export function updateItem(data: EntryData, section: Section, index: number, text: string): EntryData {
  const next = text.trim();
  const current = data[section][index];
  if (!current || !next || current.text === next) return data;
  return { ...data, [section]: data[section].map((item, i) => (i === index ? { ...item, text: next } : item)) };
}

/** Drops one item. */
export function removeItem(data: EntryData, section: Section, index: number): EntryData {
  if (index < 0 || index >= data[section].length) return data;
  return { ...data, [section]: data[section].filter((_, i) => i !== index) };
}

/** Appends a new item (no project) to a section. Blank text is ignored. */
export function addItem(data: EntryData, section: Section, text: string): EntryData {
  const next = text.trim();
  if (!next) return data;
  return { ...data, [section]: [...data[section], { text: next, project: null }] };
}

/** Total number of items across the four sections. */
export function itemCount(data: EntryData): number {
  return data.done.length + data.inProgress.length + data.blockers.length + data.tomorrow.length;
}
