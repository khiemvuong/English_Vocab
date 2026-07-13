"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { BookOpen, FileText, LayoutList, CheckCircle, Pencil } from "lucide-react";
import { WritingLessonCard } from "@/components/home/WritingLessonCard";
import { Writing67LessonCard } from "@/components/home/Writing67LessonCard";
import { LessonCard } from "@/components/home/LessonCard";
import { PracticeCard } from "@/components/home/PracticeCard";
import { Part6Card } from "@/components/home/Part6Card";
import { Ets2026Card } from "@/components/home/Ets2026Card";
import { MistakeReviewCard } from "@/components/home/MistakeReviewCard";
import { PracticeSection } from "@/components/home/PracticeSection";
import { GlassFilter } from "@/components/ui/liquid-glass";
import { GuidedTour, GuidedTourStep } from "@/components/common/GuidedTour";
import { WRITING_Q15_LESSONS, WRITING_Q67_LESSONS } from "@/lib/writingLessonCatalog";

const HomeMeshBackground = dynamic(() => import("@/components/home/HomeMeshBackground").then((m) => m.HomeMeshBackground), {
  ssr: false,
});

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-950" />
});

const createSplineMouseMove = (event: React.PointerEvent<HTMLDivElement>) => (
  new MouseEvent("mousemove", {
    bubbles: true,
    cancelable: true,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
  })
);


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
    label: "Part 5 + ETS",
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
    id: "writing",
    label: "Luyện Viết",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

const TOUR_STEPS: GuidedTourStep[] = [
  {
    targetId: "tab-vocab",
    title: "Chương trình học đa dạng",
    description: "Chọn các thẻ tab ở đây để chuyển đổi qua lại giữa học Từ vựng, luyện đề Part 5 & ETS, Part 6 hoặc Luyện Viết.",
    placement: "bottom"
  },
  {
    targetId: "vocab-lesson-1",
    title: "Bắt đầu bài học đầu tiên",
    description: "Nhấp vào ô bài học này để bắt đầu học từ vựng trực quan với hình ảnh sinh động và phát âm tự động.",
    placement: "top"
  }
];

