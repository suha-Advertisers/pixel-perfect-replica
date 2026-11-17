import { BadgeCheck, Check, Ghost, Globe, Instagram, ListPlus, Music2, Pencil, Plus, X, Youtube } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  formatFollowers,
  formatPrice,
  groupAdvertisers,
  type AccountLink,
  type AdvertiserGroup,
  type AdvertiserRow,
} from "@/lib/advertisers";

const db = supabase as any;

type Props = {
  rows: AdvertiserRow[];
  /** يُظهر زر اختيار المعلن لإضافته إلى قائمة (يظهر فقط لمن يملك صلاحية القوائم). */
  selectable?: boolean;
  onEdit?: ((row: AdvertiserRow) => void) | undefined;
  /** يحدّ عدد البطاقات (للصفحة الرئيسية). */
  limit?: number;
};

const BADGE = "grid size-9 shrink-0 place-items-center rounded-full text-white transition hover:scale-110";

function PlatformIcon({ link }: { link: AccountLink }) {
  const title = `${link.platform}${link.followers ? ` · ${formatFollowers(link.followers)} متابع` : ""}`;
  let inner: ReactNode;
  let style: CSSProperties = {};
  switch (link.platform) {
    case "TikTok":
      inner = <Music2 className="size-4" />;
      style = { background: "#000" };
      break;
    case "Instagram":
      inner = <Instagram className="size-4" />;
      style = { background: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)" };
      break;
    case "Snapchat":
      inner = <Ghost className="size-4" />;
      style = { background: "#FFFC00", color: "#000" };
      break;
    case "YouTube":
      inner = <Youtube className="size-4" />;
      style = { background: "#ff0000" };
      break;
    case "X":
      inner = <span className="text-sm font-black leading-none">X</span>;
      style = { background: "#000" };
      break;
    default:
      inner = <Globe className="size-4" />;
      style = { background: "#6b7280" };
  }
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      aria-label={title}
      className={BADGE}
      style={style}
    >
      {inner}
    </a>
  );
}

function PriceStrip({ group }: { group: AdvertiserGroup }) {
  const parsed = group.price_attendance !== null || group.price_home !== null || group.price_hospitality !== null;
  if (group.price_free) return <b className="text-foreground">مجاني</b>;
  if (parsed) {
    return (
      <span className="flex flex-wrap gap-x-3 gap-y-1">
        {group.price_attendance !== null && (
          <span>حضوري: <b className="text-foreground">{formatPrice(group.price_attendance)}</b></span>
        )}
        {group.price_home !== null && (
          <span>منزلي: <b className="text-foreground">{formatPrice(group.price_home)}</b></span>
        )}
        {group.price_hospitality !== null && (
          <span>ضيافة: <b className="text-foreground">{formatPrice(group.price_hospitality)}</b></span>
        )}
      </span>
    );
  }
  if (group.priceTexts.length) {
    return <span className="whitespace-pre-line text-foreground">{group.priceTexts.join("\n")}</span>;
  }
  return <>الأسعار غير محددة</>;
}

function AdvertiserCard({
  group,
  onEdit,
  selected,
  onToggle,
}: {
  group: AdvertiserGroup;
  onEdit?: ((row: AdvertiserRow) => void) | undefined;
  selected?: boolean | undefined;
  onToggle?: (() => void) | undefined;
}) {
  const initial = group.name.trim().charAt(0).toUpperCase() || "؟";
  const showRawToo = group.priceTexts.length > 0 && (group.price_attendance !== null || group.price_home !== null);
  return (
    <article
      className={`relative flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary ${
        selected ? "border-primary ring-2 ring-primary" : "border-border"
      }`}
    >
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          aria-label={selected ? "إلغاء اختيار المعلن" : "اختيار المعلن"}
          className={`absolute end-3 top-3 z-10 grid size-7 place-items-center rounded-full border-2 transition ${
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent hover:border-primary"
          }`}
        >
          <Check className="size-4" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-gold-soft text-2xl font-extrabold text-secondary-foreground">
          {initial}
        </div>
        <div className={`min-w-0 flex-1 space-y-1 ${onToggle && !onEdit ? "pe-8" : ""}`}>
          <h3 className="flex items-center gap-1.5 font-extrabold" title={group.name}>
            <span className="truncate">{group.name}</span>
            {group.verified && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"
                title="معلن موثوق ومرخص"
              >
                <BadgeCheck className="size-3.5" />
                موثوق ومرخص
              </span>
            )}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {[group.category, group.city].filter(Boolean).join(" · ") || "بدون تصنيف"}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1" dir="ltr">
            {group.links.map((l) => (
              <PlatformIcon key={l.url} link={l} />
            ))}
          </div>
        </div>
        {onEdit && (
          <Button size="icon" variant="ghost" aria-label="تعديل" className={onToggle ? "me-7" : ""} onClick={() => onEdit(group.primary)}>
            <Pencil className="size-4" />
          </Button>
        )}
      </div>

      <p className="text-sm font-semibold">
        {group.totalFollowers ? (
          <>
            <span dir="ltr">{formatFollowers(group.totalFollowers)}</span> متابع
          </>
        ) : (
          <span className="text-muted-foreground">المتابعون غير محددين</span>
        )}
      </p>

      <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <PriceStrip group={group} />
        {showRawToo && (
          <details className="mt-1">
            <summary className="cursor-pointer text-primary">تفاصيل الأسعار</summary>
            <span className="whitespace-pre-line text-foreground">{group.priceTexts.join("\n")}</span>
          </details>
        )}
      </div>

      {group.notes.length > 0 && (
        <div className="space-y-1 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
          <b className="text-foreground">ملاحظات</b>
          {group.notes.map((n) => (
            <p key={n} className="whitespace-pre-line">{n}</p>
          ))}
        </div>
      )}
    </article>
  );
}

