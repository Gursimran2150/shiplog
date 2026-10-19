export const NAV_ITEMS = [
  { href: "/", label: "Today" },
  { href: "/timeline", label: "Timeline" },
  { href: "/reports", label: "Reports" },
  { href: "/ask", label: "Ask" },
  { href: "/settings", label: "Settings" },
] as const;

export function isActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
