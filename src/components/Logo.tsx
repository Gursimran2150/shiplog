/**
 * ShipLog mark: three voice-waveform bars rising into an up arrow ("speak it, ship it"),
 * on a rounded ink tile with the develop gradient from DESIGN.md.
 */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="shiplog-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#007cf0" />
          <stop offset="1" stopColor="#00dfd8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <rect x="6" y="17" width="3.2" height="7" rx="1.6" fill="url(#shiplog-grad)" />
      <rect x="11.6" y="13" width="3.2" height="11" rx="1.6" fill="url(#shiplog-grad)" />
      <rect x="17.2" y="15" width="3.2" height="9" rx="1.6" fill="url(#shiplog-grad)" />
      <path
        d="M24.4 24V10.5m-3.6 3.4 3.6-3.6 3.6 3.6"
        stroke="url(#shiplog-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <LogoMark />
      ShipLog
    </span>
  );
}
