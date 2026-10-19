import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { requireEnv } from "@/lib/env";

/**
 * AES-256-GCM for third-party tokens at rest. The key is derived from AUTH_SECRET with a
 * purpose label, so it never doubles as the session-signing key. Output: base64url(iv | tag | data).
 */
function key(): Buffer {
  return createHash("sha256")
    .update(`shiplog:token-encryption:v1:${requireEnv("AUTH_SECRET")}`)
    .digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

/** Throws if the value was tampered with or encrypted under a different secret. */
export function decryptSecret(sealed: string): string {
  const raw = Buffer.from(sealed, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}
