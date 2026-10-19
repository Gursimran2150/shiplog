"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  /** Visible group label (also the radiogroup's accessible name). */
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Visually hide the legend when the surrounding UI already labels the group. */
  hideLegend?: boolean;
  className?: string;
}

/**
 * Vercel-style segmented control built on native radio inputs, so arrow keys, Tab and
 * screen readers behave like any radio group without custom key handling.
 */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  disabled,
  hideLegend,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className={cn("flex flex-col gap-2", className)} disabled={disabled}>
      <legend className={cn("mb-2 text-sm font-medium", hideLegend && "sr-only")}>{legend}</legend>
      <div className="inline-flex w-fit rounded-md border border-border bg-muted p-0.5">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative cursor-pointer rounded-[5px] px-3 py-1 text-sm font-medium text-muted-foreground transition-colors select-none hover:text-foreground",
              "has-checked:bg-background has-checked:text-foreground has-checked:shadow-sm dark:has-checked:bg-input/60",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-ring",
              "has-disabled:cursor-not-allowed has-disabled:opacity-50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
