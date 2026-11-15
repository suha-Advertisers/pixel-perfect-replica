import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير والإحصائيات — دليل المعلنين" },
      { name: "description", content: "أرقام حقيقية من قاعدة البيانات عن المعلنين والحملات." },
      { property: "og:title", content: "التقارير والإحصائيات — دليل المعلنين" },
      { property: "og:description", content: "أرقام حقيقية من قاعدة البيانات عن المعلنين والحملات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div>
      <PageHeader title="التقارير والإحصائيات" description="أرقام حقيقية من قاعدة البيانات عن المعلنين والحملات." icon={BarChart3} />
      <SectionPreview
        phase={8}
        features={[
        "المعلنون حسب المنطقة والمدينة والفئة والجنس",
        "توزيع المتابعين والأسعار",
        "إحصائيات الحملات",
        "سجل الإعلانات لكل متجر أو عميل",
        "الأكثر اختياراً وأحدث المضافين",
        "تصدير التقارير",
        ]}
      />
    </div>
  );
}
