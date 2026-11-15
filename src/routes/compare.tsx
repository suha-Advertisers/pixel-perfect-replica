import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "المقارنة بين المعلنين — دليل المعلنين" },
      { name: "description", content: "قارن بين عدة معلنين لاختيار الأنسب لحملتك." },
      { property: "og:title", content: "المقارنة بين المعلنين — دليل المعلنين" },
      { property: "og:description", content: "قارن بين عدة معلنين لاختيار الأنسب لحملتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  return (
    <div>
      <PageHeader title="المقارنة بين المعلنين" description="قارن بين عدة معلنين لاختيار الأنسب لحملتك." icon={Scale} />
      <SectionPreview
        phase={7}
        features={[
        "اختيار عدة معلنين للمقارنة",
        "المنطقة والمدينة وفئة المحتوى",
        "المتابعون لكل منصة وإجمالي المتابعين",
        "سعر الحضور وسعر المنزل",
        "إبراز الفروقات المهمة",
        "جدول واضح ومناسب للجوال",
        ]}
      />
    </div>
  );
}
