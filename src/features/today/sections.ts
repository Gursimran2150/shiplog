import { CalendarClock, CircleCheck, CircleDashed, OctagonAlert, type LucideIcon } from "lucide-react";
import type { Section } from "@/lib/domain/types";

/** Icon and status accent per section (colour is reserved for status, per DESIGN.md). */
export const SECTION_META: Record<Section, { icon: LucideIcon; accent: string }> = {
  done: { icon: CircleCheck, accent: "text-success" },
  inProgress: { icon: CircleDashed, accent: "text-link" },
  blockers: { icon: OctagonAlert, accent: "text-destructive" },
  tomorrow: { icon: CalendarClock, accent: "text-warning" },
};

/** Sections whose items can become a GitHub issue. */
export const TICKETABLE: ReadonlySet<Section> = new Set(["blockers", "tomorrow"]);
