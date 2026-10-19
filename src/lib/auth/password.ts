import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

/** Hashes a password as `scrypt$<salt>$<hash>` (memory-hard, per-user random salt). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${hash.toString("base64url")}`;
}

/** Constant-time comparison against a stored hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = await scryptAsync(password, salt, KEY_LENGTH);
  const expectedBuf = Buffer.from(expected, "base64url");
  return expectedBuf.length === actual.length && timingSafeEqual(actual, expectedBuf);
}
