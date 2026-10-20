import { z } from "zod";
import { userRoute } from "@/lib/api/route";
import { streamAnswer } from "@/lib/ai/stream-route";
import { getTask, taskEvents, taskNotes } from "@/lib/db/tasks";
import { jsonError } from "@/lib/security/http";
import { formatJourney, postmortemPrompt } from "@/lib/server/prompts";
import { postmortemRequest } from "@/lib/server/schemas";

export const maxDuration = 60;

/** A blameless postmortem written only from the task's journey and notes (streamed). */
export const POST = userRoute(
  { body: postmortemRequest, rateLimit: true },
  async ({ request, user, body }, ctx: RouteContext<"/api/tasks/[id]/postmortem">) => {
    const { id } = await ctx.params;
    if (!z.uuid().safeParse(id).success) return jsonError(400, "Invalid task id.");
    const [task, events, notes] = await Promise.all([
      getTask(user.id, id),
      taskEvents(user.id, id),
      taskNotes(user.id, id),
    ]);
    if (!task) return jsonError(404, "Task not found.");
    if (!events.length) return jsonError(400, "This task has no logs yet, so there's nothing to write up.");
    return streamAnswer(
      request,
      "postmortem",
      postmortemPrompt(formatJourney(task, events.slice(-60), notes), body.today),
    );
  },
);
