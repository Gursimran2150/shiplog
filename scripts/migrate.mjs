// Applies db/schema.sql and ensures the shared demo account exists.
// Usage: node --env-file=.env.local scripts/migrate.mjs
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = neon(url);

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
for (const statement of schema
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean)) {
  await sql.query(statement);
}

// Same format as src/lib/auth/password.ts: scrypt$<salt>$<hash>
const salt = randomBytes(16).toString("base64url");
const hash = scryptSync("shiplog-demo-2026", salt, 64).toString("base64url");
await sql`
  INSERT INTO users (email, name, password_hash, is_demo)
  VALUES ('demo@shiplog.dev', 'Demo Engineer', ${`scrypt$${salt}$${hash}`}, true)
  ON CONFLICT (email) DO NOTHING`;

console.log("schema applied; demo user ready: demo@shiplog.dev / shiplog-demo-2026");
