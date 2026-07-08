"use client";

import Link from "next/link";

export function WritingPracticeCard() {
  return (
    <Link
      href="/writing-practice"
      className="group block p-5 bg-slate-900/50 hover:bg-slate-900/80 border border-white/10 hover:border-violet-500/30 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/10"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
          <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-base group-hover:text-violet-200 transition-colors">
              Luyện Viết Câu Mô Tả Tranh
            </h3>
            <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs font-semibold rounded-full border border-violet-500/20 shrink-0">
              TOEIC Writing Q1-5
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            Luyện tập 40 câu theo 6 kỹ năng: thì động từ, giới từ, liên từ, từ chỉ mức độ, ghép câu và tiêu chí chấm điểm.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              40 câu hỏi
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              6 kỹ năng
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              5 chủ đề
            </span>
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-5 h-5 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
