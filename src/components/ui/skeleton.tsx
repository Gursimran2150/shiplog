import { cn } from "@/lib/utils";

/** Placeholder block with a sweeping shimmer highlight (see `.skeleton-shimmer` in globals.css). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn("skeleton-shimmer", className)} {...props} />;
}

export { Skeleton };
