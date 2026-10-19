import { SECTIONS, SECTION_LABELS, type EntryData } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { ProjectBadge } from "./ProjectBadge";
import { SECTION_META } from "./sections";

/** Compact read-only view of an entry's four sections (used in lists). Empty sections are skipped. */
export function EntrySections({ data }: { data: EntryData }) {
  const filled = SECTIONS.filter((s) => data[s].length > 0);
  if (!filled.length) return <p className="text-sm text-muted-foreground">Nothing structured in this entry.</p>;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {filled.map((section) => {
        const { icon: Icon, accent } = SECTION_META[section];
        return (
          <div key={section}>
            <dt className="eyebrow flex items-center gap-1.5">
              <Icon aria-hidden="true" className={cn("size-3.5", accent)} />
              {SECTION_LABELS[section]}
            </dt>
            <dd className="mt-1.5">
              <ul className="flex flex-col gap-1 text-sm">
                {data[section].map((item, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{item.text}</span>
                    <ProjectBadge project={item.project} />
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
