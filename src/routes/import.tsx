import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  areaHintFromFileName,
  normalizeAr,
  normalizePlatform,
  cleanNote,
  parseCsv,
  parseFollowers,
  parsePrices,
  toLatinDigits,
  urlKey,
} from "@/lib/csv";

export const Route = createFileRoute("/import")({ component: ImportPage });

const db = supabase as any;

const HEADER_MAP: Record<string, string> = {
  "الاسم الكامل": "full_name", "الاسم": "full_name", full_name: "full_name", name: "full_name",
  "اسم المستخدم": "username", username: "username", "المعرف": "username",
  "المنطقة": "area", region: "area", region_slug: "area",
  "المدينة": "city_raw", city: "city_raw",
  "الحي": "neighborhood", neighborhood: "neighborhood",
  "الفئة": "category", "فئة المحتوى": "category", category: "category",
  "المنصة": "platform", "المنصة الرئيسية": "platform", platform: "platform",
  "المتابعون": "followers", "عدد المتابعين": "followers", followers: "followers",
  "رابط الحساب": "profile_url", "الرابط": "profile_url", profile_url: "profile_url",
  "رقم التواصل": "phone", "رقم الجوال": "phone", "الجوال": "phone", phone: "phone",
  "الجنس": "gender", gender: "gender",
  "سعر الحضور": "price_attendance", price_attendance: "price_attendance",
  "سعر المنزل": "price_home", price_home: "price_home",
  "سعر الضيافة": "price_hospitality", price_hospitality: "price_hospitality",
  "السعر": "price_text", "الأسعار": "price_text", "الاسعار": "price_text", price_text: "price_text",
  "ملاحظات": "notes", "ملاحظات عامة": "notes", "الملاحظات": "notes", notes: "notes",
};

const PLATFORM_URL_COLUMN: Record<string, string> = {
  TikTok: "tiktok_url", Snapchat: "snapchat_url", Instagram: "instagram_url", YouTube: "youtube_url", X: "x_url",
};

type Area = { regions: { slug: string; name_ar: string }[]; cities: { region_slug: string; name_ar: string }[] };
type Item = { rowNo: number; key: string; patch: Record<string, any>; phone: string | null };
type Update = { id: string; diff: Record<string, any>; phone: string | null; item: Item };
type Plan = {
  total: number;
  inserts: Item[];
  updates: Update[];
  unchanged: number;
  skipped: { rowNo: number; reason: string }[];
  phoneUpdates: number;
  followersParsed: number;
  areaHint: string;
  preview: { name: string; platform: string; followers: string; place: string; status: string }[];
};

function resolveArea(cands: string[], area: Area): { region_slug: string; city: string | null } | null {
  const cityMap = new Map<string, { region_slug: string; name_ar: string }>();
  for (const c of area.cities) cityMap.set(normalizeAr(c.name_ar), c);
  const regionByName = new Map(area.regions.map((r) => [normalizeAr(r.name_ar), r.slug] as const));
  const slugs = new Set(area.regions.map((r) => r.slug));
  for (const raw of cands) {
    const c = cityMap.get(normalizeAr(raw));
    if (c) return { region_slug: c.region_slug, city: c.name_ar };
  }
  for (const raw of cands) {
    const slug = regionByName.get(normalizeAr(raw)) ?? (slugs.has(raw.trim().toLowerCase()) ? raw.trim().toLowerCase() : undefined);
    if (slug) return { region_slug: slug, city: null };
  }
  return null;
}

const keyOf = (platform: string, url: string, username: string, name: string) =>
  url ? `${platform.toLowerCase()}|${urlKey(url)}` : `${platform.toLowerCase()}|${username.toLowerCase()}|${name.toLowerCase()}`;

function cleanPhone(raw: string): string | null {
  const p = toLatinDigits(raw).replace(/[^\d+/ ]/g, "").replace(/\s+/g, " ").trim();
  return p.length >= 5 && p.length <= 30 ? p : null;
}

