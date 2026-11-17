import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { DataWorkspace } from "@/components/common/DataWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/campaigns")({ component: CampaignsPage });
const db = supabase as any;
type PriceType = "attendance" | "home" | "hospitality" | "custom";
const labels: Record<PriceType, string> = { attendance: "حضوري", home: "منزلي", hospitality: "ضيافة", custom: "سعر مخصص" };

function CampaignsPage() {
  return <div className="space-y-8">
    <DataWorkspace title="الحملات" description="إنشاء الحملات ومتابعة حالتها وميزانياتها." icon={Megaphone} table="campaigns"
      fields={[{ key: "name", label: "اسم الحملة", required: true }, { key: "client_name", label: "العميل / المعلن" }, { key: "branch_id", label: "الفرع", type: "branch" }, { key: "status", label: "الحالة", type: "select", options: ["draft", "planned", "active", "completed", "cancelled"] }, { key: "starts_on", label: "تاريخ البداية", type: "date" }, { key: "ends_on", label: "تاريخ النهاية", type: "date" }, { key: "budget", label: "الميزانية", type: "number" }, { key: "notes", label: "ملاحظات", type: "textarea" }]}
      columns={[{ key: "name", label: "اسم الحملة" }, { key: "client_name", label: "العميل" }, { key: "status", label: "الحالة" }, { key: "starts_on", label: "البداية" }, { key: "ends_on", label: "النهاية" }, { key: "budget", label: "الميزانية" }]}
      permission="campaigns.view" editPermission="campaigns.manage" filters={["status"]} />
    <CampaignAdvertisers />
  </div>;
}
function CampaignAdvertisers() {
  const { can } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [advertiserId, setAdvertiserId] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("attendance");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    const [c, a] = await Promise.all([
      db.from("campaigns").select("id,name").order("created_at", { ascending: false }),
      db.from("advertisers").select("id,full_name,city,price_attendance,price_home,price_hospitality").is("deleted_at", null).order("full_name").limit(1000),
    ]);
    if (!c.error) { setCampaigns(c.data ?? []); if (!campaignId && c.data?.[0]) setCampaignId(c.data[0].id); }
    if (!a.error) setAdvertisers(a.data ?? []);
  }
  async function loadLinks(id: string) {
    if (!id) { setLinks([]); return; }
    const { data, error } = await db.from("campaign_advertisers").select("id,agreed_price,agreed_price_type,notes,advertisers(full_name,city)").eq("campaign_id", id);
    if (error) setError(error.message); else setLinks(data ?? []);
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { void loadLinks(campaignId); }, [campaignId]);
  const chosen = advertisers.find((a) => a.id === advertiserId);
  const options = [
    ...(Number(chosen?.price_attendance) > 0 ? [{ type: "attendance" as const, amount: Number(chosen.price_attendance) }] : []),
    ...(Number(chosen?.price_home) > 0 ? [{ type: "home" as const, amount: Number(chosen.price_home) }] : []),
    ...(Number(chosen?.price_hospitality) > 0 ? [{ type: "hospitality" as const, amount: Number(chosen.price_hospitality) }] : []),
  ];
  function chooseAdvertiser(id: string) {
    setAdvertiserId(id); setPrice("");
    const a = advertisers.find((x) => x.id === id);
    setPriceType(Number(a?.price_attendance) > 0 ? "attendance" : Number(a?.price_home) > 0 ? "home" : Number(a?.price_hospitality) > 0 ? "hospitality" : "custom");
  }
  async function add() {
    if (!campaignId || !advertiserId) return;
    const selected = options.find((x) => x.type === priceType);
    const amount = price.trim() === "" ? selected?.amount ?? null : Number(price);
    if (amount === null || !Number.isFinite(amount) || amount < 0) { setError("اختر نوع السعر أو أدخل السعر المتفق عليه."); return; }
    setBusy(true);
    const { error } = await db.from("campaign_advertisers").insert({
      campaign_id: campaignId, advertiser_id: advertiserId, agreed_price: amount,
      agreed_price_type: price.trim() === "" ? priceType : "custom",
    });
    setBusy(false);
    if (error) setError(error.message);
    else { setAdvertiserId(""); setPrice(""); setPriceType("attendance"); await loadLinks(campaignId); }
  }
  async function remove(id: string) {
    const { error } = await db.from("campaign_advertisers").delete().eq("id", id);
    if (error) setError(error.message); else await loadLinks(campaignId);
  }
  return <section className="space-y-4 rounded-2xl border bg-card p-5">
    <div><h2 className="text-lg font-bold">المعلنون المشاركون في الحملة</h2><p className="text-sm text-muted-foreground">اختر سعر الحضور أو المنزل لكل معلن، ويُحفظ السعر المتفق عليه للحملة.</p></div>
    {error && <p className="text-sm text-destructive">{error}</p>}
    <div className="grid gap-2 md:grid-cols-4">
      <select className="h-10 rounded-md border bg-background px-3" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}><option value="">اختر الحملة</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select className="h-10 rounded-md border bg-background px-3" value={advertiserId} onChange={(e) => chooseAdvertiser(e.target.value)}><option value="">اختر المعلن</option>{advertisers.map((a) => <option key={a.id} value={a.id}>{a.full_name} — {a.city || ""}</option>)}</select>
      <select className="h-10 rounded-md border bg-background px-3" value={priceType} onChange={(e) => { setPriceType(e.target.value as PriceType); setPrice(""); }} disabled={!advertiserId}>
        {options.map((o) => <option key={o.type} value={o.type}>{labels[o.type]} — {o.amount.toLocaleString("ar-SA")} ر.س</option>)}
        <option value="custom">سعر مخصص</option>
      </select>
      <div className="flex gap-2"><Input type="number" min="0" placeholder="السعر المتفق عليه (اختياري)" value={price} onChange={(e) => setPrice(e.target.value)} /><Button variant="gold" disabled={!can("campaigns.manage") || busy || !campaignId || !advertiserId} onClick={() => void add()}><Plus className="ms-1 size-4" />إضافة</Button></div>
    </div>
    <div className="space-y-2">{links.map((l) => <div key={l.id} className="flex items-center justify-between rounded-lg border p-3"><div><b>{l.advertisers?.full_name}</b><span className="ms-2 text-xs text-muted-foreground">{l.advertisers?.city}</span><p className="text-xs text-muted-foreground">السعر المحفوظ ({labels[l.agreed_price_type as PriceType] ?? "سابق"}): {Number(l.agreed_price ?? 0).toLocaleString("ar-SA")} ر.س</p></div>{can("campaigns.manage") && <Button size="icon" variant="ghost" onClick={() => void remove(l.id)}><Trash2 className="size-4 text-destructive" /></Button>}</div>)}{campaignId && links.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">لم تتم إضافة معلنين لهذه الحملة.</p>}</div>
  </section>;
}
