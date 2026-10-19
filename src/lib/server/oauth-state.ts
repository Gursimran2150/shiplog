import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { requireEnv } from "@/lib/env";

/**
 * Signed, short-lived `state` for third-party connect redirects (GitHub App install, Bitbucket
 * OAuth). It binds the callback to the user who started the flow and to the provider (CSRF
 * protection), and expires after 10 minutes.
 */
type Purpose = "github-install" | "bitbucket-connect";
const key = () => new TextEncoder().encode(requireEnv("AUTH_SECRET"));

export function signOAuthState(userId: string, purpose: Purpose): Promise<string> {
  return new SignJWT({ purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(key());
}

/** True only for a valid, unexpired state issued to this same user for this same provider. */
export async function verifyOAuthState(state: string, userId: string, purpose: Purpose): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(state, key(), { algorithms: ["HS256"] });
    return payload.purpose === purpose && payload.sub === userId;
  } catch {
    return false;
  }
}