async function fetchAll(select: string): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("advertisers").select(select).range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function buildPlan(file: File): Promise<Plan> {
  const rows = parseCsv(await file.text());
  if (rows.length < 2) throw new Error("الملف فارغ أو لا يحتوي صفوفاً.");
  const headers = rows[0]!.map((h) => HEADER_MAP[h.trim().toLowerCase()] ?? HEADER_MAP[h.trim()] ?? "");
  if (!headers.includes("full_name")) throw new Error("لم أجد عمود «الاسم الكامل» في الملف.");

  const [{ data: regions, error: e1 }, { data: cities, error: e2 }] = await Promise.all([
    db.from("regions").select("slug,name_ar"),
    db.from("cities").select("region_slug,name_ar"),
  ]);
  if (e1 || e2) throw new Error((e1 ?? e2).message);
  const area: Area = { regions: regions ?? [], cities: cities ?? [] };
  const hint = areaHintFromFileName(file.name);

  const skipped: Plan["skipped"] = [];
  const merged = new Map<string, Item>();
  let followersParsed = 0;
  rows.slice(1).forEach((cells, idx) => {
    const rowNo = idx + 2;
    const v: Record<string, string> = {};
    headers.forEach((h, i) => { if (h) v[h] = (cells[i] ?? "").trim(); });
    const name = v["full_name"] ?? "";
    if (!name) return void skipped.push({ rowNo, reason: "بدون اسم" });
    const place = resolveArea([v["area"] ?? "", hint, v["city_raw"] ?? ""].filter(Boolean), area);
    if (!place) return void skipped.push({ rowNo, reason: `منطقة غير معروفة: «${v["area"] || hint || v["city_raw"] || "—"}»` });

    const platform = v["platform"] ? normalizePlatform(v["platform"]) : "";
    const followers = parseFollowers(v["followers"]);
    if (followers !== null) followersParsed++;
    const url = v["profile_url"] ?? "";
    const patch: Record<string, any> = { full_name: name, region_slug: place.region_slug };
    if (place.city) patch["city"] = place.city;
    const put = (k: string, val: unknown) => { if (val !== "" && val !== null && val !== undefined) patch[k] = val; };
    put("username", v["username"]); put("category", v["category"]); put("platform", platform);
    put("followers", followers); put("profile_url", url); put("neighborhood", v["neighborhood"]); put("gender", v["gender"]);
    for (const p of ["price_attendance", "price_home", "price_hospitality"] as const) {
      const n = Number(toLatinDigits(v[p] ?? "").replace(/[^\d.]/g, ""));
      if (v[p] && Number.isFinite(n)) patch[p] = n;
    }
    put("price_text", v["price_text"]);
    const pr = parsePrices(v["price_text"]);
    if (pr.attendance !== null && patch["price_attendance"] === undefined) patch["price_attendance"] = pr.attendance;
    if (pr.home !== null && patch["price_home"] === undefined) patch["price_home"] = pr.home;
    const nt = cleanNote(v["notes"]);
    put("notes", nt.note);
    for (const l of nt.links) { const c = PLATFORM_URL_COLUMN[l.platform]; if (c) patch[c] = l.url; }
    const col = PLATFORM_URL_COLUMN[platform];
    if (col && url) patch[col] = url;
    const key = keyOf(platform, url, v["username"] ?? "", name);
    const phone = v["phone"] ? cleanPhone(v["phone"]) : null;
    const prev = merged.get(key);
    merged.set(key, prev ? { rowNo: prev.rowNo, key, patch: { ...prev.patch, ...patch }, phone: phone ?? prev.phone } : { rowNo, key, patch, phone });
  });

  const existing = await fetchAll("id,full_name,username,platform,profile_url,followers,region_slug,city,category,neighborhood,gender,price_attendance,price_home,price_hospitality,price_text,notes,instagram_url,snapchat_url,tiktok_url,youtube_url,x_url,deleted_at");
  const byKey = new Map<string, any>();
  for (const e of existing) byKey.set(keyOf(e.platform ?? "", e.profile_url ?? "", e.username ?? "", e.full_name ?? ""), e);

  const inserts: Item[] = [];
  const updates: Update[] = [];
  let unchanged = 0;
  let phoneUpdates = 0;
  const preview: Plan["preview"] = [];
  for (const item of merged.values()) {
    const e = byKey.get(item.key);
    const label = (status: string) => {
      if (preview.length < 8)
        preview.push({ name: item.patch["full_name"], platform: item.patch["platform"] ?? "—", followers: item.patch["followers"] != null ? String(item.patch["followers"]) : "—", place: [item.patch["region_slug"], item.patch["city"]].filter(Boolean).join(" / "), status });
    };
    if (!e) { inserts.push(item); if (item.phone) phoneUpdates++; label("جديد"); continue; }
    if (e.deleted_at) { skipped.push({ rowNo: item.rowNo, reason: "موجود في سلة المحذوفات" }); continue; }
    const diff: Record<string, any> = {};
    for (const [k, val] of Object.entries(item.patch)) if (String(e[k] ?? "") !== String(val)) diff[k] = val;
    if (Object.keys(diff).length || item.phone) {
      updates.push({ id: e.id, diff, phone: item.phone, item });
      if (item.phone) phoneUpdates++;
      label("تحديث");
    } else { unchanged++; label("دون تغيير"); }
  }
  return { total: rows.length - 1, inserts, updates, unchanged, skipped, phoneUpdates, followersParsed, areaHint: hint, preview };
}

