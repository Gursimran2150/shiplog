"use client";

import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToday } from "@/hooks/useToday";
import { BragTab } from "./BragTab";
import { StandupTab } from "./StandupTab";
import { WeeklyTab } from "./WeeklyTab";

const TABS = [
  { value: "standup", label: "Standup", Panel: StandupTab },
  { value: "weekly", label: "Weekly report", Panel: WeeklyTab },
  { value: "brag", label: "Brag doc", Panel: BragTab },
] as const;

export function ReportsView() {
  const today = useToday();

  return (
    <>
      <PageHeader
        eyebrow="Write-ups"
        title="Reports"
        description="Generated from your logs. Unchanged logs return the saved report instantly."
      />
      {today ? (
        <Tabs defaultValue="standup" className="gap-6">
          <TabsList aria-label="Report type">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="px-3">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map(({ value, Panel }) => (
            <TabsContent key={value} value={value}>
              <Panel today={today} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex flex-col gap-6" aria-hidden="true">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
    </>
  );
}
