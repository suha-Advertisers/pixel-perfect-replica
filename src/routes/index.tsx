import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Flame,
  LayoutGrid,
  MapPin,
  Megaphone,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import heroImage from "@/assets/hero-studio.jpg";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";
import { RegionCard } from "@/components/regions/RegionCard";
import { Button } from "@/components/ui/button";
import { regions } from "@/lib/regions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الرئيسية — دليل المعلنين" },
      { name: "description", content: "لوحة دليل المعلنين: تصفح مناطق المملكة واعثر على المعلنين المناسبين لحملتك." },
      { property: "og:title", content: "الرئيسية — دليل المعلنين" },
      { property: "og:description", content: "تصفح مناطق المملكة واعثر على المعلنين المناسبين لحملتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img
          src={heroImage}
          alt=""
          width={1920}
          height={640}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center text-ink-foreground sm:min-h-[260px]">
          <Sparkles className="mb-2 size-6 text-primary" />
          <h1 className="text-balance text-2xl font-extrabold drop-shadow-md sm:text-4xl">
            كل ما تحتاجه لإيجاد المعلنين المناسبين
          </h1>
          <p className="mt-2 text-sm opacity-95 drop-shadow sm:text-lg">
            في جميع مناطق المملكة بسهولة واحترافية
          </p>
          <Button asChild variant="gold" size="lg" className="mt-6">
            <Link to="/regions">
              ابدأ الاستكشاف
              <ArrowLeft />
            </Link>
          </Button>
        </div>
      </section>

      {/* Regions */}
      <section>
        <SectionTitle
          title="مناطق المملكة"
          icon={MapPin}
          action={
            <Link to="/regions" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
              عرض الكل
              <ArrowLeft className="size-4" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {regions.slice(0, 12).map((region, i) => (
            <RegionCard key={region.slug} region={region} count={null} eager={i < 4} />
          ))}
        </div>
      </section>

      {/* Stats + CTA */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-gold-soft p-5 shadow-soft sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-extrabold">ابدأ بحملة جديدة</h3>
              <p className="mt-1 text-xs leading-relaxed text-secondary-foreground/80">
                اختر المعلنين المناسبين وساعدنا في نجاح حملتك
              </p>
            </div>
            <Star className="size-8 shrink-0 text-primary" strokeWidth={1.6} />
          </div>
          <Button asChild variant="default" size="sm" className="mt-4 rounded-full bg-ink text-ink-foreground hover:bg-ink/90">
            <Link to="/lists">إنشاء قائمة جديدة</Link>
          </Button>
        </div>
        <StatCard label="إجمالي المعلنين" value={null} icon={Users} tone="ink" />
        <StatCard label="مناطق رئيسية" value={regions.length} icon={LayoutGrid} tone="sage" />
        <StatCard label="حملة إعلانية" value={null} icon={Megaphone} tone="gold" />
        <StatCard label="معلن جديد هذا الشهر" value={null} icon={TrendingUp} tone="gold" prefix="+" />
      </section>

      {/* Latest advertisers */}
      <section>
        <SectionTitle
          title="أحدث المعلنين"
          icon={Flame}
          action={
            <Link to="/advertisers" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
              عرض الكل
              <ArrowLeft className="size-4" />
            </Link>
          }
        />
        <EmptyState
          icon={Users}
          title="لا يوجد معلنون بعد"
          description="ستظهر هنا أحدث بطاقات المعلنين بعد ربط قاعدة البيانات وإضافة المعلنين أو استيرادهم من ملف Excel."
        />
      </section>
    </div>
  );
}
