import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-secondary-foreground">
            <Icon className="size-5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