function ImportPage() {
  const { can } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const canPhones = can("advertisers.view_phone");

  async function pick(f: File) {
    setFile(f); setPlan(null); setMessage(""); setBusy(true);
    try { setPlan(await buildPlan(f)); } catch (e) { setMessage(e instanceof Error ? e.message : "تعذّر قراءة الملف"); }
    setBusy(false);
  }

  async function run() {
    if (!plan || !can("advertisers.import")) return;
    setBusy(true); setMessage("");
    const errors: string[] = [];
    const phones: { advertiser_id: string; phone: string }[] = [];
    try {
      for (let i = 0; i < plan.inserts.length; i += 100) {
        const chunk = plan.inserts.slice(i, i + 100);
        const { data, error } = await db.from("advertisers").insert(chunk.map((c) => c.patch)).select("id,platform,profile_url,username,full_name");
        if (error) { errors.push(error.message); continue; }
        for (const r of data ?? []) {
          const it = chunk.find((c) => c.key === keyOf(r.platform ?? "", r.profile_url ?? "", r.username ?? "", r.full_name ?? ""));
          if (it?.phone) phones.push({ advertiser_id: r.id, phone: it.phone });
        }
      }
      for (let i = 0; i < plan.updates.length; i += 10) {
        await Promise.all(plan.updates.slice(i, i + 10).map(async (u) => {
          if (Object.keys(u.diff).length) {
            const { error } = await db.from("advertisers").update({ ...u.diff, updated_at: new Date().toISOString() }).eq("id", u.id);
            if (error) { errors.push(error.message); return; }
          }
          if (u.phone) phones.push({ advertiser_id: u.id, phone: u.phone });
        }));
      }
      if (canPhones && phones.length) {
        for (let i = 0; i < phones.length; i += 100) {
          const { error } = await db.from("advertiser_phones").upsert(phones.slice(i, i + 100), { onConflict: "advertiser_id" });
          if (error) errors.push(error.message);
        }
      }
      setMessage(
        `تم: إضافة ${plan.inserts.length}، تحديث ${plan.updates.length}، بلا تغيير ${plan.unchanged}.` +
          (canPhones ? ` أرقام التواصل المحفوظة: ${phones.length}.` : " (لم تُحفظ أرقام التواصل: لا تملك صلاحية الهاتف.)") +
          (errors.length ? ` — أخطاء: ${[...new Set(errors)].slice(0, 3).join(" | ")}` : ""),
      );
      setPlan(null); setFile(null);
    } catch (e) { setMessage(e instanceof Error ? e.message : "فشل الاستيراد"); }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="استيراد المعلنين" description="يقرأ المنطقة من الملف أو من اسمه، ويحدّث المعلنين الموجودين بدل تجاوزهم." icon={FileSpreadsheet} />
      <section className="rounded-2xl border bg-card p-6">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center">
          <Upload className="size-8 text-primary" />
          <b>اختر ملف CSV</b>
          <span className="text-sm text-muted-foreground">الأعمدة: الاسم الكامل، اسم المستخدم، المنطقة، المدينة، الفئة، المنصة، المتابعون (مثل 170.5k)، رابط الحساب، رقم التواصل</span>
          <input type="file" accept=".csv,.txt" className="sr-only" onChange={(e) => e.target.files?.[0] && void pick(e.target.files[0])} />
        </label>
        {file && <p className="mt-3 text-sm">الملف: {file.name}{plan?.areaHint ? ` — المنطقة المستنتجة من الاسم: «${plan.areaHint}»` : ""}</p>}
        {busy && !plan && <p className="mt-3 text-sm text-muted-foreground">جارٍ التحليل…</p>}
        {plan && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[["جديد", plan.inserts.length], ["سيُحدَّث", plan.updates.length], ["بلا تغيير", plan.unchanged], ["متجاوز", plan.skipped.length]].map(([l, n]) => (
                <div key={String(l)} className="rounded-xl border bg-background p-3 text-center"><div className="text-2xl font-extrabold">{n}</div><div className="text-xs text-muted-foreground">{l}</div></div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">متابعون مقروءون: {plan.followersParsed} · أرقام تواصل: {plan.phoneUpdates}{!canPhones && plan.phoneUpdates ? " (لن تُحفظ دون صلاحية الهاتف)" : ""}</p>
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b text-muted-foreground"><th className="p-2 text-start">الاسم</th><th className="p-2 text-start">المنصة</th><th className="p-2 text-start">المتابعون</th><th className="p-2 text-start">المنطقة / المدينة</th><th className="p-2 text-start">الحالة</th></tr></thead>
              <tbody>{plan.preview.map((p, i) => <tr key={i} className="border-b last:border-0"><td className="p-2">{p.name}</td><td className="p-2">{p.platform}</td><td className="p-2">{p.followers}</td><td className="p-2" dir="ltr">{p.place}</td><td className="p-2">{p.status}</td></tr>)}</tbody></table></div>
            {plan.skipped.length > 0 && <details className="text-sm"><summary className="cursor-pointer font-semibold">المتجاوزة ({plan.skipped.length})</summary><ul className="mt-2 list-disc ps-5 text-muted-foreground">{plan.skipped.slice(0, 15).map((s, i) => <li key={i}>صف {s.rowNo}: {s.reason}</li>)}</ul></details>}
          </div>
        )}
        {message && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="gold" disabled={!plan || busy || !can("advertisers.import") || (plan.inserts.length + plan.updates.length === 0)} onClick={() => void run()}>
            {busy ? "جارٍ التنفيذ…" : "تأكيد الاستيراد"}
          </Button>
          <Button variant="outline" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeffالاسم الكامل,اسم المستخدم,المنطقة,المدينة,الفئة,المنصة,المتابعون,رابط الحساب,رقم التواصل\n"], { type: "text/csv" })); a.download = "advertisers-template.csv"; a.click(); }}>
            <Download className="ms-2 size-4" />قالب CSV
          </Button>
        </div>
      </section>
    </div>
  );
}
