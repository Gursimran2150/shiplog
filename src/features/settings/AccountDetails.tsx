"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useData";

export function AccountDetails() {
  const { user, isLoading } = useSession();

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Loading account">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Name</dt>
        <dd className="truncate font-medium">{user.name}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="truncate font-mono text-[0.8rem]">{user.email}</dd>
      </dl>
      {user.isDemo && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-warning">
            Demo account
          </Badge>
          Sample data for exploring ShipLog. Create your own account to keep your logs.
        </p>
      )}
    </div>
  );
}
