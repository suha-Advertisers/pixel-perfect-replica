import { describe, expect, it } from "vitest";

import { areaHintFromFileName, normalizeAr, parseCsv, parseFollowers, urlKey } from "@/lib/csv";

describe("parseFollowers", () => {
  it("reads k/m suffixes and Arabic digits", () => {
    expect(parseFollowers("170.5k")).toBe(170500);
    expect(parseFollowers("40K")).toBe(40000);
    expect(parseFollowers("1.2m")).toBe(1200000);
    expect(parseFollowers("١٢٬٥٠٠")).toBe(12500);
    expect(parseFollowers("")).toBeNull();
    expect(parseFollowers("abc")).toBeNull();
  });
});

describe("parseCsv", () => {
  it("handles BOM, quoted commas and CRLF", () => {
    const rows = parseCsv('\uFEFFa,b,c\r\n"x, y",2,"he said ""hi"""\r\n');
    expect(rows).toEqual([["a", "b", "c"], ["x, y", "2", 'he said "hi"']]);
  });
});

describe("areas and urls", () => {
  it("derives the area from the file name", () => {
    expect(areaHintFromFileName("معلنين_غرب_الرياض__2_.csv")).toBe("غرب الرياض");
  });
  it("normalizes arabic names", () => {
    expect(normalizeAr("منطقة الرياض")).toBe(normalizeAr("الرياض"));
  });
  it("drops tracking params from urls", () => {
    expect(urlKey("https://www.tiktok.com/@a?_r=1&_t=x")).toBe("tiktok.com/@a");
  });
});
