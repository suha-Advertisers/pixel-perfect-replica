import type { LucideIcon } from "lucide-react";

import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "gold",
  prefix,
}: {
  label: string;
  /** null = not available yet (no fake numbers). */
  value: number | null;
  icon: LucideIcon;
  tone?: "gold" | "sage" | "ink";
  prefix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div>
        <p className="font-display text-3xl font-extrabold tabular">
          {value !== null && prefix}
          {formatCount(value)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
      <span
        className={cn(
          "grid size-12 place-items-center rounded-xl",
          tone === "gold" && "bg-primary-soft text-primary",
          tone === "sage" && "bg-sage-soft text-sage",
          tone === "ink" && "bg-secondary text-foreground",
        )}
      >
        <Icon className="size-6" />
      </span>
    </div>
  );
}
