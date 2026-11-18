import { useCallback, useDeferredValue, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Plus, Search, Pencil, Trash2, RotateCcw, Download, RefreshCw, LayoutGrid, Rows3 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { parseFollowersInput } from "@/lib/followers";

type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "url" | "textarea" | "select" | "boolean" | "branch" | "followers" | "region" | "city";
  options?: string[];
  required?: boolean;
};

type Column = {
  key: string;
  label: string;
  format?: (value: any, row: any) => string;
};

type Props = {
  orderBy?: string;
  title: string;
  description: string;
  icon: any;
  table: string;
  fields: Field[];
  columns: Column[];
  permission?: string;
  editPermission?: string;
  softDelete?: boolean;
  filters?: string[];
  empty?: string;
  trashMode?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  primaryKey?: string;
  renderCards?: (rows: any[], ctx: { onEdit?: (row: any) => void; onDelete?: (rows: any[]) => void }) => ReactNode;
};

const db = supabase as any;

function FollowersField({ value, required, onChange }: { value: unknown; required: boolean; onChange: (v: string) => void }) {
  const text = String(value ?? "");
  const r = parseFollowersInput(text);
  return (
    <div className="space-y-1">
      <Input
        inputMode="decimal"
        dir="ltr"
        autoComplete="off"
        required={required}
        placeholder="مثال: 181.6k أو 181600"
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
      {r.error ? (
        <p className="text-xs text-destructive">{r.error}</p>
      ) : r.value !== null ? (
        <p className="text-xs text-muted-foreground">
          = {r.value.toLocaleString("en")} متابع{r.note ? ` (${r.note})` : ""}
        </p>
      ) : null}
    </div>
  );
}

