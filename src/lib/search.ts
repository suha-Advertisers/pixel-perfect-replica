/** بحث عربي متسامح: يوحّد الهمزات والياء والتاء المربوطة ويتجاهل التشكيل، وكل كلمة مكتوبة يجب أن تظهر. */
export function normalizeSearch(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function queryTokens(query: string): string[] {
  return normalizeSearch(query).split(" ").filter(Boolean);
}

export function matchesTokens(haystack: string, tokens: string[]): boolean {
  if (!tokens.length) return true;
  const text = normalizeSearch(haystack);
  return tokens.every((t) => text.includes(t));
}
