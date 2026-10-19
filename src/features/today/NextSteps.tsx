import { ArrowRight, CalendarRange, CircleCheck, Mic, Ticket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TOUCH_TARGET } from "./touch";

interface NextStepsProps {
  hasBlockers: boolean;
  onTicketBlockers: () => void;
}

/** What to do once the day is logged: the standup is the main call to action, the rest are shortcuts. */
export function NextSteps({ hasBlockers, onTicketBlockers }: NextStepsProps) {
  return (
    <nav aria-label="Next steps" className="surface relative overflow-hidden p-4 sm:p-5">
      <div
        aria-hidden="true"
        className="hero-gradient pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-1.5">
            <CircleCheck aria-hidden="true" className="size-3.5 text-success" />
            Day logged
          </p>
          <p className="mt-1.5 text-base font-semibold tracking-[-0.02em]">Your standup is one click away.</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Yesterday, today and blockers — written from your logs, ready to paste.
          </p>
        </div>
        <Button asChild size="lg" className="group h-11 shrink-0 gap-2 px-5 shadow-sm">
          <Link href="/reports">
            <Mic aria-hidden="true" />
            Generate today&apos;s standup
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        </Button>
      </div>
      <div className="relative mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <Button asChild variant="ghost" size="sm" className={TOUCH_TARGET}>
          <Link href="/reports?tab=weekly">
            <CalendarRange aria-hidden="true" />
            Weekly report
          </Link>
        </Button>
        {hasBlockers && (
          <Button variant="ghost" size="sm" onClick={onTicketBlockers} className={TOUCH_TARGET}>
            <Ticket aria-hidden="true" />
            Turn blockers into tickets
          </Button>
        )}
      </div>
    </nav>
  );
}
