import { describe, expect, it } from "vitest";

import { parseFollowersInput } from "@/lib/followers";

describe("parseFollowersInput", () => {
  it("accepts the formats people actually type", () => {
    expect(parseFollowersInput("181600").value).toBe(181600);
    expect(parseFollowersInput("181,600").value).toBe(181600);
    expect(parseFollowersInput("181.6k").value).toBe(181600);
    expect(parseFollowersInput("1.2M").value).toBe(1200000);
    expect(parseFollowersInput("٤٠ ألف").value).toBe(40000);
  });
  it("understands a bare decimal as thousands", () => {
    const r = parseFollowersInput("181.6");
    expect(r.value).toBe(181600);
    expect(r.note).toBeTruthy();
  });
  it("rejects garbage and negatives, allows empty", () => {
    expect(parseFollowersInput("abc").error).toBeTruthy();
    expect(parseFollowersInput("-5").error).toBeTruthy();
    expect(parseFollowersInput("1234.5").error).toBeTruthy();
    expect(parseFollowersInput("").value).toBeNull();
  });
});
