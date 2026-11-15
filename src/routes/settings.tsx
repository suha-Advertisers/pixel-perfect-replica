import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — دليل المعلنين" },
      { name: "description", content: "إدارة المناطق والمدن والأحياء والفئات وإعدادات الأمان." },
      { property: "og:title", content: "الإعدادات — دليل المعلنين" },
      { property: "og:description", content: "إدارة المناطق والمدن والأحياء والفئات وإعدادات الأمان." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <PageHeader title="الإعدادات" description="إدارة المناطق والمدن والأحياء والفئات وإعدادات الأمان." icon={Settings} />
      <SectionPreview
        phase={4}
        features={[
        "إضافة وتعديل المناطق والمدن والأحياء",
        "فئات المحتوى ومنصات التواصل",
        "مدة صلاحية الجلسات والأجهزة الموثوقة",
        "حالة النسخ الاحتياطي وطريقة الاستعادة",
        "إعدادات المتاجر والعملاء",
        ]}
      />
    </div>
  );
}
