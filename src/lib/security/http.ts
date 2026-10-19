import type { z } from "zod";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function jsonError(status: number, message: string, headers?: HeadersInit): Response {
  return Response.json({ error: message }, { status, headers });
}

const MAX_BODY_BYTES = 6 * 1024 * 1024;

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/** Reads a JSON body with a size cap and validates it against a zod schema. */
export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<ParseResult<T>> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return { ok: false, response: jsonError(413, "Request is too large.") };
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError(400, "Request body must be valid JSON.") };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return { ok: false, response: jsonError(400, `Invalid request. ${where}${issue?.message ?? ""}`.trim()) };
  }
  return { ok: true, data: result.data };
}
