import type { StandupFormat } from "@/lib/domain/types";

export const FORMAT_OPTIONS: readonly { value: StandupFormat; label: string }[] = [
  { value: "slack", label: "Slack" },
  { value: "teams", label: "Teams" },
  { value: "plain", label: "Plain" },
];
