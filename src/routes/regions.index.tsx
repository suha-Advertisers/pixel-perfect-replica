import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { RegionCard } from "@/components/regions/RegionCard";
import { regions } from "@/lib/regions";

export const Route = createFileRoute("/regions/")({
  head: () => ({
    meta: [
      { title: "مناطق المملكة — دليل المعلنين" },
      { name: "description", content: "تصفح المعلنين حسب مناطق المملكة الثلاث عشرة ومدنها وأحيائها." },
      { property: "og:title", content: "مناطق المملكة — دليل المعلنين" },
      { property: "og:description", content: "تصفح المعلنين حسب المنطقة والمدينة والحي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegionsPage,
});

function RegionsPage() {
  return (
    <div>
      <PageHeader
        title="مناطق المملكة"
        description="اختر منطقة لعرض مدنها وأحيائها، ثم المعلنين في كل موقع."
        icon={MapPin}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {regions.map((region, i) => (
          <RegionCard key={region.slug} region={region} count={null} eager={i < 4} />
        ))}
      </div>
    </div>
  );
}