export function DataWorkspace({
  title,
  description,
  icon,
  table,
  fields,
  columns,
  permission,
  editPermission,
  softDelete = false,
  filters = [],
  empty = "لا توجد بيانات حتى الآن",
  trashMode = false,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  primaryKey = "id",
  renderCards,
  orderBy = "created_at",
}: Props) {
  const { can } = useAuth();

  const allowed = !permission || can(permission);
  const canModify = allowed && (!editPermission || can(editPermission));

  const [rows, setRows] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("الكل");

  const [editing, setEditing] = useState<any | null | undefined>(undefined);
  const [editingMode, setEditingMode] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"cards" | "table">(renderCards ? "cards" : "table");
  const [regions, setRegions] = useState<{ slug: string; name_ar: string }[]>([]);
  const [cities, setCities] = useState<{ region_slug: string; name_ar: string }[]>([]);
  const deferredQuery = useDeferredValue(query);
  const filtersKey = filters.join("|");
  const followersNeeded =
    table === "advertisers" && (!editingMode || !editing?.platform || /^tiktok/i.test(String(editing.platform).trim()));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let request = db.from(table).select("*").order(orderBy, { ascending: false }).limit(1000);

      if (trashMode && table === "advertisers") {
        request = request.not("deleted_at", "is", null);
      } else if (softDelete && table === "advertisers") {
        request = request.is("deleted_at", null);
      }

      const { data, error: e } = await request;

      if (e) throw e;

      setRows(data ?? []);
    } catch (err: any) {
      setError("تعذّر تحميل البيانات: " + (err?.message ?? "خطأ غير معروف"));
    } finally {
      setLoading(false);
    }
  }, [table, softDelete, orderBy, trashMode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (fields.some((f) => f.type === "branch")) {
      void db.from("branches")
        .select("id,name,city")
        .eq("is_active", true)
        .then(({ data }: any) => setBranches(data ?? []));
    }
  }, [table, fields]);

  useEffect(() => {
    if (!fields.some((f) => f.type === "region" || f.type === "city")) return;
    void Promise.all([
      db.from("regions").select("slug,name_ar").order("name_ar"),
      db.from("cities").select("region_slug,name_ar").order("name_ar"),
    ]).then(([r, c]: any[]) => {
      setRegions(r.data ?? []);
      setCities(c.data ?? []);
    });
  }, [table, fields]);

  const visible = useMemo(() => rows.filter((row) => {
    const text = [
      row.full_name,
      row.name,
      row.email,
      row.username,
      row.city,
      row.region_slug,
      row.platform,
      row.status,
    ].filter(Boolean).join(" ").toLowerCase();

    const matches = !deferredQuery || text.includes(deferredQuery.toLowerCase());
    const matchesFilter = filter === "الكل" || filters.some((k) => String(row[k] ?? "") === filter);

    return matches && matchesFilter;
  }), [rows, deferredQuery, filter, filtersKey]);

  function closeEditor() {
    setEditing(undefined);
    setEditingMode(false);
    setEditingId(null);
    setForm({});
  }

  async function open(row?: any) {
    setError("");
    setForm({});

    const isEditing = row !== undefined && row !== null;
    const rowId = isEditing ? row[primaryKey] : null;

    if (isEditing && (rowId === null || rowId === undefined || rowId === "")) {
      setError("تعذّر فتح التعديل لأن معرّف السجل غير موجود. لم تتم إضافة أي معلن.");
      return;
    }

    setEditingMode(isEditing);
    setEditingId(rowId ?? null);
    setEditing(row ?? {});

    try {
      const next = isEditing
        ? Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ""]))
        : {};

      if (isEditing && table === "advertisers") {
        const tasks: Promise<any>[] = [];

        if (can("advertisers.view_phone")) {
          tasks.push(
            db.from("advertiser_phones")
              .select("phone")
              .eq("advertiser_id", rowId)
              .maybeSingle()
          );
        } else {
          tasks.push(Promise.resolve({ data: null, error: null }));
        }

        if (can("advertisers.view_notes")) {
          tasks.push(
            db.from("advertiser_admin_notes")
              .select("notes")
              .eq("advertiser_id", rowId)
              .maybeSingle()
          );
        } else {
          tasks.push(Promise.resolve({ data: null, error: null }));
        }

        const [phoneResult, notesResult] = await Promise.all(tasks);

        if (phoneResult.error) throw phoneResult.error;
        if (notesResult.error) throw notesResult.error;

        if (can("advertisers.view_phone")) {
          next.phone = phoneResult.data?.phone ?? "";
        }

        if (can("advertisers.view_notes")) {
          next.admin_notes = notesResult.data?.notes ?? "";
        }
      }

      setForm(next);
    } catch (err: any) {
      setError("تعذّر تحميل بيانات التعديل: " + (err?.message ?? "خطأ غير معروف"));
      closeEditor();
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();

    if (!canModify || saving) return;

    if (editingMode && (editingId === null || editingId === undefined || editingId === "")) {
      setError("لا يمكن الحفظ: معرّف السجل غير موجود. لم تتم إضافة سجل جديد.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: Record<string, any> = {};
      const privateFields = table === "advertisers" ? ["phone", "admin_notes"] : [];

      for (const f of fields) {
        if (privateFields.includes(f.key)) continue;

        const v = form[f.key];

        if (f.type === "followers") {
          const parsed = parseFollowersInput(String(v ?? ""));
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.value === null && followersNeeded) throw new Error("عدد متابعين تيك توك مطلوب.");
          payload[f.key] = parsed.value;
          continue;
        }

        if (f.required && (v === "" || v === null || v === undefined)) {
          throw new Error(`الحقل "${f.label}" مطلوب.`);
        }

        if (f.type === "number" && v !== "" && v !== null && v !== undefined) {
          const numberValue = Number(v);

          if (!Number.isFinite(numberValue)) {
            throw new Error(`قيمة الحقل "${f.label}" غير صحيحة.`);
          }

          if (table === "advertisers" && f.key === "followers") {
            if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
              throw new Error("عدد المتابعين يجب أن يكون رقماً صحيحاً موجباً أو صفراً.");
            }
          }

          payload[f.key] = numberValue;
        } else if (f.type === "boolean") {
          payload[f.key] = Boolean(v);
        } else {
          payload[f.key] = v === "" || v === null || v === undefined ? null : v;
        }
      }

      if (["advertisers", "campaigns", "branches", "personal_lists"].includes(table)) {
        payload.updated_at = new Date().toISOString();
      }

      if (table === "list_requests") {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        payload.reviewer_id = userData.user?.id ?? null;
        payload.reviewed_at = new Date().toISOString();
      }

      if (table === "advertisers") {
        if (!editingMode && !payload.platform) payload.platform = "TikTok";
        if (editingMode && typeof editing?.platform === "string" && editing.platform !== editing.platform.trim()) {
          payload.platform = editing.platform.trim();
        }
      }

      let result: any;

      if (editingMode) {
        result = await db.from(table)
          .update(payload)
          .eq(primaryKey, editingId)
          .select(primaryKey)
          .maybeSingle();
      } else {
        result = await db.from(table)
          .insert(payload)
          .select(primaryKey)
          .single();
      }

      if (result.error) throw result.error;

      if (editingMode && !result.data?.[primaryKey]) {
        throw new Error(
          "لم يتم تحديث السجل. تحقق من صلاحية التعديل أو وجود السجل. لم تتم إضافة سجل جديد."
        );
      }

      if (!editingMode && !result.data?.[primaryKey]) {
        throw new Error("لم يرجع الخادم معرّف السجل بعد الإضافة.");
      }

      if (
        table === "list_requests" &&
        editingMode &&
        editing?.list_id &&
        (form.status === "approved" || form.status === "rejected")
      ) {
        const parentUpdate = await db.from("personal_lists")
          .update({ status: form.status })
          .eq("id", editing.list_id);

        if (parentUpdate.error) throw parentUpdate.error;
      }

      const recordId = editingMode ? editingId : result.data?.[primaryKey];

      if (table === "advertisers" && recordId) {
        const privateTasks: Promise<any>[] = [];

        for (const [field, sideTable, column, permission] of [
          ["phone", "advertiser_phones", "phone", "advertisers.view_phone"],
          ["admin_notes", "advertiser_admin_notes", "notes", "advertisers.view_notes"],
        ] as const) {
          if (!fields.some((f) => f.key === field) || !can(permission)) continue;

          const value = String(form[field] ?? "").trim();

          privateTasks.push(
            value
              ? db.from(sideTable).upsert(
                  { advertiser_id: recordId, [column]: value },
                  { onConflict: "advertiser_id" }
                )
              : db.from(sideTable).delete().eq("advertiser_id", recordId)
          );
        }

        const sideResults = await Promise.all(privateTasks);
        const failed = sideResults.find((r: any) => r.error);

        if (failed?.error) {
          throw new Error(
            "تم حفظ بيانات المعلن الأساسية، لكن تعذّر حفظ أحد الحقول الخاصة: " +
            failed.error.message
          );
        }
      }

      closeEditor();
      await load();

    } catch (err: any) {
      setError("لم يتم إكمال الحفظ: " + (err?.message ?? "خطأ غير معروف"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: any) {
    if (!canModify || !window.confirm("تأكيد نقل هذا السجل إلى سلة المحذوفات؟")) return;

    const result = softDelete
      ? await db.from(table).update({ deleted_at: new Date().toISOString() }).eq(primaryKey, row[primaryKey])
      : table === "profiles"
        ? await db.from(table).update({ is_active: false }).eq(primaryKey, row[primaryKey])
        : await db.from(table).delete().eq(primaryKey, row[primaryKey]);

    if (result.error) setError(result.error.message);
    else await load();
  }

  async function removeMany(list: any[]) {
    if (!canModify || !list.length) return;
    const label = list[0]?.full_name ?? "المعلن";
    if (!window.confirm(`نقل «${label}» (${list.length} حساب) إلى سلة المحذوفات؟ يمكنك استعادته لاحقاً من السلة.`)) return;
    const ids = list.map((r) => r[primaryKey]).filter((id) => id !== null && id !== undefined && id !== "");
    if (!ids.length) return;
    const { error: e } = await db.from(table).update({ deleted_at: new Date().toISOString() }).in(primaryKey, ids);
    if (e) setError("تعذّر الحذف: " + e.message);
    else await load();
  }

  function exportCsv() {
    const header = columns.map((c) => c.label).join(",");

    const lines = visible.map((row) =>
      columns.map((c) =>
        `"${String(c.format ? c.format(row[c.key], row) : row[c.key] ?? "").replaceAll('"', '""')}"`
      ).join(",")
    );

    const blob = new Blob(["\ufeff" + [header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const distinct = [...new Set(
    rows.flatMap((r) => filters.map((k) => r[k]).filter(Boolean))
  )].map(String);

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} icon={icon} />

      <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في السجلات…"
              className="pe-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>الكل</option>
              {distinct.map((v) => <option key={v}>{v}</option>)}
            </select>

            {renderCards && (
              <div className="flex overflow-hidden rounded-md border border-input">
                <Button
                  type="button"
                  variant={view === "cards" ? "gold" : "ghost"}
                  className="rounded-none"
                  aria-pressed={view === "cards"}
                  onClick={() => setView("cards")}
                >
                  <LayoutGrid className="ms-2 size-4" />كروت
                </Button>
                <Button
                  type="button"
                  variant={view === "table" ? "gold" : "ghost"}
                  className="rounded-none"
                  aria-pressed={view === "table"}
                  onClick={() => setView("table")}
                >
                  <Rows3 className="ms-2 size-4" />جدول
                </Button>
              </div>
            )}

            <Button type="button" variant="outline" onClick={exportCsv}>
              <Download className="ms-2 size-4" />تصدير CSV
            </Button>

            <Button type="button" variant="outline" onClick={() => void load()}>
              <RefreshCw className="ms-2 size-4" />تحديث
            </Button>

            {canModify && canCreate && (
              <Button type="button" variant="gold" onClick={() => void open()}>
                <Plus className="ms-2 size-4" />إضافة
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {renderCards && view === "cards" && !trashMode ? (
          loading
            ? <p className="p-8 text-center text-muted-foreground">جارٍ تحميل البيانات…</p>
            : visible.length === 0
              ? <p className="p-8 text-center text-muted-foreground">{empty}</p>
              : (
                <div className="mt-5">
                  {renderCards(visible, {
                    ...(canModify && canEdit
                      ? {
                          onEdit: (row: any) => void open(row),
                          ...(canDelete && softDelete ? { onDelete: (list: any[]) => void removeMany(list) } : {}),
                        }
                      : {})
                  })}
                </div>
              )
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[650px] text-start text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  {columns.map((c) => (
                    <th key={c.key} className="px-3 py-3 text-start font-semibold">
                      {c.label}
                    </th>
                  ))}
                  {(canModify && canEdit || allowed && trashMode) && (
                    <th className="px-3 py-3 text-start">الإجراءات</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-8 text-center text-muted-foreground">
                      جارٍ تحميل البيانات…
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-8 text-center text-muted-foreground">
                      {empty}
                    </td>
                  </tr>
                ) : visible.map((row) => (
                  <tr key={row[primaryKey]} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                    {columns.map((c) => (
                      <td key={c.key} className="max-w-[260px] truncate px-3 py-3">
                        {c.format ? c.format(row[c.key], row) : row[c.key] ?? "—"}
                      </td>
                    ))}

                    {(canModify && canEdit || allowed && trashMode) && (
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          {trashMode ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const { error } = await db.from(table)
                                  .update({ deleted_at: null })
                                  .eq(primaryKey, row[primaryKey]);

                                if (error) setError(error.message);
                                else await load();
                              }}
                            >
                              <RotateCcw className="ms-1 size-4" />استعادة
                            </Button>
                          ) : (
                            <>
                              {canEdit && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  aria-label="تعديل"
                                  onClick={() => void open(row)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              )}
                              {canEdit && canDelete && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  aria-label="حذف"
                                  onClick={() => void remove(row)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          عدد السجلات المعروضة: {visible.length} · يتم تطبيق صلاحيات قاعدة البيانات على القراءة والتعديل.
        </p>
      </section>

      {editing !== undefined && canModify && canEdit && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={save}
            className="max-h-[92dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-card p-4 shadow-xl sm:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingMode ? "تعديل" : "إضافة"} — {title}
              </h2>
              <Button type="button" variant="ghost" onClick={closeEditor}>
                إغلاق
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields
                .filter((f) => f.key !== "phone" || can("advertisers.view_phone"))
                .filter((f) => f.key !== "admin_notes" || can("advertisers.view_notes"))
                .map((f) => (
                  <div
                    key={f.key}
                    className={`space-y-2 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
                  >
                    <Label>{f.label}{f.required || (f.type === "followers" && followersNeeded) ? " *" : ""}</Label>

                    {f.type === "region" ? (
                      <select
                        required={f.required}
                        className="h-10 w-full rounded-md border border-input bg-background px-3"
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value, city: "" }))}
                      >
                        <option value="">اختر المنطقة</option>
                        {regions.map((r) => <option key={r.slug} value={r.slug}>{r.name_ar}</option>)}
                        {form[f.key] && !regions.some((r) => r.slug === form[f.key]) && (
                          <option value={form[f.key]}>{form[f.key]} (غير معروفة)</option>
                        )}
                      </select>
                    ) : f.type === "city" ? (
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3"
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      >
                        <option value="">بدون</option>
                        {cities
                          .filter((c) => c.region_slug === form["region_slug"])
                          .map((c) => <option key={c.name_ar} value={c.name_ar}>{c.name_ar}</option>)}
                        {form[f.key] && !cities.some((c) => c.region_slug === form["region_slug"] && c.name_ar === form[f.key]) && (
                          <option value={form[f.key]}>{form[f.key]}</option>
                        )}
                      </select>
                    ) : f.type === "followers" ? (
                      <FollowersField
                        value={form[f.key]}
                        required={followersNeeded}
                        onChange={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                      />
                    ) : f.type === "branch" ? (
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3"
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value || null }))}
                      >
                        <option value="">مشترك بين الفروع</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}{b.city ? ` — ${b.city}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "boolean" ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(form[f.key])}
                          onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.checked }))}
                        />
                        <span className="text-sm">نعم</span>
                      </label>
                    ) : f.type === "textarea" ? (
                      <Textarea
                        required={f.required}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    ) : f.type === "select" ? (
                      <select
                        required={f.required}
                        className="h-10 w-full rounded-md border border-input bg-background px-3"
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      >
                        <option value="">اختر</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        required={f.required}
                        type={f.type ?? "text"}
                        min={f.type === "number" ? 0 : undefined}
                        step={f.type === "number" ? "any" : undefined}
                        dir={f.type === "url" || f.type === "email" ? "ltr" : undefined}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeEditor}>
                إلغاء
              </Button>
              <Button type="submit" variant="gold" disabled={saving}>
                {saving ? "جارٍ الحفظ…" : "حفظ"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
