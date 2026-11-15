import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "سجل النشاطات — دليل المعلنين" },
      { name: "description", content: "سجل آمن لكل الإجراءات الحساسة لا يمكن تعديله." },
      { property: "og:title", content: "سجل النشاطات — دليل المعلنين" },
      { property: "og:description", content: "سجل آمن لكل الإجراءات الحساسة لا يمكن تعديله." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <div>
      <PageHeader title="سجل النشاطات" description="سجل آمن لكل الإجراءات الحساسة لا يمكن تعديله." icon={History} />
      <SectionPreview
        phase={9}
        features={[
        "تسجيل الدخول والمحاولات الفاشلة",
        "إضافة وتعديل وحذف المعلنين وتغيير الأسعار",
        "عمليات الاستيراد والتصدير",
        "إنشاء وإرسال القوائم والحملات",
        "تغيير الصلاحيات وإدارة الأجهزة",
        "محاولات الوصول المرفوضة",
        ]}
      />
    </div>
  );
}
