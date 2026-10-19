import { Ticket } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { SECTION_LABELS, type LogItem, type Section } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { ProjectBadge } from "./ProjectBadge";
import { SECTION_META, TICKETABLE } from "./sections";
import { TOUCH_TARGET } from "./touch";

interface SectionCardProps {
  section: Section;
  items: LogItem[];
  onCreateTicket: (text: string) => void;
}

/** One of the four structured sections, with "Create ticket" on blockers and to-dos. */
export function SectionCard({ section, items, onCreateTicket }: SectionCardProps) {
  const headingId = useId();
  const { icon: Icon, accent } = SECTION_META[section];
  const ticketable = TICKETABLE.has(section);

  return (
    <section aria-labelledby={headingId} className="surface flex flex-col p-4">
      <h3 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className={cn("size-4", accent)} />
        {SECTION_LABELS[section]}
        <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing here</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex flex-col gap-1.5 text-sm">
              <span className="leading-snug">{item.text}</span>
              <div className="flex flex-wrap items-center gap-2">
                <ProjectBadge project={item.project} />
                {ticketable && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className={cn("text-muted-foreground", TOUCH_TARGET)}
                    onClick={() => onCreateTicket(item.text)}
                    aria-label={`Create ticket: ${item.text}`}
                  >
                    <Ticket aria-hidden="true" />
                    Create ticket
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
