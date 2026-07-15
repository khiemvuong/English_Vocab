"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { useLessonProgressStore } from "@/store/lessonProgressStore";

interface MistakeReviewCardProps {
  href: string;
}

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
}

export function MistakeReviewCard({ href }: MistakeReviewCardProps) {
  const hasHydrated = useHasHydrated();
  const wrongCount = useLessonProgressStore((state) =>
    Object.entries(state.progress)
      .filter(([lessonId]) => lessonId.startsWith("part5-"))
      .reduce((total, [, progress]) => {
        const answeredCount = Object.keys(progress.answers).length;
        return total + Math.max(0, answeredCount - progress.score);
      }, 0)
  );
  const visibleWrongCount = hasHydrated ? wrongCount : 0;

  return (
    <Link
      href={href}
      className="group relative col-span-2 overflow-hidden rounded-4xl border border-amber-400/15 bg-amber-400/3 backdrop-blur-xl p-5 text-left shadow-[0_24px_80px_rgba(245,158,11,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/30 hover:bg-amber-400/8 lg:col-span-4"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-black/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">
              <RotateCcw className="h-3.5 w-3.5" />
              Ôn lỗi sai
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">Câu Part 5 đã làm sai</h3>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
          <div className="text-left md:text-right">
            <p className="text-4xl font-black tabular-nums text-white">{visibleWrongCount}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-100/60">câu cần ôn</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition-transform duration-300 group-hover:translate-x-1">
            Mở bộ ôn
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
