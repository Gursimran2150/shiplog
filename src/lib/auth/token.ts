import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "saathi_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  isDemo: boolean;
}

const key = (secret: string) => new TextEncoder().encode(secret);

/** Signs a short session token (HS256). Works in Node and the proxy runtime. */
export async function signSession(user: SessionUser, secret: string): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, demo: user.isDemo })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key(secret));
}

/** Returns the session user, or null for a missing, expired or tampered token. */
export async function verifySession(token: string | undefined, secret: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.name !== "string" || typeof payload.email !== "string") return null;
    return { id: payload.sub, name: payload.name, email: payload.email, isDemo: payload.demo === true };
  } catch {
    return null;
  }
}
