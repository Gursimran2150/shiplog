import { userRoute } from "@/lib/api/route";
import { streamAnswer } from "@/lib/ai/stream-route";
import { getTask, taskEvents, taskNotes } from "@/lib/db/tasks";
import { blockedSince, parseWaitingOn } from "@/lib/domain/waiting";
import { jsonError } from "@/lib/security/http";
import { formatJourney, nudgePrompt } from "@/lib/server/prompts";
import { nudgeRequest } from "@/lib/server/schemas";

export const maxDuration = 30;

/** Drafts a short follow-up message to whoever a blocked task is waiting on (streamed, not sent). */
export const POST = userRoute({ body: nudgeRequest, rateLimit: true }, async ({ request, user, body }) => {
  const [task, events, notes] = await Promise.all([
    getTask(user.id, body.taskId),
    taskEvents(user.id, body.taskId),
    taskNotes(user.id, body.taskId),
  ]);
  if (!task) return jsonError(404, "Task not found.");
  const blocker = events.findLast((e) => e.section === "blockers");
  if (!blocker) return jsonError(400, "This task has no blocker to follow up on.");

  const since = blockedSince(events) ?? blocker.date;
  const journey = formatJourney(task, events.slice(-20), notes);
  return streamAnswer(
    request,
    "nudge",
    nudgePrompt(journey, blocker.text, parseWaitingOn(blocker.text), since, body.today, body.tone),
  );
});
