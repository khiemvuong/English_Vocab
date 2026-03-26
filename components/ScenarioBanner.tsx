"use client";

import Link from "next/link";

export function ScenarioBanner({ testId }: { testId: string }) {
  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-60 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href={`/part5/${testId}/scenarios`}
        className="flex items-center gap-2.5 px-4 md:px-5 py-3 md:py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full shadow-2xl shadow-amber-500/30 transition-all hover:-translate-y-1 active:scale-95 border-2 border-white/20"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-sm">Học Từ Vựng Tình Huống</span>
      </Link>
    </div>
  );
}
