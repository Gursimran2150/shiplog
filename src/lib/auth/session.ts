import "server-only";
import { requireEnv } from "@/lib/env";
import { jsonError } from "@/lib/security/http";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionUser } from "./token";

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

function getSessionUser(request: Request): Promise<SessionUser | null> {
  return verifySession(readCookie(request, SESSION_COOKIE), requireEnv("AUTH_SECRET"));
}

type AuthResult = { ok: true; user: SessionUser } | { ok: false; response: Response };

/**
 * Authenticates an API request. Mutations must also come from this site (Origin check),
 * which blocks cross-site request forgery on top of the SameSite=Lax cookie.
 */
export async function requireUser(request: Request): Promise<AuthResult> {
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return { ok: false, response: jsonError(403, "Cross-site request blocked.") };
  }
  const user = await getSessionUser(request);
  if (!user) return { ok: false, response: jsonError(401, "Please log in to continue.") };
  return { ok: true, user };
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers and server tools omit it
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function sessionCookie(user: SessionUser): Promise<string> {
  const token = await signSession(user, requireEnv("AUTH_SECRET"));
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