export function HomeContent({ part5Tests, part6Tests, ets2026Tests, totalVocabLessons, availableVocabLessons }: HomeContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const paramTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(
    paramTab === "part5" || paramTab === "ets2026" ? "part5" : paramTab === "part6" ? "part6" : paramTab === "writing" ? "writing" : "vocab"
  );
  const [isDesktopHero, setIsDesktopHero] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setIsDesktopHero(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (paramTab === "part5" || paramTab === "ets2026" || paramTab === "vocab" || paramTab === "part6" || paramTab === "writing") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(paramTab === "ets2026" ? "part5" : paramTab);
    }
  }, [paramTab]);


  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`${pathname}?tab=${tabId}`, { scroll: false });
  };

  const forwardTapToSpline = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDesktopHero) {
      return;
    }

    const canvas = document.querySelector<HTMLCanvasElement>("canvas");

    if (!canvas) {
      window.dispatchEvent(createSplineMouseMove(event));
      return;
    }

    canvas.dispatchEvent(createSplineMouseMove(event));
  }, [isDesktopHero]);

  const getTabInfo = (id: string) => {
    switch (id) {
      case "vocab":
        return {
          icon: <BookOpen className="w-5 h-5" />,
          description: `${totalVocabLessons} bài học từ vựng — Intensive Course`,
        };
      case "part5":
        return {
          icon: <LayoutList className="w-5 h-5" />,
          description: `${part5Tests.length + ets2026Tests.length} bộ Part 5 & ETS 2026`,
        };
      case "part6":
        return {
          icon: <FileText className="w-5 h-5" />,
          description: `${part6Tests.length} bộ đề Text Completion`,
        };
      case "ets2026":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          description: `${ets2026Tests.length} đề thi mới nhất từ ETS`,
        };
      case "writing":
        return {
          icon: <Pencil className="w-5 h-5" />,
          description: "TOEIC Writing Q1-5 và Q6-7",
        };
      default:
        return {
          icon: <BookOpen className="w-5 h-5" />,
          description: "",
        };
    }
  };

  return (
    <div
      className="min-h-dvh relative overflow-hidden w-full bg-black flex flex-col justify-between"
      onPointerDown={isDesktopHero ? forwardTapToSpline : undefined}
    >
      {isDesktopHero ? <HomeMeshBackground /> : null}
      <GlassFilter />
      
      {/* ── Hero Section Wrapper (Stable Height, Holds centered Spline Robot) ── */}
      <div className="relative w-full min-h-[80vh] lg:min-h-[85vh] flex flex-col justify-between">
        
        {/* ── Seamless Center-Top Spline Robot Background (Anchored to Hero wrapper) ── */}
        {isDesktopHero ? (
          <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none select-none">
            <div className="w-[900px] h-[900px] sm:w-[1100px] sm:h-[1100px] lg:w-[1400px] lg:h-[1400px] opacity-75 shrink-0 scale-120 sm:scale-125 lg:scale-130 translate-y-[-2%] sm:translate-y-[-4%] lg:translate-y-[-5%] translate-x-[-1.5%] sm:translate-x-[-2%] lg:translate-x-[-2.5%] transition-all duration-500 flex justify-center items-center">
              <Spline scene="https://prod.spline.design/Hoc-5P8xfjMh7imC/scene.splinecode" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 top-0 z-0 h-[48vh] min-h-[320px] max-h-[420px] pointer-events-none select-none overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-black via-black/88 via-52% to-black/28" />
            <div className="absolute inset-y-0 w-full max-w-full">
              <Image
                alt="TOEIC Mastery robot"
                className="object-contain object-right"
                fill
                priority
                sizes="100vw"
                src="https://ik.imagekit.io/khiemvuong123/bg.jpeg"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-black" />
          </div>
        )}

        {/* ── Hero Content (Max width container) ── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-10 flex flex-col flex-1 justify-between">
          
          {/* Main Title Layout */}
          {/* Mobile Unified Layout */}
          <div className="w-full flex flex-col items-start text-left md:hidden pointer-events-none select-none mt-1 z-10 relative min-h-[34vh] justify-start">
            <div className="max-w-[52vw] min-w-0">
              <h1 className="text-4xl font-black tracking-[-0.08em] uppercase leading-[0.9] drop-shadow-[0_10px_25px_rgba(0,0,0,0.92)]">
                <span className="block text-white">TOEIC</span>
                <span className="block bg-linear-to-br from-white via-white to-zinc-400 bg-clip-text text-transparent">MASTERY</span>
              </h1>
              <p className="text-zinc-300 text-[11px] font-medium mt-3 max-w-[30ch] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] leading-relaxed">
                Học từ vựng &amp; ngữ pháp gọn, rõ và đủ lực để luyện TOEIC thực chiến mỗi ngày.
              </p>
            </div>
          </div>

          {/* Desktop Split Layout */}
          <div className="hidden md:flex w-full flex-row justify-between items-center pointer-events-none select-none gap-0 mt-4 md:mt-8 z-10 relative">
            {/* Left Title */}
            <div className="w-[34%] lg:w-[32%] text-left flex flex-col justify-center items-start pl-2 lg:pl-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] uppercase">
                TOEIC
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base font-medium mt-4 max-w-xs drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-relaxed">
                Học tiếng Anh thông minh với giao diện đột phá. Ôn luyện từ vựng &amp; ngữ pháp hiệu quả.
              </p>
            </div>
            
            {/* Center Spacer for breathing room */}
            <div className="w-[32%] lg:w-[36%]" />

            {/* Right Title */}
            <div className="w-[34%] lg:w-[32%] text-right flex flex-col justify-center items-end pr-2 lg:pr-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter bg-linear-to-br from-white via-white to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] uppercase">
                MASTERY
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base font-medium mt-4 max-w-xs drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-relaxed">
                Luyện đề thi TOEIC thực chiến với giải thích chi tiết đáp án từng câu hỏi.
              </p>
            </div>
          </div>

          {/* Horizontal Click-Based Menu Cards under robot's feet */}
          <div className="w-full mt-12 md:mt-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const info = getTabInfo(tab.id);
                
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => handleTabChange(tab.id)}
                    className={`group relative overflow-hidden rounded-2xl p-5 md:p-6 text-left transition-all duration-300 backdrop-blur-xl cursor-pointer border select-none w-full
                      ${isActive 
                        ? 'bg-white/10 border-white/25 shadow-[0_8px_32px_rgba(255,255,255,0.05)] ring-2 ring-white/5' 
                        : 'bg-white/3 border-white/5 hover:border-white/15 hover:bg-white/8 shadow-lg'
                      }`}
                  >
                    {/* Card Glow Effect */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-white/5 blur-xl pointer-events-none transition-all duration-300 group-hover:scale-150" />
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl transition-all duration-300
                        ${isActive 
                          ? 'bg-white text-slate-950 scale-110 shadow-md shadow-white/5' 
                          : 'bg-white/5 text-white/70 group-hover:text-white'
                        }`}
                      >
                        {info.icon}
                      </div>
                      {isActive && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
                      {tab.label}
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* ── Tab Content ── */}
      <div className="relative z-10 pb-16 max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full">
        {/* Subtitle bar */}
        <div className="flex items-center gap-2 mb-5 px-1">
          <div className="w-1.5 h-5 rounded-full bg-white/60" />
          <p className="text-sm text-slate-500 font-semibold">
              {activeTab === "vocab"
                ? `${totalVocabLessons} bài học từ vựng — Intensive Course`
                : activeTab === "part6"
                ? `${part6Tests.length} bộ đề Part 6 — Text Completion, giải thích chi tiết`
                : activeTab === "writing"
                ? "TOEIC Writing Q1-5 và Q6-7"
                : `${part5Tests.length} bộ Part 5 + ${ets2026Tests.length} đề ETS 2026 — có ôn lỗi sai`}
            </p>
          </div>


          {/* Vocab tab */}
          <div
            style={{ display: activeTab === "vocab" ? "block" : "none" }}
            className="animate-in fade-in duration-200"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: totalVocabLessons }, (_, i) => i + 1).map((lesson) => (
                <div key={lesson} id={lesson === 1 ? "vocab-lesson-1" : undefined} className="w-full">
                  <LessonCard lesson={lesson} isAvailable={availableVocabLessons.includes(lesson)} />
                </div>
              ))}
            </div>
          </div>

          {/* Part5 + ETS tab */}
          <div
            style={{ display: activeTab === "part5" ? "block" : "none" }}
            className="animate-in fade-in duration-200"
          >
            <div className="space-y-10">
              <PracticeSection
                eyebrow="Review"
                title="Ôn lỗi sai Part 5"
                description="Một khu vực nhỏ để gọi lại các câu bạn từng chọn sai trong Part 5."
              >
                <MistakeReviewCard href="/part5/mistakes" />
              </PracticeSection>

              <PracticeSection
                eyebrow="Core drills"
                title="Part 5 Practice"
                description="Các bộ Incomplete Sentences tiêu chuẩn, phù hợp để luyện tốc độ và nền tảng ngữ pháp."
              >
                {part5Tests.map((test) => (
                  <PracticeCard
                    key={test.id}
                    testId={test.id}
                    testLabel={test.label}
                    questionRange={test.range}
                    isAvailable={test.isAvailable}
                  />
                ))}
              </PracticeSection>

              <PracticeSection
                eyebrow="Exam mode"
                title="ETS 2026"
                description="Các đề Part 5 theo format ETS 2026."
              >
                {ets2026Tests.map((test) => (
                  <Ets2026Card
                    key={test.id}
                    testId={test.id}
                    testLabel={test.label}
                    isAvailable={test.isAvailable}
                  />
                ))}
              </PracticeSection>
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

          {/* Writing Practice tab */}
          <div
            style={{ display: activeTab === "writing" ? "block" : "none" }}
            className="animate-in fade-in duration-200"
          >
            <div className="space-y-10">
              <PracticeSection
                eyebrow="Email response"
                title="TOEIC Writing Q6-7"
                description="Luyện trả lời email theo luồng từ vựng, dịch nghĩa, task map, mẫu câu và tự viết."
              >
                {WRITING_Q67_LESSONS.map((lesson) => (
                  <Writing67LessonCard
                    key={lesson.file}
                    file={lesson.file}
                    tagLabel={lesson.tagLabel}
                    mainTitle={lesson.mainTitle}
                    subtitle={lesson.subtitle}
                    totalPrompts={lesson.totalPrompts}
                    colorTheme={lesson.colorTheme}
                  />
                ))}
              </PracticeSection>

              <PracticeSection
                eyebrow="Picture description"
                title="TOEIC Writing Q1-5"
                description="Luyện viết câu mô tả tranh theo từng chủ đề và kỹ năng."
              >
                {WRITING_Q15_LESSONS.map((lesson) => (
                  <WritingLessonCard
                    key={lesson.file}
                    file={lesson.file}
                    tagLabel={lesson.tagLabel}
                    mainTitle={lesson.mainTitle}
                    totalQuestions={lesson.totalQuestions}
                    colorTheme={lesson.colorTheme}
                  />
                ))}
              </PracticeSection>
            </div>
          </div>

      </div>

      <GuidedTour storageKey="toeic-home-tour" steps={TOUR_STEPS} enabled={true} />
    </div>
  );
}
