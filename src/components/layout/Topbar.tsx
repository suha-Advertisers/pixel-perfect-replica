import { useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "./Brand";
import { SidebarNav } from "./SidebarNav";

function SearchForm({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    navigate({ to: "/advertisers", search: term ? { q: term } : {} });
  }

  return (
    <form onSubmit={onSubmit} className={className} role="search">
      <label className="relative block">
        <span className="sr-only">ابحث عن معلن</span>
        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن معلن أو منطقة..."
          className="h-12 w-full rounded-full border border-border bg-card ps-12 pe-5 text-sm shadow-soft outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </label>
    </form>
  );
}

export function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="فتح القائمة">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-0 p-0 [&>button]:text-sidebar-foreground">
            <SheetTitle className="sr-only">القائمة</SheetTitle>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <Brand tone="dark" compact className="lg:hidden" />

        <SearchForm className="hidden max-w-xl flex-1 md:block" />

        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full border border-border bg-card shadow-soft"
            aria-label="الإشعارات"
          >
            <Bell className="size-5" />
          </Button>
          <div className="flex items-center gap-3 rounded-full border border-border bg-card py-1.5 ps-1.5 pe-4 shadow-soft">
            <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-secondary-foreground">
              <UserRound className="size-5" />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold">مرحباً بك</span>
              <span className="text-[11px] text-muted-foreground">تسجيل الدخول قريباً</span>
            </span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <SearchForm />
      </div>
    </header>
  );
}
