import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { insertTasks, openTasks } from "@/lib/db/tasks";
import { SECTIONS, TASK_STATUS_LABELS, type EntryData, type LogItem, type TaskSummary } from "@/lib/domain/types";
import type { aiEntrySchema } from "./schemas";

type AiEntry = z.infer<typeof aiEntrySchema>;

/** Open tasks as the model sees them: short aliases (t1, t2…) instead of uuids, mapped back afterwards. */
interface TaskAliases {
  /** Prompt text listing the open tasks, or "" when there are none. */
  text: string;
  aliases: Map<string, string>;
}

export function aliasTasks(tasks: readonly TaskSummary[]): TaskAliases {
  const aliases = new Map<string, string>();
  const lines = tasks.map((t, i) => {
    const alias = `t${i + 1}`;
    aliases.set(alias, t.id);
    return `${alias}: ${t.title}${t.project ? ` [${t.project}]` : ""} (${TASK_STATUS_LABELS[t.status].toLowerCase()}, last ${t.lastDate ?? "never"})`;
  });
  return { text: lines.join("\n"), aliases };
}

/** The user's open tasks, aliased for a prompt. */
export async function openTaskAliases(userId: string, today: string): Promise<TaskAliases> {
  return aliasTasks(await openTasks(userId, today));
}

/** Same work said twice in one log ("working on X", "tomorrow: finish X") should become one task. */
const sameWork = (text: string) =>
  text
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** A task name from "new: <name>", else the item text without progress notes like "(80% done)". */
function newTaskTitle(ref: string, text: string): string {
  const named = ref.replace(/^new\s*:?\s*/i, "").trim();
  const title = named || text.replace(/\s*\([^)]*\)\s*/g, " ").trim() || text;
  return title.slice(0, 160);
}

/**
 * Turns the model's task references into stored task ids: a known alias links to that task,
 * "new: <name>" (or an alias the model made up) creates a task, null leaves the item unlinked.
 * Items naming the same new task share it. Pure apart from id generation; the caller saves
 * `created` before the entry.
 */
export function resolveTaskRefs(
  ai: AiEntry,
  aliases: ReadonlyMap<string, string>,
  newId: () => string = randomUUID,
): { data: EntryData; created: { id: string; title: string; project: string | null }[] } {
  const created: { id: string; title: string; project: string | null }[] = [];
  const createdByWork = new Map<string, string>();

  const link = ({ text, project, task }: AiEntry["done"][number]): LogItem => {
    if (task === null) return { text, project };
    const known = aliases.get(task.trim().toLowerCase());
    if (known) return { text, project, taskId: known };
    const title = newTaskTitle(/^new\b/i.test(task.trim()) ? task.trim() : "", text);
    const key = sameWork(title);
    let id = createdByWork.get(key);
    if (!id) {
      id = newId();
      createdByWork.set(key, id);
      created.push({ id, title, project });
    }
    return { text, project, taskId: id };
  };

  const data = { summary: ai.summary } as EntryData;
  for (const section of SECTIONS) data[section] = ai[section].map(link);
  return { data, created };
}

/** Resolves references and creates any new tasks; returns the entry data ready to save. */
export async function linkTasks(userId: string, ai: AiEntry, aliases: ReadonlyMap<string, string>): Promise<EntryData> {
  const { data, created } = resolveTaskRefs(ai, aliases);
  await insertTasks(userId, created);
  return data;
}

/** Adds aliases for tasks an entry already links to (they may be done, so not in the open list). */
export function withEntryTasks(aliases: ReadonlyMap<string, string>, data: EntryData): Map<string, string> {
  const out = new Map(aliases);
  const known = new Set(aliases.values());
  for (const section of SECTIONS) {
    for (const { taskId } of data[section]) {
      if (taskId && !known.has(taskId)) {
        known.add(taskId);
        out.set(`t${out.size + 1}`, taskId);
      }
    }
  }
  return out;
}

/** An existing entry rendered with aliases, so a model rewriting it can keep each item's task. */
export function entryWithAliases(data: EntryData, aliases: ReadonlyMap<string, string>): AiEntry {
  const byId = new Map([...aliases].map(([alias, id]) => [id, alias]));
  const out = { summary: data.summary } as AiEntry;
  for (const section of SECTIONS) {
    out[section] = data[section].map((i) => ({
      text: i.text,
      project: i.project,
      task: i.taskId ? (byId.get(i.taskId) ?? null) : null,
    }));
  }
  return out;
}
