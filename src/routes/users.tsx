import { createFileRoute } from "@tanstack/react-router";
import { UserCog } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "المستخدمون — دليل المعلنين" },
      { name: "description", content: "دعوة المستخدمين وإدارة الأدوار والصلاحيات والأجهزة." },
      { property: "og:title", content: "المستخدمون — دليل المعلنين" },
      { property: "og:description", content: "دعوة المستخدمين وإدارة الأدوار والصلاحيات والأجهزة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  return (
    <div>
      <PageHeader title="المستخدمون" description="دعوة المستخدمين وإدارة الأدوار والصلاحيات والأجهزة." icon={UserCog} />
      <SectionPreview
        phase={4}
        features={[
        "لا يوجد تسجيل عام — الدعوة من مدير النظام فقط",
        "أدوار افتراضية وأدوار مخصصة بصلاحيات فردية",
        "ربط المستخدم بمتجر أو عميل",
        "تفعيل وإيقاف الحسابات",
        "عرض الأجهزة الموثوقة وإلغاء الجلسات",
        "سجل الدخول ونشاط كل مستخدم",
        ]}
      />
    </div>
  );
}
