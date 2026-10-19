import "server-only";
import type { z } from "zod";
import { enforceRateLimit } from "@/lib/ai/guard";
import { isSameOrigin, requireUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/token";
import { jsonError, parseJsonBody } from "@/lib/security/http";

/**
 * Route-handler wrappers that apply the cross-cutting checks in one fixed order:
 * same-origin (CSRF) → session → rate limit → query/body validation → handler,
 * plus a catch-all that logs server-side and never leaks internals.
 */

interface RouteOptions<B, Q> {
  /** Validate the JSON body with this schema; the parsed value is passed as `body`. */
  body?: z.ZodType<B>;
  /** Validate URL search params with this schema; the parsed value is passed as `query`. */
  query?: z.ZodType<Q>;
  /** Apply the per-user (or per-IP when logged out) rate limit. */
  rateLimit?: boolean;
}

interface PublicContext<B, Q> {
  request: Request;
  body: B;
  query: Q;
}

interface UserContext<B, Q> extends PublicContext<B, Q> {
  user: SessionUser;
}

type Handler<C, P> = (ctx: C, params: P) => Promise<Response> | Response;

function invalid(issues: z.core.$ZodIssue[]): Response {
  const issue = issues[0];
  const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  return jsonError(400, `Invalid request. ${where}${issue?.message ?? ""}`.trim());
}

async function finish<B, Q>(
  request: Request,
  options: RouteOptions<B, Q>,
  userId: string | undefined,
  run: (body: B, query: Q) => Promise<Response> | Response,
): Promise<Response> {
  if (options.rateLimit) {
    const limited = enforceRateLimit(request, userId);
    if (limited) return limited;
  }
  let query = undefined as Q;
  if (options.query) {
    const parsed = options.query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return invalid(parsed.error.issues);
    query = parsed.data;
  }
  let body = undefined as B;
  if (options.body) {
    const parsed = await parseJsonBody(request, options.body);
    if (!parsed.ok) return parsed.response;
    body = parsed.data;
  }
  try {
    return await run(body, query);
  } catch (error) {
    console.error("[api]", error);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}

/** For endpoints that work without a session (login, signup, demo, logout). */
export function publicRoute<B = undefined, Q = undefined, P = unknown>(
  options: RouteOptions<B, Q>,
  handler: Handler<PublicContext<B, Q>, P>,
) {
  return async (request: Request, params?: P): Promise<Response> => {
    if (request.method !== "GET" && !isSameOrigin(request)) return jsonError(403, "Cross-site request blocked.");
    return finish(request, options, undefined, (body, query) => handler({ request, body, query }, params as P));
  };
}

/** For endpoints that need the logged-in user; the handler only ever sees that user's id. */
export function userRoute<B = undefined, Q = undefined, P = unknown>(
  options: RouteOptions<B, Q>,
  handler: Handler<UserContext<B, Q>, P>,
) {
  return async (request: Request, params?: P): Promise<Response> => {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    return finish(request, options, auth.user.id, (body, query) =>
      handler({ request, body, query, user: auth.user }, params as P),
    );
  };
}

export const NO_STORE = { "Cache-Control": "private, no-store" } as const;
