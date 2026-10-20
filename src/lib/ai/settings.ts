import "server-only";

/** Upper bound for one AI request, so a stalled provider call fails cleanly instead of hanging the UI. */
const AI_TIMEOUT_MS = 45_000;

export type AiTask = "structure" | "ticket" | "standup" | "weekly" | "brag" | "ask" | "nudge" | "pr" | "postmortem";

type Effort = "minimal" | "low";

/**
 * Per-task budgets. Output caps stop runaway generations (time and cost), and a low
 * reasoning effort keeps latency down for tasks that are grounded or mostly formatting.
 * Caps are generous enough that a normal answer is never cut off.
 */
const TASKS: Record<AiTask, { maxOutputTokens: number; effort: Effort }> = {
  structure: { maxOutputTokens: 2048, effort: "minimal" },
  ticket: { maxOutputTokens: 1024, effort: "minimal" },
  standup: { maxOutputTokens: 1024, effort: "low" },
  weekly: { maxOutputTokens: 2048, effort: "low" },
  brag: { maxOutputTokens: 3072, effort: "low" },
  ask: { maxOutputTokens: 1536, effort: "low" },
  nudge: { maxOutputTokens: 512, effort: "minimal" },
  pr: { maxOutputTokens: 1536, effort: "low" },
  postmortem: { maxOutputTokens: 2048, effort: "low" },
};

/** Aborts when the client disconnects or the time budget runs out, whichever comes first. */
function abortSignalFor(request: Request): AbortSignal {
  return AbortSignal.any([request.signal, AbortSignal.timeout(AI_TIMEOUT_MS)]);
}

/** Shared call settings for generateText/streamText. Each provider ignores the other's options. */
export function aiCallSettings(request: Request, task: AiTask) {
  const { maxOutputTokens, effort } = TASKS[task];
  return {
    maxOutputTokens,
    maxRetries: 2,
    abortSignal: abortSignalFor(request),
    providerOptions: {
      google: { thinkingConfig: { thinkingLevel: effort } },
      openai: { reasoningEffort: effort },
    },
  };
}
