import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { allNav } from "@/lib/navigation";
import { regions } from "@/lib/regions";
import { routeTree } from "@/routeTree.gen";

const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
const leaf = (path: string) => router.matchRoutes(path).at(-1)?.routeId;

describe("sidebar navigation", () => {
  it("has the 13 menu items from the brief", () => {
    expect(allNav).toHaveLength(13);
  });

  it.each(allNav.map((n) => [n.title, n.to]))("%s opens a real page", (_title, to) => {
    expect(leaf(to)).not.toBe(rootRouteId);
  });
});

describe("regions", () => {
  it("lists the 13 regions of the Kingdom", () => {
    expect(regions).toHaveLength(13);
  });

  it("offers the five Riyadh subdivisions", () => {
    const riyadh = regions.find((r) => r.slug === "riyadh")!;
    for (const part of ["شمال الرياض", "جنوب الرياض", "شرق الرياض", "غرب الرياض", "وسط الرياض"]) {
      expect(riyadh.cities).toContain(part);
    }
  });
});
