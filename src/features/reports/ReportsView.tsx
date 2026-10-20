"use client";

import { useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToday } from "@/hooks/useToday";
import { BragTab } from "./BragTab";
import { PrTab } from "./PrTab";
import { StandupTab } from "./StandupTab";
import { WeeklyTab } from "./WeeklyTab";

const TABS = [
  { value: "standup", label: "Standup", Panel: StandupTab },
  { value: "weekly", label: "Weekly report", Panel: WeeklyTab },
  { value: "brag", label: "Brag doc", Panel: BragTab },
  { value: "pr", label: "PR description", Panel: PrTab },
] as const;
type TabValue = (typeof TABS)[number]["value"];

const noopSubscribe = () => () => {};
/** `/reports?tab=weekly` opens that tab (links from Today); anything else falls back to Standup. */
function tabFromUrl(): TabValue {
  const tab = new URLSearchParams(window.location.search).get("tab");
  return TABS.find((t) => t.value === tab)?.value ?? "standup";
}

export function ReportsView() {
  const today = useToday();
  const linked = useSyncExternalStore(noopSubscribe, tabFromUrl, () => "standup" as const);
  const [picked, setPicked] = useState<TabValue | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Write-ups"
        title="Reports"
        description="Standups, weekly reports and brag docs from your logs, plus PR descriptions from a quick voice note."
      />
      {today ? (
        <Tabs value={picked ?? linked} onValueChange={(v) => setPicked(v as TabValue)} className="gap-6">
          <TabsList aria-label="Report type" className="max-w-full justify-start overflow-x-auto">
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
