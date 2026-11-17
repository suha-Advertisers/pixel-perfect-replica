/** تجميع حسابات المنصات المتعددة لنفس المعلن في بطاقة واحدة. */
import { platformFromUrl, urlKey } from "@/lib/csv";

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
  instagram_url?: string | null;
  snapchat_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  x_url?: string | null;
  price_attendance?: number | null;
  price_home?: number | null;
  price_hospitality?: number | null;
  price_free?: boolean | null;
  price_text?: string | null;
  notes?: string | null;
  is_verified?: boolean | null;
  [key: string]: unknown;
};

export type AccountLink = { platform: string; url: string; followers: number | null };

export type AdvertiserGroup = {
  key: string;
  name: string;
  accounts: AdvertiserRow[];
  primary: AdvertiserRow;
  category: string | null;
  city: string | null;
  links: AccountLink[];
  totalFollowers: number | null;
  price_attendance: number | null;
  price_home: number | null;
  price_hospitality: number | null;
  price_free: boolean;
  priceTexts: string[];
  notes: string[];
  verified: boolean;
};

/** أعمدة الجدول المطلوبة لعرض البطاقات (تُستخدم في كل الصفحات). */
export const ADVERTISER_CARD_COLUMNS =
  "id,full_name,username,region_slug,city,category,platform,followers,profile_url,instagram_url,snapchat_url,tiktok_url,youtube_url,x_url,price_attendance,price_home,price_hospitality,price_free,price_text,notes,is_verified,created_at";

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
const PLATFORM_ORDER = ["TikTok", "Instagram", "Snapchat", "YouTube", "X"];
const URL_COLUMNS: [string, keyof AdvertiserRow][] = [
  ["Instagram", "instagram_url"],
  ["Snapchat", "snapchat_url"],
  ["TikTok", "tiktok_url"],
  ["YouTube", "youtube_url"],
  ["X", "x_url"],
];

function collectLinks(accounts: AdvertiserRow[]): AccountLink[] {
  const seen = new Map<string, AccountLink>();
  const add = (platform: string | null | undefined, url: string | null | undefined, followers: number | null) => {
    const u = (url ?? "").trim();
    if (!u) return;
    const p = platform || platformFromUrl(u) || "رابط";
    const k = urlKey(u);
    const prev = seen.get(k);
    if (prev) {
      if (prev.followers === null && followers !== null) prev.followers = followers;
      return;
    }
    seen.set(k, { platform: p, url: /^https?:\/\//i.test(u) ? u : `https://${u}`, followers });
  };
  for (const a of accounts) {
    add(a.platform, a.profile_url, a.followers ?? null);
    for (const [p, col] of URL_COLUMNS) add(p, a[col] as string | null | undefined, null);
  }
  return [...seen.values()].sort((a, b) => {
    const ia = PLATFORM_ORDER.indexOf(a.platform);
    const ib = PLATFORM_ORDER.indexOf(b.platform);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

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
  const uniq = (items: AdvertiserRow[], pick: (r: AdvertiserRow) => string | null | undefined) => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const r of items) {
      const v = (pick(r) ?? "").trim();
      if (v && !seen.has(norm(v))) {
        seen.add(norm(v));
        out.push(v);
      }
    }
    return out;
  };
  return [...map.entries()].map(([key, accounts]) => {
    const sorted = [...accounts].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
    const primary = sorted[0]!;
    const links = collectLinks(sorted);
    const withFollowers = links.filter((l) => l.followers !== null);
    return {
      key,
      name: primary.full_name,
      accounts: sorted,
      primary,
      category: first(sorted, (r) => r.category),
      city: first(sorted, (r) => r.city),
      links,
      totalFollowers: withFollowers.length ? withFollowers.reduce((s, l) => s + (l.followers ?? 0), 0) : null,
      price_attendance: first(sorted, (r) => r.price_attendance),
      price_home: first(sorted, (r) => r.price_home),
      price_hospitality: first(sorted, (r) => r.price_hospitality),
      price_free: sorted.some((r) => r.price_free === true),
      priceTexts: uniq(sorted, (r) => r.price_text),
      notes: uniq(sorted, (r) => r.notes),
      verified: sorted.some((r) => r.is_verified === true),
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
