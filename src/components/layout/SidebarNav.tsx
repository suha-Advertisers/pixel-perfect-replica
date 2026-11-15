import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { adminNav, mainNav, type NavItem } from "@/lib/navigation";
import { Brand } from "./Brand";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: (() => void) | undefined }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === "/" }}
      className="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-gradient-sidebar-active data-[status=active]:font-semibold data-[status=active]:text-sidebar-primary"
    >
      <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-sidebar-primary opacity-0 transition-opacity group-data-[status=active]:opacity-100" />
      <Icon className="size-5 shrink-0 opacity-80 group-data-[status=active]:opacity-100" />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 pb-6 pt-6">
        <Brand />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label="القائمة الرئيسية">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3.5 pb-1 text-xs font-medium tracking-wide text-sidebar-muted">
            الإدارة
          </p>
          {adminNav.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="m-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
        <div className="flex items-center gap-2 text-sidebar-primary">
          <ShieldCheck className="size-5" />
          <span className="font-display text-sm font-bold">منصة خاصة</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-sidebar-muted">
          الوصول متاح فقط للمستخدمين المعتمدين من مدير النظام.
        </p>
      </div>
    </div>
  );
}
