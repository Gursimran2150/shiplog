// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { loginSchema, signupSchema } from "./schemas";
import { signSession, verifySession } from "./token";

const SECRET = "x".repeat(40);
const user = { id: "6f1c2c1e-0000-4000-8000-000000000001", name: "Asha", email: "asha@example.com", isDemo: false };

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("salts every hash and rejects malformed stored values", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
    expect(await verifyPassword("x", "md5$abc")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips the user", async () => {
    expect(await verifySession(await signSession(user, SECRET), SECRET)).toEqual(user);
  });

  it("rejects tampered, foreign-key and missing tokens", async () => {
    const token = await signSession(user, SECRET);
    expect(await verifySession(`${token.slice(0, -2)}xx`, SECRET)).toBeNull();
    expect(await verifySession(token, "y".repeat(40))).toBeNull();
    expect(await verifySession(undefined, SECRET)).toBeNull();
  });
});

describe("auth schemas", () => {
  it("normalises email and enforces password length on signup", () => {
    expect(loginSchema.parse({ email: " Asha@Example.COM ", password: "p" }).email).toBe("asha@example.com");
    expect(signupSchema.safeParse({ name: "A", email: "a@b.co", password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "A", email: "not-an-email", password: "longenough" }).success).toBe(false);
  });
});
