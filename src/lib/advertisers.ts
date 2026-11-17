/** تجميع حسابات المنصات المتعددة لنفس المعلن في بطاقة واحدة. */

export type AdvertiserRow = {
  id: string;
  full_name: string;
  username?: string | null;
  region_slug?: string | null;
  city?: string | null;
  category?: string | null;
  platform?: string | null;
  followers?: number | null;
  profile_url?: string | null;
  price_attendance?: number | null;
  price_home?: number | null;
  price_hospitality?: number | null;
  price_free?: boolean | null;
  [key: string]: unknown;
};

export type AdvertiserGroup = {
  key: string;
  name: string;
  accounts: AdvertiserRow[];
  primary: AdvertiserRow;
  category: string | null;
  city: string | null;
  topFollowers: number | null;
  price_attendance: number | null;
  price_home: number | null;
  price_hospitality: number | null;
  price_free: boolean;
};

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

export function groupAdvertisers(rows: AdvertiserRow[]): AdvertiserGroup[] {
  const map = new Map<string, AdvertiserRow[]>();
  for (const r of rows) {
    const key = `${norm(r.full_name ?? "")}|${r.region_slug ?? ""}`;
    const list = map.get(key);
    if (list) list.push(r);
    else map.set(key, [r]);
  }
  const first = <T,>(items: AdvertiserRow[], pick: (r: AdvertiserRow) => T | null | undefined): T | null => {
    for (const r of items) {
      const v = pick(r);
      if (v !== null && v !== undefined && (v as unknown) !== "") return v;
    }
    return null;
  };
  return [...map.entries()].map(([key, accounts]) => {
    const sorted = [...accounts].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
    const primary = sorted[0]!;
    return {
      key,
      name: primary.full_name,
      accounts: sorted,
      primary,
      category: first(sorted, (r) => r.category),
      city: first(sorted, (r) => r.city),
      topFollowers: primary.followers ?? null,
      price_attendance: first(sorted, (r) => r.price_attendance),
      price_home: first(sorted, (r) => r.price_home),
      price_hospitality: first(sorted, (r) => r.price_hospitality),
      price_free: sorted.some((r) => r.price_free === true),
    };
  });
}

export function formatFollowers(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatPrice(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : `${Number(n).toLocaleString("ar-SA")} ر.س`;
}
