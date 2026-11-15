import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "الحملات — دليل المعلنين" },
      { name: "description", content: "إدارة الحملات الإعلانية وربطها بالمتاجر والعملاء." },
      { property: "og:title", content: "الحملات — دليل المعلنين" },
      { property: "og:description", content: "إدارة الحملات الإعلانية وربطها بالمتاجر والعملاء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  return (
    <div>
      <PageHeader title="الحملات" description="إدارة الحملات الإعلانية وربطها بالمتاجر والعملاء." icon={Megaphone} />
      <SectionPreview
        phase={7}
        features={[
        "إنشاء حملة وتحديد تواريخها",
        "ربط الحملة بمتجر أو عميل",
        "تسجيل أسعار المعلنين وقت الحملة وحفظها تاريخياً",
        "ملاحظات الحملة والحملات السابقة",
        "نجمة التعاون السابق خاصة بكل متجر على حدة",
        "تصدير بيانات الحملة إلى Excel",
        ]}
      />
    </div>
  );
}
