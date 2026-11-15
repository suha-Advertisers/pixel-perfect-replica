import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "استيراد Excel — دليل المعلنين" },
      { name: "description", content: "استيراد المعلنين من ملفات XLSX وXLS وCSV مع كشف التكرار." },
      { property: "og:title", content: "استيراد Excel — دليل المعلنين" },
      { property: "og:description", content: "استيراد المعلنين من ملفات XLSX وXLS وCSV مع كشف التكرار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  return (
    <div>
      <PageHeader title="استيراد Excel" description="استيراد المعلنين من ملفات XLSX وXLS وCSV مع كشف التكرار." icon={FileSpreadsheet} />
      <SectionPreview
        phase={5}
        features={[
        "رفع الملف ومعاينة البيانات",
        "مطابقة الأعمدة والتحقق من الحقول",
        "كشف التكرار بروابط حسابات التواصل بعد توحيدها",
        "عرض الحقول المتعارضة وتحديث المعلن الموجود",
        "حفظ أرقام الجوال كنص للحفاظ على الصفر",
        "تقرير: المضاف، المحدّث، المكرر، الفاشل",
        ]}
      />
    </div>
  );
}
