import { Route } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** "Journey" link on a log item: opens that task's journey (where it started and how it went). */
export function JourneyLink({ taskId, text, className }: { taskId: string; text: string; className?: string }) {
  return (
    <Link
      href={`/journeys?task=${taskId}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring max-sm:min-h-11",
        className,
      )}
      aria-label={`See journey: ${text}`}
      title="See where this task started and how it went"
    >
      <Route aria-hidden="true" className="size-3.5" />
      Journey
    </Link>
  );
}