function ListPickerDialog({
  open,
  onOpenChange,
  advertiserIds,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  advertiserIds: string[];
  onDone: (message: string) => void;
}) {
  const { session } = useAuth();
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    void (async () => {
      const { data, error: err } = await db
        .from("personal_lists")
        .select("id,name")
        .eq("status", "draft")
        .order("created_at", { ascending: false });
      if (err) setError("تعذّر تحميل القوائم.");
      else setLists(data ?? []);
    })();
  }, [open]);

  async function addTo(listId: string, listName: string) {
    setBusy(true);
    setError("");
    const { error: err } = await db
      .from("personal_list_items")
      .upsert(
        advertiserIds.map((advertiser_id) => ({ list_id: listId, advertiser_id })),
        { onConflict: "list_id,advertiser_id", ignoreDuplicates: true },
      );
    setBusy(false);
    if (err) return setError("تعذّرت الإضافة: " + err.message);
    onOpenChange(false);
    onDone(`تمت إضافة ${advertiserIds.length} معلن إلى «${listName}»`);
  }

  async function createAndAdd() {
    const clean = name.trim();
    if (!clean || !session?.user.id) return;
    setBusy(true);
    setError("");
    const { data, error: err } = await db
      .from("personal_lists")
      .insert({ name: clean, owner_id: session.user.id })
      .select("id,name")
      .single();
    setBusy(false);
    if (err || !data) return setError("تعذّر إنشاء القائمة.");
    setName("");
    await addTo(data.id, data.name);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة {advertiserIds.length} معلن إلى قائمة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">قائمة جديدة</p>
            <div className="flex gap-2">
              <Input
                placeholder="اسم القائمة"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
              <Button variant="gold" disabled={busy || !name.trim()} onClick={() => void createAndAdd()}>
                <Plus className="ms-1 size-4" />
                إنشاء وإضافة
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">أو اختر قائمة موجودة (مسودات)</p>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void addTo(l.id, l.name)}
                  className="w-full rounded-xl border bg-muted/40 p-3 text-start font-semibold transition hover:border-primary disabled:opacity-60"
                >
                  {l.name}
                </button>
              ))}
              {lists.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مسودات بعد.</p>}
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdvertiserCards({ rows, onEdit, limit, selectable = true }: Props) {
  const { can } = useAuth();
  const canSelect = selectable && can("lists.own");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const groups = useMemo(() => {
    const g = groupAdvertisers(rows);
    return limit ? g.slice(0, limit) : g;
  }, [rows, limit]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {groups.map((g) => (
          <AdvertiserCard
            key={g.key}
            group={g}
            onEdit={onEdit}
            selected={selected.has(g.primary.id)}
            onToggle={canSelect ? () => toggle(g.primary.id) : undefined}
          />
        ))}
      </div>

      {(selected.size > 0 || notice) && (
        <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-lg">
          {notice && selected.size === 0 ? (
            <p role="status" className="flex-1 text-center text-sm font-semibold">{notice}</p>
          ) : (
            <>
              <b className="text-sm">{selected.size} محدد</b>
              <div className="flex items-center gap-2">
                <Button variant="gold" onClick={() => setPickerOpen(true)}>
                  <ListPlus className="ms-2 size-4" />
                  إضافة إلى قائمة
                </Button>
                <Button size="icon" variant="ghost" aria-label="إلغاء التحديد" onClick={() => setSelected(new Set())}>
                  <X className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <ListPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        advertiserIds={[...selected]}
        onDone={(m) => {
          setSelected(new Set());
          setNotice(m);
        }}
      />
    </>
  );
}
