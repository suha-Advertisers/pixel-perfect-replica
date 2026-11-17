/** أدوات قراءة ملفات CSV وتنظيف قيم المعلنين (عربي/إنجليزي). */

export function toLatinDigits(s: string): string {
  return s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** قارئ CSV يدعم الحقول بين علامتي اقتباس، الفاصلة المنقوطة، التبويب، وBOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter =
    [",", ";", "\t"]
      .map((d) => [d, firstLine.split(d).length] as const)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const pushRow = () => {
    row.push(field);
    field = "";
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      pushRow();
    } else field += ch;
  }
  if (field !== "" || row.length) pushRow();
  return rows;
}

/** يحوّل 170.5k أو 1.2M أو «٤٠ ألف» أو 12,500 إلى رقم صحيح. */
export function parseFollowers(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const s = toLatinDigits(raw)
    .toLowerCase()
    .replace(/[\u066C,\s]/g, "")
    .replace("\u066B", ".");
  const m = s.match(/^(\d+(?:\.\d+)?)(k|m|ألف|الف|مليون)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]!);
  const unit = m[2];
  const mult =
    unit === "k" || unit === "ألف" || unit === "الف" ? 1_000 : unit === "m" || unit === "مليون" ? 1_000_000 : 1;
  const v = Math.round(n * mult);
  return Number.isFinite(v) && v >= 0 && v <= 2_000_000_000 ? v : null;
}

/** توحيد النص العربي للمقارنة: همزات، ياء، تاء مربوطة، تشكيل، وبادئة «منطقة». */
export function normalizeAr(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^منطقه\s+/, "");
}

/** مفتاح ثابت للرابط: بلا بروتوكول أو www أو معاملات التتبّع. */
export function urlKey(u: string): string {
  return u
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

const PLATFORMS: Record<string, string> = {
  tiktok: "TikTok",
  "تيك توك": "TikTok",
  "تيكتوك": "TikTok",
  snapchat: "Snapchat",
  snap: "Snapchat",
  "سناب شات": "Snapchat",
  "سناب": "Snapchat",
  instagram: "Instagram",
  "انستقرام": "Instagram",
  "إنستغرام": "Instagram",
  "انستغرام": "Instagram",
  x: "X",
  twitter: "X",
  "اكس": "X",
  "إكس": "X",
  "تويتر": "X",
  youtube: "YouTube",
  "يوتيوب": "YouTube",
};

export function normalizePlatform(raw: string): string {
  const k = raw.trim().toLowerCase();
  return PLATFORMS[k] ?? raw.trim();
}

/** اسم المنطقة من اسم الملف: «معلنين_غرب_الرياض (2).csv» ← «غرب الرياض». */
const FILE_STOP_WORDS = new Set(["معلنين", "معلنون", "المعلنين", "المعلنون", "ملف", "نسخة", "نسخه", "advertisers", "advertiser"]);
export function areaHintFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-.()\d]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !FILE_STOP_WORDS.has(w.toLowerCase()))
    .join(" ");
}
