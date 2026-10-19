import { generateText, Output } from "ai";
import { z } from "zod";
import { NO_STORE, userRoute } from "@/lib/api/route";
import { aiErrorResponse } from "@/lib/ai/guard";
import { getModel } from "@/lib/ai/provider";
import { aiCallSettings } from "@/lib/ai/settings";
import { getEntry, updateEntryData } from "@/lib/db/repo";
import { jsonError } from "@/lib/security/http";
import { refinePrompt } from "@/lib/server/prompts";
import { entryDataSchema, refineEntryRequest } from "@/lib/server/schemas";

export const maxDuration = 30;

/** Applies answers to ShipLog's follow-up questions to a saved entry (AI merges them in). */
export const POST = userRoute(
  { body: refineEntryRequest, rateLimit: true },
  async ({ request, user, body }, ctx: RouteContext<"/api/entries/[id]/refine">) => {
    const { id } = await ctx.params;
    if (!z.uuid().safeParse(id).success) return jsonError(400, "Invalid entry id.");
    const entry = await getEntry(user.id, id);
    if (!entry) return jsonError(404, "Entry not found.");

    try {
      const { output } = await generateText({
        model: getModel().model,
        ...refinePrompt(entry.data, body.answers),
        output: Output.object({ schema: entryDataSchema }),
        ...aiCallSettings(request, "structure"),
      });
      const updated = await updateEntryData(user.id, id, output);
      return updated ? Response.json({ entry: updated }, { headers: NO_STORE }) : jsonError(404, "Entry not found.");
    } catch (error) {
      return aiErrorResponse(error);
    }
  },
);
