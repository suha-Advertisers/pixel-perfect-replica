import { Link } from "@tanstack/react-router";
import { ChartNoAxesColumnIncreasing } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({
  tone = "light",
  compact = false,
  className,
}: {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-3", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-gold text-primary-foreground shadow-gold">
        <ChartNoAxesColumnIncreasing className="size-6" strokeWidth={2.4} />
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-display text-lg font-extrabold",
            tone === "light" ? "text-sidebar-accent-foreground" : "text-foreground",
          )}
        >
          دليل المعلنين
        </span>
        <span
          className={cn(
            "text-[11px]",
            compact && "hidden sm:inline",
            tone === "light" ? "text-sidebar-muted" : "text-muted-foreground",
          )}
        >
          منصة احترافية لإدارة المعلنين
        </span>
      </span>
    </Link>
  );
}
