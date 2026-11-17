import { useEffect } from "react";

/**
 * ردع تصوير الشاشة ونسخ المحتوى.
 * تنبيه: المتصفحات لا تستطيع منع لقطة الشاشة من نظام الجوال/الكمبيوتر فعلياً، لذلك:
 *  1) إخفاء المحتوى عند مغادرة الصفحة أو الضغط على PrintScreen/الطباعة/الحفظ.
 *  2) منع القائمة اليمنى والنسخ والسحب خارج حقول الإدخال، ومنع الطباعة.
 */
const isField = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

export function ScreenGuard() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("guard-active");
    let timer: ReturnType<typeof setTimeout> | undefined;

    const hide = (ms = 0) => {
      root.classList.add("screen-hidden");
      if (timer) clearTimeout(timer);
      if (ms > 0) timer = setTimeout(() => root.classList.remove("screen-hidden"), ms);
    };
    const show = () => {
      if (timer) clearTimeout(timer);
      root.classList.remove("screen-hidden");
    };

    const onVisibility = () => (document.visibilityState === "hidden" ? hide() : show());
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        void navigator.clipboard?.writeText("").catch(() => undefined);
        hide(1500);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "PrintScreen") hide(1500);
      if (mod && (k === "p" || k === "s" || k === "u")) {
        e.preventDefault();
        hide(1200);
      }
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(k)) hide(1500);
      if (e.key === "F12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k))) e.preventDefault();
    };
    const block = (e: Event) => {
      if (!isField(e.target)) e.preventDefault();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    for (const ev of ["contextmenu", "copy", "cut", "dragstart", "selectstart"]) document.addEventListener(ev, block);
    const onBeforePrint = () => hide();
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", show);

    return () => {
      root.classList.remove("guard-active", "screen-hidden");
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
      for (const ev of ["contextmenu", "copy", "cut", "dragstart", "selectstart"]) document.removeEventListener(ev, block);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", show);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
