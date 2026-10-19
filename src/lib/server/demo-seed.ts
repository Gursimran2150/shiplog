import "server-only";
import { insertEntries } from "@/lib/db/repo";
import { insertNotes, insertTasks } from "@/lib/db/tasks";
import { localDate } from "@/lib/domain/dates";
import { demoSeed } from "./demo-data";

/** Fills a demo account with the sample journal (tasks first: logs and notes point at them). */
export async function seedDemoJournal(userId: string): Promise<void> {
  const { tasks, entries, notes } = demoSeed(localDate(new Date(), "Asia/Kolkata"));
  await insertTasks(userId, tasks);
  await Promise.all([insertEntries(userId, entries), insertNotes(userId, notes)]);
}
