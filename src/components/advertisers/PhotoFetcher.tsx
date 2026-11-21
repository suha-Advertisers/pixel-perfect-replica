import { ImageDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PHOTO_BUCKET, RateLimitError, fetchTikTokAvatar, tiktokHandle, toSquareJpeg } from "@/lib/photos";

const db = supabase as any;
const FAILED_KEY = "photo-fetch-failed-ids";
const BATCH_LIMIT = 40;

type Candidate = { id: string; full_name: string; handle: string };

function loadFailed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAILED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

/** لوحة جلب صور حسابات تيك توك دفعة واحدة وحفظها في التخزين. */
export function PhotoFetcher() {
  const { can } = useAuth();
  const [total, setTotal] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState("");
  const [failedNames, setFailedNames] = useState<string[]>([]);
  const stop = useRef(false);

  const refresh = useCallback(async () => {
    const { data } = await db
      .from("advertisers")
      .select("id,full_name,username,platform,profile_url,tiktok_url,photo_path")
      .is("deleted_at", null)
      .limit(2000);
    const rows: any[] = data ?? [];
    const failed = loadFailed();
    const list: Candidate[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      if (r.photo_path || failed.has(r.id)) continue;
      const handle = tiktokHandle(r);
      if (!handle || seen.has(handle.toLowerCase())) continue;
      seen.add(handle.toLowerCase());
      list.push({ id: r.id, full_name: r.full_name, handle });
    }
    setTotal(rows.length);
    setCandidates(list);
  }, []);

  useEffect(() => {
    if (can("advertisers.edit")) void refresh();
  }, [can, refresh]);

  if (!can("advertisers.edit")) return null;

  async function run(limit: number) {
    stop.current = false;
    setRunning(true);
    setLog("");
    setFailedNames([]);
    const failed = loadFailed();
    const failedList: string[] = [];
    let ok = 0;
    let rateLimited = false;
    const batch = candidates.slice(0, limit);
    for (let i = 0; i < batch.length; i++) {
      if (stop.current) break;
      const c = batch[i]!;
      setLog(`جارٍ الجلب ${i + 1} من ${batch.length}: ${c.full_name}`);
      try {
        const raw = await fetchTikTokAvatar(c.handle);
        if (!raw) throw new Error("none");
        const jpeg = await toSquareJpeg(raw);
        const path = `${c.id}/${Date.now()}.jpg`;
        const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, jpeg, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });
        if (up.error) throw new Error(up.error.message);
        const { error } = await db.from("advertisers").update({ photo_path: path }).eq("id", c.id);
        if (error) {
          await supabase.storage.from(PHOTO_BUCKET).remove([path]);
          throw new Error(error.message);
        }
        ok++;
      } catch (e) {
        if (e instanceof RateLimitError) {
          rateLimited = true;
          break;
        }
        if (e instanceof TypeError) {
          // غالباً حجب CORS/CSP أو انقطاع الشبكة: نتوقف ولا نعلّم المعلنين كفاشلين.
          setLog("تعذّر الاتصال بخدمة الصور من المتصفح (قد يكون حجباً من الخدمة). لم تُحفظ أي صورة جديدة بعد هذا الحد.");
          setRunning(false);
          await refresh();
          return;
        }
        failed.add(c.id);
        failedList.push(c.full_name);
      }
      await new Promise((r) => setTimeout(r, 700));
    }
    try {
      localStorage.setItem(FAILED_KEY, JSON.stringify([...failed]));
    } catch {
      /* ignore */
    }
    setFailedNames(failedList);
    setLog(
      `تم حفظ ${ok} صورة.` +
        (failedList.length ? ` بلا صورة متاحة: ${failedList.length}.` : "") +
        (rateLimited ? " وصلنا للحد اليومي للخدمة المجانية، أكملي غداً." : "") +
        (stop.current ? " (أُوقف يدوياً)" : ""),
    );
    setRunning(false);
    await refresh();
  }

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-secondary-foreground">
            <ImageDown className="size-5" />
          </span>
          <div>
            <h2 className="font-extrabold">صور المعلنين من تيك توك</h2>
            <p className="text-sm text-muted-foreground">
              {candidates.length > 0
                ? `${candidates.length} معلن بلا صورة (من ${total}). الخدمة المجانية تسمح بنحو 50 صورة يومياً.`
                : "لا يوجد معلنون بحاجة لصور حالياً."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={running || candidates.length === 0} onClick={() => void run(5)}>
            تجربة على 5
          </Button>
          <Button variant="gold" disabled={running || candidates.length === 0} onClick={() => void run(BATCH_LIMIT)}>
            جلب حتى {BATCH_LIMIT}
          </Button>
          {running && (
            <Button variant="ghost" onClick={() => (stop.current = true)}>
              إيقاف
            </Button>
          )}
          {!running && log && (
            <Button variant="ghost" onClick={() => window.location.reload()}>
              تحديث الصفحة
            </Button>
          )}
        </div>
      </div>
      {log && <p role="status" className="mt-3 text-sm">{log}</p>}
      {failedNames.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          بلا صورة: {failedNames.slice(0, 8).join("، ")}
          {failedNames.length > 8 ? ` و${failedNames.length - 8} آخرون` : ""}
        </p>
      )}
    </section>
  );
}
