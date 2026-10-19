import { userRoute } from "@/lib/api/route";
import { listEntries } from "@/lib/db/repo";
import { journalToMarkdown } from "@/lib/server/export";

/** Downloads the user's full journal as Markdown (data portability). */
export const GET = userRoute({ rateLimit: true }, async ({ user }) => {
  const entries = await listEntries(user.id, "0001-01-01", "9999-12-31", 5000);
  return new Response(journalToMarkdown(user.name, entries), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="shiplog-journal.md"',
      "Cache-Control": "private, no-store",
    },
  });
});
