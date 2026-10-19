/** ShipLog mark: an upward "ship it" triangle in ink, like the rest of the Geist palette. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
        <path d="M12 3 22 20H2L12 3Z" fill="currentColor" />
      </svg>
      ShipLog
    </span>
  );
}
