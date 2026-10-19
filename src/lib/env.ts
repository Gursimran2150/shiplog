import "server-only";
import { z } from "zod";

const envSchema = z.object({
  AI_PROVIDER: z.enum(["gemini", "openai"]).default("gemini"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.5-flash"),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4-mini"),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(20),
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  DEMO_GITHUB_USERNAME: z.string().min(1).max(39).optional(),
  // ShipLog GitHub App (optional): enables private-repo activity. See scripts/create-github-app.mjs.
  GITHUB_APP_ID: z.string().regex(/^\d+$/).optional(),
  GITHUB_APP_SLUG: z.string().min(1).optional(),
  GITHUB_APP_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1).optional(),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Blank values (`KEY=` in a .env file) mean "not set", not "set to empty". */
function withoutBlanks(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(Object.entries(env).filter((e): e is [string, string] => Boolean(e[1]?.trim())));
}

/** Validated server-side environment. Throws at first use if misconfigured. */
export function getEnv(): Env {
  cached ??= envSchema.parse(withoutBlanks(process.env));
  return cached;
}

export function requireEnv<K extends "DATABASE_URL" | "AUTH_SECRET">(key: K): string {
  const value = getEnv()[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
}
