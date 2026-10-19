import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { getEnv } from "@/lib/env";
import { resolveProvider, type ProviderName } from "./resolve-provider";

interface ResolvedModel {
  provider: ProviderName;
  modelId: string;
  model: LanguageModel;
}

let resolved: ResolvedModel | undefined;

/**
 * Returns the configured language model. Prefers AI_PROVIDER, and falls back to whichever
 * provider has a key so the app keeps working if one is missing. Built once per instance.
 */
export function getModel(): ResolvedModel {
  if (resolved) return resolved;
  const env = getEnv();
  const provider = resolveProvider({
    preferred: env.AI_PROVIDER,
    hasGemini: Boolean(env.GEMINI_API_KEY),
    hasOpenAI: Boolean(env.OPENAI_API_KEY),
  });

  if (provider === "gemini") {
    const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
    resolved = { provider, modelId: env.GEMINI_MODEL, model: google(env.GEMINI_MODEL) };
  } else {
    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
    resolved = { provider, modelId: env.OPENAI_MODEL, model: openai(env.OPENAI_MODEL) };
  }
  return resolved;
}
