import { createStreamingHandler } from "@/lib/ai/stream-route";
import { recentEntries, searchEntries } from "@/lib/db/repo";
import { askPrompt } from "@/lib/server/prompts";
import { askRequest } from "@/lib/server/schemas";

export const maxDuration = 60;

/**
 * "Ask your journal": retrieves the most relevant entries with Postgres full-text search
 * (plus the latest few for recency questions) and answers only from them.
 */
export const POST = createStreamingHandler(askRequest, "ask", async ({ question, today }, { user }) => {
  const [matches, recent] = await Promise.all([searchEntries(user.id, question), recentEntries(user.id, 5)]);
  const byId = new Map([...matches, ...recent].map((e) => [e.id, e]));
  const entries = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  return askPrompt(question, entries, today);
});
