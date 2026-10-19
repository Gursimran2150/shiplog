import "server-only";
import { getEnv } from "@/lib/env";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp, jsonError } from "@/lib/security/http";

let limiter: ReturnType<typeof createRateLimiter> | undefined;

/**
 * Returns an error Response if the caller is over the rate limit, else null.
 * Keyed by user id when logged in (fair per person), otherwise by IP.
 */
export function enforceRateLimit(request: Request, userId?: string): Response | null {
  limiter ??= createRateLimiter(getEnv().RATE_LIMIT_PER_MINUTE);
  const result = limiter(userId ? `user:${userId}` : `ip:${getClientIp(request)}`);
  if (result.allowed) return null;
  return jsonError(429, "Too many requests. Please wait a moment and try again.", {
    "Retry-After": String(result.retryAfter),
  });
}

/** Logs the real error server-side and returns a safe, generic message. */
export function aiErrorResponse(error: unknown): Response {
  console.error("[ai]", error);
  return jsonError(502, "The AI service is unavailable right now. Please try again.");
}
