"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ItemInput } from "./ItemInput";
import { TOUCH_TARGET } from "./touch";

/** "+ Add item" for one section; expands into an inline input. */
export function AddItem({ sectionLabel, onAdd }: { sectionLabel: string; onAdd: (text: string) => void }) {
  const [adding, setAdding] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasAdding = useRef(false);

  useEffect(() => {
    if (wasAdding.current && !adding) buttonRef.current?.focus();
    wasAdding.current = adding;
  }, [adding]);

  if (adding) {
    return (
      <ItemInput
        label={`New item in ${sectionLabel}`}
        submitLabel="Add item"
        onSubmit={(text) => {
          setAdding(false);
          onAdd(text);
        }}
        onCancel={() => setAdding(false)}
      />
    );
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="xs"
      onClick={() => setAdding(true)}
      aria-label={`Add item to ${sectionLabel}`}
      className={cn("self-start text-muted-foreground", TOUCH_TARGET)}
    >
      <Plus aria-hidden="true" />
      Add item
    </Button>
  );
}
