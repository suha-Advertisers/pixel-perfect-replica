import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/list-requests")({
  head: () => ({
    meta: [
      { title: "طلبات القوائم — دليل المعلنين" },
      { name: "description", content: "القوائم المرسلة من المستخدمين بانتظار المراجعة." },
      { property: "og:title", content: "طلبات القوائم — دليل المعلنين" },
      { property: "og:description", content: "القوائم المرسلة من المستخدمين بانتظار المراجعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListRequestsPage,
});

function ListRequestsPage() {
  return (
    <div>
      <PageHeader title="طلبات القوائم" description="القوائم المرسلة من المستخدمين بانتظار المراجعة." icon={Inbox} />
      <SectionPreview
        phase={6}
        features={[
        "إشعار عند وصول قائمة جديدة",
        "عرض اسم القائمة ومنشئها والمتجر وتاريخ الإرسال",
        "مراجعة المعلنين وروابطهم ومتابعيهم وأسعارهم",
        "الموافقة أو الرفض مع ملاحظات داخلية",
        "سجل كامل للطلبات والإجراءات",
        "تصدير القائمة إلى Excel باسم ملف تختاره",
        ]}
      />
    </div>
  );
}
