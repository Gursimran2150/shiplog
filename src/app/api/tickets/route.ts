import { generateText, Output } from "ai";
import { NO_STORE, userRoute } from "@/lib/api/route";
import { aiErrorResponse } from "@/lib/ai/guard";
import { getModel } from "@/lib/ai/provider";
import { aiCallSettings } from "@/lib/ai/settings";
import { ticketPrompt } from "@/lib/server/prompts";
import { ticketRequest, ticketSchema } from "@/lib/server/schemas";

export const maxDuration = 30;

/** Turns a blocker or to-do into a GitHub issue draft, plus a prefilled "new issue" link when a repo is given. */
export const POST = userRoute({ body: ticketRequest, rateLimit: true }, async ({ request, body }) => {
  try {
    const { output: ticket } = await generateText({
      model: getModel().model,
      ...ticketPrompt(body.text, body.context),
      output: Output.object({ schema: ticketSchema }),
      ...aiCallSettings(request, "ticket"),
    });
    const issueUrl = body.repo
      ? `https://github.com/${body.repo}/issues/new?${new URLSearchParams({
          title: ticket.title,
          body: ticket.body,
          labels: ticket.labels.join(","),
        })}`
      : null;
    return Response.json({ ticket, issueUrl }, { headers: NO_STORE });
  } catch (error) {
    return aiErrorResponse(error);
  }
});
