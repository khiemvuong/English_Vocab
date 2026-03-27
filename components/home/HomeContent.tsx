"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LessonCard } from "@/components/home/LessonCard";
import { PracticeCard } from "@/components/home/PracticeCard";



const TABS = [
  { id: "vocab", label: "Từ Vựng", icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  )},
  { id: "part5", label: "Luyện Đề", icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  )},
] as const;

interface Part5Test {
  id: string;
  label: string;
  range: string;
  isAvailable: boolean;
  hasScenarios?: boolean;
}

interface HomeContentProps {
  part5Tests: Part5Test[];
  totalVocabLessons: number;
  availableVocabLessons: number[];
}

export function HomeContent({ part5Tests, totalVocabLessons, availableVocabLessons }: HomeContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const paramTab = searchParams.get("tab");
  
  const [activeTab, setActiveTab] = useState(paramTab === "part5" ? "part5" : "vocab");

  useEffect(() => {
    if (paramTab === "part5" || paramTab === "vocab") {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`${pathname}?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="min-h-dvh p-4 md:p-8 lg:p-12 max-w-5xl mx-auto flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-linear-to-b from-blue-400/20 via-indigo-400/10 to-transparent blur-3xl -z-10 pointer-events-none"></div>

      <header className="mb-10 text-center flex flex-col items-center mt-8 md:mt-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-blue-800 to-indigo-900 drop-shadow-sm mb-5 pb-1">
          TOEIC Mastery
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-base md:text-lg font-medium leading-relaxed">
          Ôn tập từ vựng và luyện đề TOEIC Part 5 với giải thích chi tiết.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex justify-center mb-10 relative z-10">
        <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200/80 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative z-10 pb-12">
        <div 
          style={{ display: activeTab === "vocab" ? "block" : "none" }}
          className="animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between mb-6 px-1">
            <p className="text-sm text-slate-400 font-medium">{totalVocabLessons} bài học từ vựng theo chủ đề Intensive Course</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: totalVocabLessons }, (_, i) => i + 1).map((lesson) => (
              <div key={lesson}>
                <LessonCard lesson={lesson} isAvailable={availableVocabLessons.includes(lesson)} />
              </div>
            ))}
          </div>
        </div>

        <div 
          style={{ display: activeTab === "part5" ? "block" : "none" }}
          className="animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between mb-6 px-1">
            <p className="text-sm text-slate-400 font-medium">{part5Tests.length} bộ đề Part 5 – mỗi bộ 30 câu với giải thích chi tiết</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {part5Tests.map((test) => (
              <div key={test.id}>
                <PracticeCard
                  testId={test.id}
                  testLabel={test.label}
                  questionRange={test.range}
                  isAvailable={test.isAvailable}
                  hasScenarios={test.hasScenarios}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
