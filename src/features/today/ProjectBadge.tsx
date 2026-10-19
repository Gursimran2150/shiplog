import { Badge } from "@/components/ui/badge";

export function ProjectBadge({ project }: { project: string | null }) {
  if (!project) return null;
  return (
    <Badge variant="outline" className="max-w-40 font-mono text-[11px] font-normal text-muted-foreground">
      <span className="truncate">{project}</span>
    </Badge>
  );
}
