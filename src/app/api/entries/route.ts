import { generateText, Output } from "ai";
import { NO_STORE, userRoute } from "@/lib/api/route";
import { aiErrorResponse } from "@/lib/ai/guard";
import { wrapUserInput } from "@/lib/ai/prompts";
import { getModel } from "@/lib/ai/provider";
import { aiCallSettings } from "@/lib/ai/settings";
import { createEntry, listEntries } from "@/lib/db/repo";
import { userActivity } from "@/lib/server/activity";
import { formatActivity } from "@/lib/server/github";
import { structurePrompt } from "@/lib/server/prompts";
import { createEntryRequest, rangeQuery, structuredLogSchema } from "@/lib/server/schemas";

export const maxDuration = 30;

export const GET = userRoute({ query: rangeQuery }, async ({ user, query }) =>
  Response.json({ entries: await listEntries(user.id, query.from, query.to) }, { headers: NO_STORE }),
);

/** Structures a spoken log with AI (cross-checked against today's GitHub activity) and saves it. */
export const POST = userRoute({ body: createEntryRequest, rateLimit: true }, async ({ request, body, user }) => {
  const { activity } = await userActivity(user.id, body.date, body.date, body.timeZone);

  let structured;
  try {
    ({ output: structured } = await generateText({
      model: getModel().model,
      system: structurePrompt(body.date, formatActivity(activity)),
      prompt: wrapUserInput(body.text),
      output: Output.object({ schema: structuredLogSchema }),
      ...aiCallSettings(request, "structure"),
    }));
  } catch (error) {
    return aiErrorResponse(error);
  }

  const { missed, ...data } = structured;
  // Only keep "missed" links that really are in today's activity (no invented URLs).
  const known = new Set(activity.map((a) => a.url));
  const entry = await createEntry(user.id, {
    date: body.date,
    raw: body.text,
    data,
    words: body.text.split(/\s+/).filter(Boolean).length,
  });
  return Response.json(
    { entry, missed: missed.filter((m) => known.has(m.url)), activityCount: activity.length },
    { status: 201, headers: NO_STORE },
  );
});
