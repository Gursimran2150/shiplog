import { useId } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOUCH_TARGET } from "./touch";

/** Topics to cover when dictating, each with the starter phrase it drops into the log. */
const PROMPTS = [
  { label: "What you finished", starter: "Finished: " },
  { label: "What's in progress", starter: "Working on: " },
  { label: "Anything blocking", starter: "Blocked on: " },
  { label: "Plan for tomorrow", starter: "Tomorrow: " },
] as const;

interface SpeakingPromptsProps {
  disabled?: boolean;
  onPick: (starter: string) => void;
  /** Topics and the starter phrase each one adds (defaults to the daily-log topics). */
  prompts?: readonly { label: string; starter: string }[];
}

/** "Not sure what to say?" pills: each one adds a starter line to the log for people who freeze at the mic. */
export function SpeakingPrompts({ disabled, onPick, prompts = PROMPTS }: SpeakingPromptsProps) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <span id={labelId} className="mr-1 text-xs text-muted-foreground">
        Not sure what to say? Cover:
      </span>
      {prompts.map(({ label, starter }) => (
        <Button
          key={starter}
          type="button"
          variant="outline"
          size="xs"
          disabled={disabled}
          onClick={() => onPick(starter)}
          className={cn("rounded-full font-normal text-muted-foreground", TOUCH_TARGET)}
          title={`Adds “${starter.trim()}” on a new line`}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
