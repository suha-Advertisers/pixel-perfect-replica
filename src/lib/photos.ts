import { supabase } from "@/integrations/supabase/client";

export const PHOTO_BUCKET = "advertiser-photos";

/** رابط عام للصورة المحفوظة في التخزين. */
export function photoUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** اسم حساب تيك توك من الرابط (tiktok.com/@name) أو من اسم المستخدم إن كانت المنصة تيك توك. */
export function tiktokHandle(row: {
  tiktok_url?: string | null;
  profile_url?: string | null;
  username?: string | null;
  platform?: string | null;
}): string | null {
  for (const u of [row.tiktok_url, row.profile_url]) {
    const m = (u ?? "").match(/tiktok\.com\/@([A-Za-z0-9._]+)/i);
    if (m) return m[1]!.replace(/\.+$/, "");
  }
  const isTikTok = /^tiktok/i.test((row.platform ?? "").trim());
  const user = (row.username ?? "").trim().replace(/^@/, "");
  return isTikTok && /^[A-Za-z0-9._]{2,24}$/.test(user) ? user : null;
}

export class RateLimitError extends Error {
  constructor() {
    super("rate-limit");
  }
}

/** يجلب صورة الحساب من unavatar. يرجع null إن لم توجد صورة. */
export async function fetchTikTokAvatar(handle: string): Promise<Blob | null> {
  const res = await fetch(`https://unavatar.io/tiktok/${encodeURIComponent(handle)}?fallback=false`, {
    cache: "no-store",
  });
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) return null;
  const blob = await res.blob();
  return blob.type.startsWith("image/") && blob.size > 200 ? blob : null;
}

/** يقصّ الصورة مربعة ويصغّرها إلى 256px بصيغة JPEG (≈ 15–30KB). */
export async function toSquareJpeg(blob: Blob, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.82),
  );
}
