import { Skeleton } from "@/components/ui/skeleton";
import { SECTIONS, SECTION_LABELS } from "@/lib/domain/types";

/** Shimmering placeholders for the four section cards (hidden from AT; TodayView announces progress). */
export function SectionsSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2">
      {SECTIONS.map((section) => (
        <div key={section} className="surface p-4">
          <p className="eyebrow">{SECTION_LABELS[section]}</p>
          <div className="mt-3 flex flex-col gap-2">
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-8/12" />
            <Skeleton className="h-3.5 w-9/12" />
          </div>
        </div>
      ))}
    </div>
  );
}
