"use client";

import { Flame, Mic } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDayCounts } from "@/hooks/useData";
import { addDays, currentStreak, formatDay } from "@/lib/domain/dates";

const STREAK_WINDOW_DAYS = 60;

export function TodayHeader({ today, wordsToday }: { today: string | null; wordsToday: number }) {
  const { days, isLoading } = useDayCounts(today && addDays(today, -STREAK_WINDOW_DAYS), today);
  const streak = useMemo(() => {
    if (!today) return 0;
    const logged = new Set<string>();
    for (const day of days) if (day.entries > 0) logged.add(day.date);
    return currentStreak(logged, today);
  }, [days, today]);

  return (
    <PageHeader
      eyebrow={today ? formatDay(today, { weekday: "long", day: "numeric", month: "long" }) : "Today"}
      title="What did you ship today?"
      actions={
        isLoading ? (
          <Skeleton className="h-6 w-40 rounded-full" />
        ) : (
          <>
            <Badge variant="outline" className="h-7 gap-1.5 px-3 text-sm">
              <Flame aria-hidden="true" className="text-warning" />
              {streak}-day streak
            </Badge>
            <Badge variant="outline" className="h-7 gap-1.5 px-3 text-sm">
              <Mic aria-hidden="true" className="text-link" />
              {wordsToday.toLocaleString("en-IN")} words spoken today
            </Badge>
          </>
        )
      }
    />
  );
}
