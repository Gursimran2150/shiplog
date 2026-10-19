"use client";

import { Keyboard, LogOut, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useData";
import { api } from "@/lib/api-client";
import { hardNavigate } from "@/lib/navigation";
import { tourStore } from "@/lib/tour-store";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { isActive, NAV_ITEMS } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

function UserMenu() {
  const { user, isLoading } = useSession();

  async function logout() {
    try {
      await api.post("/api/auth/logout");
      hardNavigate("/login");
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  }

  if (isLoading || !user) return <Skeleton className="size-8 rounded-full" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={`Account menu for ${user.name}`}
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-gradient-to-br from-[#007cf0] to-[#00dfd8] text-xs font-semibold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1.5 text-sm">
          Theme
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => tourStore.replay()}>
          <Map aria-hidden="true" /> Replay welcome tour
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }))}>
          <Keyboard aria-hidden="true" /> Keyboard shortcuts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut aria-hidden="true" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Vercel dashboard layout: top bar with account menu, then a scrollable tab row. */
export function AppShell({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="rounded-md focus-visible:outline-2 focus-visible:outline-ring">
              <Logo />
            </Link>
            {user?.isDemo && (
              <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                DEMO
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <UserMenu />
          </div>
        </div>
        <nav aria-label="Main" className="mx-auto max-w-6xl overflow-x-auto px-2 sm:px-4">
          <ul className="flex">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActive(href, pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-11 items-center rounded-md px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                      active &&
                        "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-foreground",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
