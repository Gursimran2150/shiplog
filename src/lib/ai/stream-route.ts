import "server-only";
import { streamText, type ModelMessage } from "ai";
import type { z } from "zod";
import { userRoute } from "@/lib/api/route";
import type { SessionUser } from "@/lib/auth/token";
import { aiErrorResponse } from "./guard";
import { getModel } from "./provider";
import { aiCallSettings, type AiTask } from "./settings";

export type StreamPrompt = { system: string } & ({ prompt: string } | { messages: ModelMessage[] });

const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } as const;

/** A finished answer served from cache, with the same content type as a streamed one. */
export function cachedText(text: string): Response {
  return new Response(text, { headers: { ...TEXT_HEADERS, "X-Cache": "HIT" } });
}

/**
 * Streams the model's answer as plain text. `onComplete` runs only for a full, successful
 * answer (finish reason "stop"), which is when it is safe to cache it.
 */
export function streamAnswer(
  request: Request,
  task: AiTask,
  prompt: StreamPrompt,
  onComplete?: (text: string) => Promise<void>,
): Response {
  try {
    const result = streamText({
      model: getModel().model,
      ...prompt,
      ...aiCallSettings(request, task),
      onError: ({ error }) => console.error(`[ai:${task}]`, error),
      onFinish: async ({ text, finishReason }) => {
        if (!onComplete || finishReason !== "stop" || !text.trim()) return;
        await onComplete(text).catch((error) => console.error(`[ai:${task}:save]`, error));
      },
    });
    return result.toTextStreamResponse({ headers: TEXT_HEADERS });
  } catch (error) {
    return aiErrorResponse(error);
  }
}

/** POST handler: authenticate, rate-limit per user, validate the body, then stream the answer. */
export function createStreamingHandler<T>(
  schema: z.ZodType<T>,
  task: AiTask,
  build: (input: T, ctx: { user: SessionUser }) => StreamPrompt | Promise<StreamPrompt>,
) {
  return userRoute({ body: schema, rateLimit: true }, async ({ request, body, user }) =>
    streamAnswer(request, task, await build(body, { user })),
  );
}
