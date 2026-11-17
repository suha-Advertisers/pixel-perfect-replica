import { ExternalLink, Pencil, Users } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  formatFollowers,
  formatPrice,
  groupAdvertisers,
  type AdvertiserGroup,
  type AdvertiserRow,
} from "@/lib/advertisers";

type Props = {
  rows: AdvertiserRow[];
  onEdit?: ((row: AdvertiserRow) => void) | undefined;
};

function AdvertiserCard({ group, onEdit }: { group: AdvertiserGroup; onEdit?: ((row: AdvertiserRow) => void) | undefined }) {
  const initial = group.name.trim().charAt(0).toUpperCase() || "؟";
  const hasPrices =
    group.price_free ||
    group.price_attendance !== null ||
    group.price_home !== null ||
    group.price_hospitality !== null;
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary">
      <div className="flex items-start gap-3">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-gold-soft text-xl font-extrabold text-secondary-foreground">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-extrabold" title={group.name}>
            {group.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {[group.category, group.city].filter(Boolean).join(" · ") || "بدون تصنيف"}
          </p>
        </div>
        {onEdit && (
          <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => onEdit(group.primary)}>
            <Pencil className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {group.accounts.map((a) => {
          const label = `${a.platform ?? "حساب"}${a.followers ? ` · ${formatFollowers(a.followers)}` : ""}`;
          const cls =
            "inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold";
          return a.profile_url ? (
            <a key={a.id} href={a.profile_url} target="_blank" rel="noreferrer noopener" className={`${cls} hover:border-primary`} dir="ltr">
              {label}
              <ExternalLink className="size-3 opacity-60" />
            </a>
          ) : (
            <span key={a.id} className={cls} dir="ltr">
              {label}
            </span>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <Users className="size-4 text-primary" />
        {group.topFollowers ? `${formatFollowers(group.topFollowers)} متابع` : "المتابعون غير محددين"}
      </p>

      <div className="mt-auto rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {hasPrices ? (
          group.price_free ? (
            <b className="text-foreground">مجاني</b>
          ) : (
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <span>حضوري: <b className="text-foreground">{formatPrice(group.price_attendance)}</b></span>
              <span>منزلي: <b className="text-foreground">{formatPrice(group.price_home)}</b></span>
              <span>ضيافة: <b className="text-foreground">{formatPrice(group.price_hospitality)}</b></span>
            </span>
          )
        ) : (
          "الأسعار غير محددة"
        )}
      </div>
    </article>
  );
}

export function AdvertiserCards({ rows, onEdit }: Props) {
  const groups = useMemo(() => groupAdvertisers(rows), [rows]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {groups.map((g) => (
        <AdvertiserCard key={g.key} group={g} onEdit={onEdit} />
      ))}
    </div>
  );
}
