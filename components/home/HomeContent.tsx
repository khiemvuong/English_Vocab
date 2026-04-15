"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LessonCard } from "@/components/home/LessonCard";
import { PracticeCard } from "@/components/home/PracticeCard";
import { Part6Card } from "@/components/home/Part6Card";
import { Ets2026Card } from "@/components/home/Ets2026Card";


const TABS = [
  {
    id: "vocab",
    label: "Từ Vựng",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    accent: "from-blue-500 to-indigo-600",
  },
  {
    id: "part5",
    label: "Part 5",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    accent: "from-amber-500 to-orange-600",
  },
  {
    id: "part6",
    label: "Part 6",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "ets2026",
    label: "ETS 2026",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    accent: "from-violet-500 to-purple-600",
  },
] as const;


interface Part5Test {
  id: string;
  label: string;
  range: string;
  isAvailable: boolean;
}

interface Part6Test {
  id: string;
  label: string;
  isAvailable: boolean;
}

interface Ets2026Test {
  id: string;
  label: string;
  isAvailable: boolean;
}

interface HomeContentProps {
  part5Tests: Part5Test[];
  part6Tests: Part6Test[];
  ets2026Tests: Ets2026Test[];
  totalVocabLessons: number;
  availableVocabLessons: number[];
}


function StatBadge({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/70 border border-slate-200/80 rounded-2xl shadow-sm backdrop-blur-sm">
      <span className="text-slate-400">{icon}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-extrabold text-slate-800 leading-none">{value}</span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

export function HomeContent({ part5Tests, part6Tests, ets2026Tests, totalVocabLessons, availableVocabLessons }: HomeContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const paramTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(
    paramTab === "part5" ? "part5" : paramTab === "part6" ? "part6" : paramTab === "ets2026" ? "ets2026" : "vocab"
  );

  useEffect(() => {
    if (paramTab === "part5" || paramTab === "vocab" || paramTab === "part6" || paramTab === "ets2026") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(paramTab);
    }
  }, [paramTab]);


  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`${pathname}?tab=${tabId}`, { scroll: false });
  };

  const availablePart5Count = part5Tests.filter((t) => t.isAvailable).length;
  const availablePart6Count = part6Tests.filter((t) => t.isAvailable).length;
  const activeTabData = TABS.find((t) => t.id === activeTab)!;


  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Decorative background — sits behind content via DOM order */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Top center blue/indigo glow */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[550px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse at center, rgba(147,197,253,0.45) 0%, rgba(165,180,252,0.25) 50%, transparent 75%)" }}
        />
        {/* Right amber accent */}
        <div
          className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(253,186,116,0.35) 0%, transparent 70%)" }}
        />
        {/* Bottom-left indigo accent */}
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(129,140,248,0.25) 0%, transparent 70%)" }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(100,116,139,0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16 flex flex-col">
        {/* ── Hero Header ── */}
        <header className="text-center mb-10 md:mb-14">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-5">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-blue-800 to-indigo-800">
              TOEIC Mastery
            </span>
            </h1>

          <p className="text-slate-500 max-w-lg mx-auto text-base md:text-lg font-medium leading-relaxed mb-8">
            Ôn tập từ vựng &amp; luyện đề TOEIC theo từng Part với&nbsp;
            <span className="text-slate-700 font-semibold">giải thích chi tiết</span> từng câu.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <StatBadge
              value={String(totalVocabLessons)}
              label="Bộ từ vựng"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                </svg>
              }
            />
            <StatBadge
              value={String(availablePart5Count)}
              label="Part 5"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              }
            />
            <StatBadge
              value={String(availablePart6Count)}
              label="Part 6"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <StatBadge
              value={`${availablePart5Count * 30 + availablePart6Count * 16}+`}
              label="Câu hỏi"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

        </header>

        {/* ── Tabs ── */}
        <div className="flex justify-center mb-8 md:mb-10 relative z-10">
          <div className="inline-flex bg-white/90 backdrop-blur-md rounded-2xl p-1.5 shadow-md border border-slate-200/80 gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-white shadow-lg"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {isActive && (
                    <span
                      className={`absolute inset-0 rounded-xl bg-linear-to-r ${tab.accent}`}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{tab.icon}</span>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="relative z-10 pb-16">
          {/* Subtitle bar */}
          <div className="flex items-center gap-2 mb-5 px-1">
            <div className={`w-1.5 h-5 rounded-full bg-linear-to-b ${activeTabData.accent}`} />
            <p className="text-sm text-slate-500 font-semibold">
              {activeTab === "vocab"
                ? `${totalVocabLessons} bài học từ vựng — Intensive Course`
                : activeTab === "part6"
                ? `${part6Tests.length} bộ đề Part 6 — Text Completion, giải thích chi tiết`
                : activeTab === "ets2026"
                ? `${ets2026Tests.length} đề ETS 2026 — 30 câu/đề, giải thích chi tiết`
                : `${part5Tests.length} bộ đề Part 5 — 30 câu/bộ, giải thích chi tiết`}
            </p>
          </div>


          {/* Vocab tab */}
          <div
            style={{ display: activeTab === "vocab" ? "block" : "none" }}
            className="animate-in fade-in duration-200"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: totalVocabLessons }, (_, i) => i + 1).map((lesson) => (
                <LessonCard key={lesson} lesson={lesson} isAvailable={availableVocabLessons.includes(lesson)} />
              ))}
            </div>
          </div>

          {/* Part5 tab */}
          <div
            style={{ display: activeTab === "part5" ? "block" : "none" }}
            className="animate-in fade-in duration-200"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {part5Tests.map((test) => (
                <PracticeCard
                  key={test.id}
                  testId={test.id}
                  testLabel={test.label}
                  questionRange={test.range}
                  isAvailable={test.isAvailable}
                />
              ))}
            </div>
          </div>

          {/* Part6 tab */}
          <div
            style={{ display: activeTab === "part6" ? "block" : "none" }}
            className="animate-in fade-in duration-200"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {part6Tests.map((test) => (
                <Part6Card
                  key={test.id}
                  testId={test.id}
                  testLabel={test.label}
                  isAvailable={test.isAvailable}
                />
              ))}
            </div>
          </div>

          {/* ETS 2026 tab */}
          <div
            style={{ display: activeTab === "ets2026" ? "block" : "none" }}
            className="animate-in fade-in duration-200"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {ets2026Tests.map((test) => (
                <Ets2026Card
                  key={test.id}
                  testId={test.id}
                  testLabel={test.label}
                  isAvailable={test.isAvailable}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
