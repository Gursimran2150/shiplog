import { createHash } from "node:crypto";

interface Entry {
  value: string;
  expiresAt: number;
}

/**
 * Small in-memory LRU with a TTL, used for answers that depend only on curated data and the
 * request itself (rights, schemes). Repeat questions return instantly without a model call.
 * Per serverless instance by design: no extra infrastructure, and stale entries expire.
 */
export function createAnswerCache(maxEntries = 200, ttlMs = 60 * 60 * 1000, now: () => number = Date.now) {
  const entries = new Map<string, Entry>();

  return {
    get(key: string): string | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now()) {
        entries.delete(key);
        return undefined;
      }
      // Re-insert so Map order tracks recency (least recently used first).
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key: string, value: string): void {
      entries.delete(key);
      entries.set(key, { value, expiresAt: now() + ttlMs });
      if (entries.size > maxEntries) {
        const oldest = entries.keys().next();
        if (!oldest.done) entries.delete(oldest.value);
      }
    },
    get size() {
      return entries.size;
    },
  };
}

/** Stable key for a task + input: identical requests hash identically, regardless of size. */
export function cacheKey(task: string, input: unknown): string {
  return createHash("sha256").update(task).update("\0").update(JSON.stringify(input)).digest("base64url");
}
