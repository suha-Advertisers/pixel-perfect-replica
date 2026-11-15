import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchX, Users } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionPreview } from "@/components/common/SectionPreview";

type AdvertisersSearch = { q?: string | undefined };

export const Route = createFileRoute("/advertisers")({
  validateSearch: (search: Record<string, unknown>): AdvertisersSearch => ({
    q: typeof search['q'] === "string" && search['q'].trim() ? search['q'].trim().slice(0, 100) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "جميع المعلنين — دليل المعلنين" },
      { name: "description", content: "ابحث في قاعدة المعلنين وصفّها حسب المنطقة والفئة والمتابعين والأسعار." },
      { property: "og:title", content: "جميع المعلنين — دليل المعلنين" },
      { property: "og:description", content: "ابحث وصفِّ المعلنين حسب المنطقة والفئة والأسعار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdvertisersPage,
});

function AdvertisersPage() {
  const { q } = Route.useSearch();

  return (
    <div className="space-y-8">
      <PageHeader
        title="جميع المعلنين"
        description="ابحث وصفِّ المعلنين حسب المنطقة والفئة والمتابعين والأسعار."
        icon={Users}
      />
      {q && (
        <EmptyState
          icon={SearchX}
          title={`لا توجد نتائج لـ «${q}»`}
          description="قاعدة المعلنين لم تُربط بعد، لذلك لا توجد نتائج للبحث حالياً."
          action={
            <Link to="/advertisers" className="text-sm font-semibold text-primary">
              مسح البحث
            </Link>
          }
        />
      )}
      <SectionPreview
        phase={3}
        features={[
          "البحث بالاسم الكامل أو جزء منه أو اسم المستخدم",
          "التصفية حسب المنطقة والمدينة والحي والجنس والفئة",
          "التصفية حسب المنصة وعدد المتابعين",
          "التصفية حسب سعر الحضور وسعر المنزل والضيافة والمجاني",
          "الترتيب حسب المتابعين أو السعر أو الأحدث",
          "تحميل تدريجي بالصفحات يناسب آلاف المعلنين",
        ]}
      />
    </div>
  );
}
