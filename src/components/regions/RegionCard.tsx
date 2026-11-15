import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { formatCount } from "@/lib/format";
import type { Region } from "@/lib/regions";

export function RegionCard({
  region,
  count,
  eager = false,
}: {
  region: Region;
  /** null until advertiser data is connected. */
  count: number | null;
  eager?: boolean;
}) {
  return (
    <Link
      to="/regions/$regionSlug"
      params={{ regionSlug: region.slug }}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-card outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-primary sm:aspect-[16/9]"
    >
      <img
        src={region.image}
        alt={region.name}
        loading={eager ? "eager" : "lazy"}
        width={992}
        height={672}
        className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-region" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:gap-3 sm:p-4">
        <div className="text-ink-foreground">
          <h3 className="text-sm font-extrabold leading-tight drop-shadow sm:text-xl">{region.name}</h3>
          <p className="mt-0.5 text-xs opacity-90 tabular sm:text-sm">({formatCount(count)} معلن)</p>
        </div>
        <span className="grid size-8 shrink-0 sm:size-9 place-items-center rounded-full bg-card text-foreground shadow-soft transition-all group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
