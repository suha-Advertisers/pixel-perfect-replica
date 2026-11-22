import { describe, expect, it } from "vitest";

import { matchesTokens, queryTokens } from "@/lib/search";

describe("arabic search", () => {
  it("ignores hamza, taa marbuta and diacritics", () => {
    expect(matchesTokens("أحمد الدليلة", queryTokens("احمد"))).toBe(true);
    expect(matchesTokens("بنات غرب الرياض", queryTokens("غرب الرياض"))).toBe(true);
    expect(matchesTokens("الدليله | بكر عادل", queryTokens("الدليلة"))).toBe(true);
  });
  it("needs every typed word, in any order", () => {
    expect(matchesTokens("بكر عادل الدليله", queryTokens("عادل بكر"))).toBe(true);
    expect(matchesTokens("بنات غرب الرياض", queryTokens("بكر"))).toBe(false);
  });
  it("empty query matches everything", () => {
    expect(matchesTokens("أي شيء", queryTokens(""))).toBe(true);
  });
});
