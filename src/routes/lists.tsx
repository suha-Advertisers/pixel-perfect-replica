import { createFileRoute } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/lists")({
  head: () => ({
    meta: [
      { title: "قوائمي — دليل المعلنين" },
      { name: "description", content: "أنشئ قوائم المعلنين لحملاتك وأرسلها للإدارة للمراجعة." },
      { property: "og:title", content: "قوائمي — دليل المعلنين" },
      { property: "og:description", content: "أنشئ قوائم المعلنين لحملاتك وأرسلها للإدارة للمراجعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListsPage,
});

function ListsPage() {
  return (
    <div>
      <PageHeader title="قوائمي" description="أنشئ قوائم المعلنين لحملاتك وأرسلها للإدارة للمراجعة." icon={ListChecks} />
      <SectionPreview
        phase={6}
        features={[
        "إنشاء قوائم متعددة بأسماء مثل: حملة اليوم الوطني، حملة رمضان",
        "إضافة وإزالة المعلنين من مناطق ومدن مختلفة",
        "ملخص فوري: مجموع أسعار الحضور ومجموع أسعار المنزل كلٌّ على حدة",
        "عدّ حالات الضيافة والمجاني وغير المحدد دون إدخالها في المبالغ",
        "إعادة تسمية القائمة وحذفها",
        "إرسال القائمة إلى الإدارة",
        ]}
      />
    </div>
  );
}
