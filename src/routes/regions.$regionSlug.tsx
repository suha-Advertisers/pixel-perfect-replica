import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Building2, ChevronLeft, MapPin, Users } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { SectionTitle } from "@/components/common/SectionTitle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findRegion } from "@/lib/regions";
import { cn } from "@/lib/utils";

type RegionSearch = { city?: string | undefined };

export const Route = createFileRoute("/regions/$regionSlug")({
  validateSearch: (search: Record<string, unknown>): RegionSearch => ({
    city: typeof search['city'] === "string" && search['city'] ? search['city'] : undefined,
  }),
  loader: ({ params }) => {
    const region = findRegion(params.regionSlug);
    if (!region) throw notFound();
    return { slug: region.slug, name: region.name };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} — دليل المعلنين` : "منطقة غير متاحة — دليل المعلنين";
    const description = loaderData
      ? `مدن وأحياء ${loaderData.name} والمعلنون في كل موقع.`
      : "المنطقة المطلوبة غير متاحة.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <EmptyState
      icon={MapPin}
      title="المنطقة غير موجودة"
      description="تعذر العثور على هذه المنطقة."
      action={
        <Link to="/regions" className="text-sm font-semibold text-primary">
          العودة إلى المناطق
        </Link>
      }
    />
  ),
  component: RegionPage,
});

function RegionPage() {
  const { regionSlug } = Route.useParams();
  const { city } = Route.useSearch();
  const region = findRegion(regionSlug)!;

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">الرئيسية</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/regions">مناطق المملكة</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {city ? (
              <BreadcrumbLink asChild>
                <Link to="/regions/$regionSlug" params={{ regionSlug }} search={{}}>
                  {region.name}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{region.name}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {city && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{city}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img
          src={region.image}
          alt={region.name}
          width={992}
          height={672}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-region" />
        <div className="relative flex min-h-[200px] flex-col justify-end p-6 text-ink-foreground sm:min-h-[240px] sm:p-8">
          <h1 className="text-3xl font-extrabold drop-shadow sm:text-4xl">{region.name}</h1>
          <p className="mt-1 text-sm opacity-90">
            {region.cities.length} مدينة ومنطقة فرعية
          </p>
        </div>
      </section>

      <section>
        <SectionTitle title="المدن والمناطق الفرعية" icon={Building2} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {region.cities.map((c) => {
            const active = c === city;
            return (
              <Link
                key={c}
                to="/regions/$regionSlug"
                params={{ regionSlug }}
                search={{ city: c }}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary",
                  active
                    ? "border-primary bg-primary-soft text-secondary-foreground"
                    : "border-border/70 bg-card",
                )}
              >
                <span className="truncate">{c}</span>
                <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle title={city ? `المعلنون في ${city}` : `المعلنون في ${region.name}`} icon={Users} />
        <EmptyState
          icon={Users}
          title="لا يوجد معلنون في هذا الموقع بعد"
          description="ستظهر بطاقات المعلنين هنا بعد ربط قاعدة البيانات في المراحل القادمة."
        />
      </section>
    </div>
  );
}
