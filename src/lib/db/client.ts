import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { requireEnv } from "@/lib/env";

let client: NeonQueryFunction<false, false> | undefined;

/** Shared Neon HTTP client: one round-trip per query, no connection pool to warm up. */
export function db(): NeonQueryFunction<false, false> {
  client ??= neon(requireEnv("DATABASE_URL"));
  return client;
}
