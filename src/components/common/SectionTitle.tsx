import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SectionTitle({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xl font-extrabold">
        {Icon && <Icon className="size-5 text-primary" />}
        <span className="relative">
          {title}
          <span className="absolute -bottom-1.5 start-0 h-0.5 w-10 rounded-full bg-primary" />
        </span>
      </h2>
      {action}
    </div>
  );
}
