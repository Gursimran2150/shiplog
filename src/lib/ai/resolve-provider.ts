export type ProviderName = "gemini" | "openai";

export class MissingApiKeyError extends Error {
  constructor() {
    super("No AI provider key configured. Set GEMINI_API_KEY or OPENAI_API_KEY.");
    this.name = "MissingApiKeyError";
  }
}

interface ResolveInput {
  preferred: ProviderName;
  hasGemini: boolean;
  hasOpenAI: boolean;
}

/** Pure provider selection: preferred if its key exists, else the other one. */
export function resolveProvider({ preferred, hasGemini, hasOpenAI }: ResolveInput): ProviderName {
  const available: Record<ProviderName, boolean> = { gemini: hasGemini, openai: hasOpenAI };
  if (available[preferred]) return preferred;
  const fallback: ProviderName = preferred === "gemini" ? "openai" : "gemini";
  if (available[fallback]) return fallback;
  throw new MissingApiKeyError();
}
