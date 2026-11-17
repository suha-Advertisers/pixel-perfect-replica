import type { ReactNode } from "react";

import { ScreenGuard } from "./ScreenGuard";
import { SidebarNav } from "./SidebarNav";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <ScreenGuard />
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-72 lg:block">
        <SidebarNav />
      </aside>
      <div className="lg:ps-72">
        <Topbar />
        <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
