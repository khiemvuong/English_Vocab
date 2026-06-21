import type { ReactNode } from "react";

interface PracticeSectionProps {
  title: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
}

export function PracticeSection({ title, description, eyebrow, children }: PracticeSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-300/80">
              {eyebrow}
            </p>
          )}
          <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">{title}</h2>
        </div>
        <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-400 sm:text-right">
          {description}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">{children}</div>
    </section>
  );
}
