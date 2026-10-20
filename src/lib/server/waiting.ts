import "server-only";
import { eventsForTasks, listTasks } from "@/lib/db/tasks";
import type { WaitingItem } from "@/lib/domain/types";
import { blockedSince, parseWaitingOn } from "@/lib/domain/waiting";

/** Most open blockers worth showing at once; older ones are almost always stale. */
const LIMIT = 30;

/** The user's open blockers: blocked tasks with their latest blocker, who it waits on and since when. */
export async function waitingItems(userId: string): Promise<WaitingItem[]> {
  const blocked = (await listTasks(userId)).filter((t) => t.status === "blocked").slice(0, LIMIT);
  const events = await eventsForTasks(
    userId,
    blocked.map((t) => t.id),
  );
  return blocked.flatMap((task) => {
    const list = events.get(task.id) ?? [];
    const blocker = list.findLast((e) => e.section === "blockers");
    const since = blockedSince(list);
    if (!blocker || !since) return [];
    return [
      {
        taskId: task.id,
        title: task.title,
        project: task.project,
        blocker: blocker.text,
        person: parseWaitingOn(blocker.text),
        since,
      },
    ];
  });
}
