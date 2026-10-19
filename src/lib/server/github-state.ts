import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { requireEnv } from "@/lib/env";

/**
 * Signed, short-lived `state` for the GitHub App install redirect. It binds the callback to
 * the user who started the flow (CSRF protection) and expires after 10 minutes.
 */
const PURPOSE = "github-install";
const key = () => new TextEncoder().encode(requireEnv("AUTH_SECRET"));

export function signInstallState(userId: string): Promise<string> {
  return new SignJWT({ purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(key());
}

/** True only for a valid, unexpired state issued to this same user. */
export async function verifyInstallState(state: string, userId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(state, key(), { algorithms: ["HS256"] });
    return payload.purpose === PURPOSE && payload.sub === userId;
  } catch {
    return false;
  }
}
