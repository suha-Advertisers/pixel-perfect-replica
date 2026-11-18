/**
 * قراءة «عدد المتابعين» كما يكتبه المستخدم.
 * يقبل: 181600 — 181,600 — 181.6k — 1.2M — ٤٠ ألف — 181.6 (يُفهم بالآلاف).
 */
export type FollowersParse = { value: number | null; note?: string; error?: string };

const toLatin = (s: string) =>
  s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

export function parseFollowersInput(raw: string): FollowersParse {
  let s = toLatin(raw).trim().toLowerCase().replace(/\s+/g, "").replace(/\u066B/g, ".").replace(/\u066C/g, ",");
  if (!s) return { value: null };

  const m = s.match(/^([\d.,]+?)(k|m|ألف|الف|مليون)?$/);
  if (!m) return { value: null, error: "اكتب رقماً فقط، مثل 181600 أو 181.6k" };
  let num = m[1]!;
  const unit = m[2];

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(num)) num = num.replace(/,/g, "");
  else if (/^\d+,\d{1,2}$/.test(num)) num = num.replace(",", ".");
  else if (num.includes(",")) return { value: null, error: "صيغة الرقم غير صحيحة." };

  if (!/^\d+(\.\d+)?$/.test(num)) return { value: null, error: "صيغة الرقم غير صحيحة." };
  const n = parseFloat(num);
  if (!Number.isFinite(n) || n < 0) return { value: null, error: "عدد المتابعين لا يمكن أن يكون سالباً." };

  let mult = 1;
  let note: string | undefined;
  if (unit === "k" || unit === "ألف" || unit === "الف") mult = 1_000;
  else if (unit === "m" || unit === "مليون") mult = 1_000_000;
  else if (num.includes(".")) {
    if (n >= 1000) return { value: null, error: "اكتب رقماً صحيحاً (مثل 181600) أو بالآلاف (مثل 181.6)." };
    mult = 1_000;
    note = "فُهم بالآلاف";
  }

  const v = Math.round(n * mult);
  if (v > 2_000_000_000) return { value: null, error: "الرقم كبير جداً." };
  return note ? { value: v, note } : { value: v };
}
