import { ApiError } from "@/lib/api-client";

/** The server's safe message for API errors, a generic one for anything else. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  return error instanceof ApiError ? error.message : fallback;
}
