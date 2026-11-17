import { Ghost, Globe, Instagram, Music2, Pencil, Youtube } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  formatFollowers,
  formatPrice,
  groupAdvertisers,
  type AccountLink,
  type AdvertiserGroup,
  type AdvertiserRow,
} from "@/lib/advertisers";

type Props = {
  rows: AdvertiserRow[];
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

function AdvertiserCard({ group, onEdit }: { group: AdvertiserGroup; onEdit?: ((row: AdvertiserRow) => void) | undefined }) {
  const initial = group.name.trim().charAt(0).toUpperCase() || "؟";
  const showRawToo = group.priceTexts.length > 0 && (group.price_attendance !== null || group.price_home !== null);
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary">
      <div className="flex items-start gap-3">
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-gold-soft text-2xl font-extrabold text-secondary-foreground">
          {initial}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate font-extrabold" title={group.name}>
            {group.name}
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
          <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => onEdit(group.primary)}>
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

export function AdvertiserCards({ rows, onEdit, limit }: Props) {
  const groups = useMemo(() => {
    const g = groupAdvertisers(rows);
    return limit ? g.slice(0, limit) : g;
  }, [rows, limit]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {groups.map((g) => (
        <AdvertiserCard key={g.key} group={g} onEdit={onEdit} />
      ))}
    </div>
  );
}
