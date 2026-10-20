import { createStreamingHandler } from "@/lib/ai/stream-route";
import { getTask, taskEvents, taskNotes } from "@/lib/db/tasks";
import { formatJourney, prPrompt } from "@/lib/server/prompts";
import { prRequest } from "@/lib/server/schemas";

export const maxDuration = 60;

/**
 * A pull-request description from a spoken summary of the change. When a task is picked, its
 * journey (what was blocked, how it was fixed) gives the model the "why".
 */
export const POST = createStreamingHandler(prRequest, "pr", async ({ changes, taskId, ticket }, { user }) => {
  let journey: string | null = null;
  if (taskId) {
    const [task, events, notes] = await Promise.all([
      getTask(user.id, taskId),
      taskEvents(user.id, taskId),
      taskNotes(user.id, taskId),
    ]);
    if (task) journey = formatJourney(task, events.slice(-30), notes);
  }
  return prPrompt(changes, journey, ticket);
});
