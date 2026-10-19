import { Circle, CircleCheck, CircleDashed, OctagonAlert, type LucideIcon } from "lucide-react";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/** Icon and status colour per task status (colour is reserved for status, per DESIGN.md). */
const STATUS_META: Record<TaskStatus, { icon: LucideIcon; accent: string }> = {
  planned: { icon: Circle, accent: "text-muted-foreground" },
  in_progress: { icon: CircleDashed, accent: "text-link" },
  blocked: { icon: OctagonAlert, accent: "text-destructive" },
  done: { icon: CircleCheck, accent: "text-success" },
};

/** Status icon with the label for screen readers (visible label optional). */
export function TaskStatusIcon({ status, showLabel = false }: { status: TaskStatus; showLabel?: boolean }) {
  const { icon: Icon, accent } = STATUS_META[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-medium", accent)}>
      <Icon aria-hidden="true" className="size-3.5" />
      <span className={showLabel ? undefined : "sr-only"}>{TASK_STATUS_LABELS[status]}</span>
    </span>
  );
}
