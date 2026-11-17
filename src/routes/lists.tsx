import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ListChecks, Plus, Trash2, Send } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/lists")({ component: ListsPage });
const db = supabase as any;
type PriceType = "attendance" | "home" | "hospitality" | "free";
const labels: Record<PriceType, string> = { attendance: "حضوري", home: "منزلي", hospitality: "ضيافة", free: "مجاني" };
function prices(a: any) {
  if (!a) return [];
  const result: { type: PriceType; amount: number }[] = [];
  if (Number(a.price_attendance) > 0) result.push({ type: "attendance", amount: Number(a.price_attendance) });
  if (Number(a.price_home) > 0) result.push({ type: "home", amount: Number(a.price_home) });
  if (Number(a.price_hospitality) > 0) result.push({ type: "hospitality", amount: Number(a.price_hospitality) });
  if (a.price_free) result.push({ type: "free", amount: 0 });
  return result;
}
function ListsPage() {
  const { session, can } = useAuth();
  const [lists, setLists] = useState<any[]>([]);
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("attendance");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [l, a] = await Promise.all([
      db.from("personal_lists").select("*").order("created_at", { ascending: false }),
      db.from("advertisers").select("id,full_name,username,city,price_attendance,price_home,price_hospitality,price_free").is("deleted_at", null).order("full_name").limit(1000),
    ]);
    if (l.error) setError(l.error.message);
    else { setLists(l.data ?? []); if (!selected && l.data?.[0]) setSelected(l.data[0].id); }
    if (!a.error) setAdvertisers(a.data ?? []);
  }
  async function loadItems(id: string) {
    if (!id) { setItems([]); return; }
    const { data, error } = await db.from("personal_list_items")
      .select("id,advertiser_id,selected_price_type,selected_price,advertisers(id,full_name,username,city,price_attendance,price_home,price_hospitality,price_free)")
      .eq("list_id", id);
    if (error) setError(error.message); else setItems(data ?? []);
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { void loadItems(selected); }, [selected]);

  const chosen = advertisers.find((a) => a.id === advertiser);
  const options = prices(chosen);
  function chooseAdvertiser(id: string) {
    setAdvertiser(id);
    const a = advertisers.find((x) => x.id === id);
    setPriceType(prices(a)[0]?.type ?? "attendance");
  }
  async function create() {
    if (!name.trim() || !session?.user.id) return;
    setBusy(true);
    const { data, error } = await db.from("personal_lists").insert({ name: name.trim(), owner_id: session.user.id }).select().single();
    setBusy(false);
    if (error) setError(error.message);
    else { setName(""); await load(); setSelected(data.id); }
  }
  async function add() {
    if (!selected || !advertiser) return;
    const option = options.find((x) => x.type === priceType) ?? options[0];
    if (!option) { setError("هذا المعلن لا يملك سعراً مسجلاً. أضف السعر أولاً من صفحة المعلنين."); return; }
    setBusy(true);
    const { error } = await db.from("personal_list_items").insert({
      list_id: selected, advertiser_id: advertiser,
      selected_price_type: option.type, selected_price: option.amount,
    });
    setBusy(false);
    if (error) setError(error.message);
    else { setAdvertiser(""); setPriceType("attendance"); await loadItems(selected); }
  }
  async function remove(id: string) {
    const { error } = await db.from("personal_list_items").delete().eq("id", id);
    if (error) setError(error.message); else await loadItems(selected);
  }
  async function submit() {
    if (!selected || !session?.user.id) return;
    setBusy(true);
    const { error } = await db.from("personal_lists").update({ status: "submitted" }).eq("id", selected);
    if (!error) { await db.from("list_requests").insert({ list_id: selected, submitted_by: session.user.id }); await load(); }
    else setError(error.message);
    setBusy(false);
  }
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.selected_price ?? 0), 0), [items]);
  const current = lists.find((x) => x.id === selected);

  return <div className="space-y-6">
    <PageHeader title="قوائمي" description="اختر نوع السعر لكل معلن ليُحسب الإجمالي بدقة." icon={ListChecks} />
    {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-3 rounded-2xl border bg-card p-4">
        <h2 className="font-bold">قوائمك</h2>
        <div className="flex gap-2"><Input placeholder="اسم القائمة الجديدة" value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="icon" variant="gold" onClick={() => void create()} disabled={!can("lists.own") || busy || !name.trim()}><Plus className="size-4" /></Button></div>
        {lists.map((l) => <button key={l.id} onClick={() => setSelected(l.id)} className={`w-full rounded-xl p-3 text-start ${selected === l.id ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/50"}`}>
          <b>{l.name}</b><span className="mt-1 block text-xs text-muted-foreground">{l.status}</span></button>)}
      </aside>
      <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold">{current?.name ?? "اختر قائمة"}</h2><p className="text-sm text-muted-foreground">{items.length} معلن في القائمة</p></div>
          {current?.status === "draft" && <Button variant="gold" onClick={() => void submit()} disabled={busy || items.length === 0}><Send className="ms-2 size-4" />إرسال للمراجعة</Button>}</div>
        {current?.status === "draft" && <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <select className="h-10 rounded-md border bg-background px-3" value={advertiser} onChange={(e) => chooseAdvertiser(e.target.value)}>
            <option value="">اختر معلناً لإضافته</option>{advertisers.map((a) => <option key={a.id} value={a.id}>{a.full_name} — {a.city || "مدينة غير محددة"}</option>)}</select>
          <select className="h-10 rounded-md border bg-background px-3" value={priceType} onChange={(e) => setPriceType(e.target.value as PriceType)} disabled={!options.length}>
            {options.length ? options.map((p) => <option key={p.type} value={p.type}>{labels[p.type]} — {p.amount.toLocaleString("ar-SA")} ر.س</option>) : <option value="attendance">لا يوجد سعر مسجل</option>}</select>
          <Button onClick={() => void add()} disabled={!advertiser || !options.length || busy}><Plus className="ms-2 size-4" />إضافة</Button>
        </div>}
        <div className="rounded-xl bg-primary/5 p-4"><p className="text-sm text-muted-foreground">الإجمالي حسب الأسعار المختارة</p><b className="mt-1 block text-2xl">{total.toLocaleString("ar-SA")} ر.س</b></div>
        <div className="space-y-2">{items.map((x) => <div key={x.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div>
          <b>{x.advertisers?.full_name}</b><p className="text-xs text-muted-foreground">{[x.advertisers?.username, x.advertisers?.city].filter(Boolean).join(" · ")}</p>
          <p className="mt-1 text-sm">{labels[x.selected_price_type as PriceType] ?? "السعر المختار"}: <b>{Number(x.selected_price ?? 0).toLocaleString("ar-SA")} ر.س</b></p></div>
          {current?.status === "draft" && <Button size="icon" variant="ghost" onClick={() => void remove(x.id)}><Trash2 className="size-4 text-destructive" /></Button>}</div>)}
          {current && items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">لم تضف معلنين إلى هذه القائمة بعد.</p>}</div>
      </section>
    </div>
  </div>;
}
