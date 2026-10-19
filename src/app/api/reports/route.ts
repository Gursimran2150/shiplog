import { userRoute } from "@/lib/api/route";
import { cacheKey } from "@/lib/ai/cache";
import { cachedText, streamAnswer } from "@/lib/ai/stream-route";
import { findReport, listEntries, saveReport } from "@/lib/db/repo";
import { jsonError } from "@/lib/security/http";
import { reportPrompt } from "@/lib/server/prompts";
import { reportRequest } from "@/lib/server/schemas";

export const maxDuration = 60;

/**
 * Generates a standup, weekly report or brag doc from the entries in [from, to].
 * Reports are stored by a hash of their exact input, so re-opening an unchanged report
 * costs one indexed lookup instead of a model call.
 */
export const POST = userRoute({ body: reportRequest, rateLimit: true }, async ({ request, body, user }) => {
  if (body.from > body.to) return jsonError(400, "Invalid request. from must be on or before to.");
  const entries = await listEntries(user.id, body.from, body.to);
  if (!entries.length) return jsonError(404, "No entries in this period yet. Log your day first.");

  const hash = cacheKey(
    `${body.kind}:${body.format}`,
    entries.map((e) => [e.id, e.data]),
  );
  const cached = await findReport(user.id, body.kind, hash);
  if (cached) return cachedText(cached);

  return streamAnswer(request, body.kind, reportPrompt(body.kind, body.format, entries, body.from, body.to), (text) =>
    saveReport(user.id, body.kind, hash, text),
  );
});
