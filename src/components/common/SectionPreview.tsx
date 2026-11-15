import { CircleDashed, Hammer } from "lucide-react";

/**
 * Honest placeholder for sections whose real data arrives in a later build phase.
 * Lists what the section will do so the menu is fully navigable in Phase 1.
 */
export function SectionPreview({ phase, features }: { phase: number; features: string[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col justify-between rounded-2xl bg-ink p-6 text-ink-foreground shadow-card">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            <Hammer className="size-3.5" />
            قيد البناء — المرحلة {phase}
          </span>
          <h2 className="mt-4 text-xl font-extrabold">هذا القسم جاهز في التصميم والتنقل</h2>
          <p className="mt-2 text-sm leading-relaxed opacity-80">
            سيتم ربطه بقاعدة البيانات وتفعيل الصلاحيات الخاصة به في المرحلة {phase}. لا تُعرض هنا أي بيانات
            تجريبية أو أرقام وهمية.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <h3 className="font-bold">ما الذي سيتضمنه هذا القسم</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <CircleDashed className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
