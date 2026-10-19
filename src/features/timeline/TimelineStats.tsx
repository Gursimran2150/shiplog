import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PeriodStats } from "./stats";

function StatCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className="surface p-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2">
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <span className="block truncate text-2xl font-semibold tracking-[-0.04em]">{value}</span>
        )}
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      </dd>
    </div>
  );
}

interface TimelineStatsProps {
  period: PeriodStats;
  periodLoading: boolean;
  topProject: { name: string; items: number } | null;
  weekLoading: boolean;
}

export function TimelineStats({ period, periodLoading, topProject, weekLoading }: TimelineStatsProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Current streak" value={`${period.streak}d`} hint="Weekdays in a row" loading={periodLoading} />
      <StatCard label="Days logged" value={period.daysLogged} hint="Last 26 weeks" loading={periodLoading} />
      <StatCard label="Items shipped" value={period.items} hint="Last 26 weeks" loading={periodLoading} />
      <StatCard
        label="Top project"
        value={topProject?.name ?? "—"}
        hint={topProject ? `${topProject.items} items this week` : "No projects this week"}
        loading={weekLoading}
      />
    </dl>
  );
}
