import { memo, useId } from "react";
import { SECTION_LABELS, type LogItem, type Section } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { AddItem } from "./AddItem";
import { EditableItem } from "./EditableItem";
import { SECTION_META, TICKETABLE } from "./sections";

interface SectionCardProps {
  section: Section;
  items: LogItem[];
  onCreateTicket: (text: string) => void;
  onUpdate: (section: Section, index: number, text: string) => void;
  onRemove: (section: Section, index: number) => void;
  onAdd: (section: Section, text: string) => void;
}

/** One of the four structured sections: editable items, "+ Add item", and "Create ticket" on blockers and to-dos. */
export const SectionCard = memo(function SectionCard({
  section,
  items,
  onCreateTicket,
  onUpdate,
  onRemove,
  onAdd,
}: SectionCardProps) {
  const headingId = useId();
  const { icon: Icon, accent } = SECTION_META[section];
  const label = SECTION_LABELS[section];

  return (
    <section aria-labelledby={headingId} data-section={section} className="surface flex min-w-0 flex-col p-4">
      <h3 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className={cn("size-4", accent)} />
        {label}
        <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing here</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {items.map((item, i) => (
            <EditableItem
              // Text in the key resets an open editor if the list shifts under it (e.g. after a remove).
              key={`${i}:${item.text}`}
              item={item}
              ticketable={TICKETABLE.has(section)}
              onCreateTicket={onCreateTicket}
              onSave={(text) => onUpdate(section, i, text)}
              onRemove={() => onRemove(section, i)}
            />
          ))}
        </ul>
      )}
      <div className="mt-2">
        <AddItem sectionLabel={label} onAdd={(text) => onAdd(section, text)} />
      </div>
    </section>
  );
});
