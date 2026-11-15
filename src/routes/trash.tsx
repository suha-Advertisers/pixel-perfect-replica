import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/trash")({
  head: () => ({
    meta: [
      { title: "سلة المحذوفات — دليل المعلنين" },
      { name: "description", content: "استعادة المعلنين والقوائم المحذوفة أو حذفها نهائياً." },
      { property: "og:title", content: "سلة المحذوفات — دليل المعلنين" },
      { property: "og:description", content: "استعادة المعلنين والقوائم المحذوفة أو حذفها نهائياً." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrashPage,
});

function TrashPage() {
  return (
    <div>
      <PageHeader title="سلة المحذوفات" description="استعادة المعلنين والقوائم المحذوفة أو حذفها نهائياً." icon={Trash2} />
      <SectionPreview
        phase={9}
        features={[
        "الحذف المؤقت مع حفظ السجل التاريخي",
        "اسم العنصر وتاريخ الحذف ومن قام به",
        "زر الاستعادة",
        "الحذف النهائي لمدير النظام فقط",
        "المحذوفات لا تظهر في نتائج البحث",
        ]}
      />
    </div>
  );
}
