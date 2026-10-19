import { ArrowRight, FileText, Ticket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOUCH_TARGET } from "./touch";

interface NextStepsProps {
  hasBlockers: boolean;
  onTicketBlockers: () => void;
}

/** What to do once the day is logged: write the standup, and turn blockers into tickets. */
export function NextSteps({ hasBlockers, onTicketBlockers }: NextStepsProps) {
  return (
    <nav aria-label="Next steps" className="flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-1 flex items-center gap-1">
        Next
        <ArrowRight aria-hidden="true" className="size-3" />
      </span>
      <Button asChild variant="outline" size="sm" className={TOUCH_TARGET}>
        <Link href="/reports">
          <FileText aria-hidden="true" />
          Generate today&apos;s standup
        </Link>
      </Button>
      {hasBlockers && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onTicketBlockers}
          className={cn("text-muted-foreground", TOUCH_TARGET)}
        >
          <Ticket aria-hidden="true" />
          Turn blockers into tickets
        </Button>
      )}
    </nav>
  );
}
