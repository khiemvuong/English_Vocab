"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Part6Data } from "@/lib/types";
import { useQuizStore } from "@/store/quizStore";
import { playSound } from "@/utils/audio";
import { ResultSummary } from "@/components/common/ResultSummary";
import { QuizHeader } from "@/components/common/QuizHeader";
import { getDeterministicShuffle } from "@/utils/shuffle";
import { QuizEngineSkeleton } from "@/components/common/QuizEngineSkeleton";
import { AnswerButtonList } from "@/components/common/AnswerButtonList";

interface Part6EngineProps {
  data: Part6Data;
  testId: string;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  vocabulary: "Từ Vựng",
  grammar: "Ngữ Pháp",
  conjunction: "Liên Từ",
  preposition: "Giới Từ",
  "word-form": "Từ Loại",
  "sentence-insertion": "Chèn Câu",
  "reading-comprehension": "Đọc Hiểu",
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
  vocabulary: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  grammar: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  conjunction: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  preposition: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  "word-form": "bg-teal-500/10 text-teal-300 border-teal-500/20",
  "sentence-insertion": "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "reading-comprehension": "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
};

export function Part6Engine({ data, testId }: Part6EngineProps) {
  const router = useRouter();
  const lessonId = `part6-${testId}`;
  
  const { progress, initLesson, answerQuestion, goToNext, goToPrev, restartLesson, isMuted, toggleMute } = useQuizStore();
  const [mounted, setMounted] = useState(false);
  const [previewQIndex, setPreviewQIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Flatten questions layout
  const flatQuestions = useMemo(() => {
    return data.passages.flatMap((p, pIdx) => 
      p.questions.map((q, qIdx) => ({
        pIdx,
        qIdx,
        passage: p,
        question: q,
        globalIndex: 0 // Will be mapped right after
      }))
    ).map((item, index) => ({ ...item, globalIndex: index }));
  }, [data]);

  const totalQuestions = flatQuestions.length;

  useEffect(() => {
    initLesson(lessonId, totalQuestions);
    Promise.resolve().then(() => setMounted(true));
  }, [initLesson, lessonId, totalQuestions]);

  const lessonState = progress[lessonId];
  const currentIndex = lessonState?.currentIndex ?? 0;
  const answers = lessonState?.answers ?? {};
  const showSummary = lessonState?.isFinished ?? false;

  const activeIndex = previewQIndex !== null ? previewQIndex : currentIndex;
  
  const currentItem = flatQuestions[activeIndex];
  const passage = currentItem?.passage;
  const question = currentItem?.question;

  const answeredCount = Object.keys(answers).length;
  // Answer references original option index from 0 to N-1
  const selectedOriginIdx = answers[activeIndex];
  const isAnswered = selectedOriginIdx !== undefined;

  const restartCount = lessonState?.restartCount ?? 0;

  // Base raw options
  const baseOptions = useMemo(() => {
    if (!question) return [];
    return question.answerOptions.map((opt, idx) => ({
      originIdx: idx,
      opt
    }));
  }, [question]);

  // The order displayed visually by AnswerButtonList
  const displayOptions = useMemo(() => {
    return getDeterministicShuffle(baseOptions, restartCount, `${lessonId}-${activeIndex}`);
  }, [baseOptions, restartCount, lessonId, activeIndex]);
  
  const correctOriginIdx = useMemo(() => {
    return question?.answerOptions.findIndex(o => o.isCorrect) ?? -1;
  }, [question]);

  const handleSelect = useCallback((originIdxRaw: string | number) => {
    if (isAnswered) return;
    const originIdx = Number(originIdxRaw);
    const isCorrect = originIdx === correctOriginIdx;
    answerQuestion(lessonId, activeIndex, originIdx, isCorrect);
    
    if (!isMuted) {
      playSound(isCorrect ? 'correct' : 'incorrect');
    }
  }, [isAnswered, correctOriginIdx, answerQuestion, lessonId, activeIndex, isMuted]);

  const [prevActiveIndex, setPrevActiveIndex] = useState(activeIndex);
  if (activeIndex !== prevActiveIndex) {
    setPrevActiveIndex(activeIndex);
    setShowHint(false);
  }

  // Keyboard controls
  useEffect(() => {
    if (!mounted || !lessonState || showSummary || previewQIndex !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAnswered) {
        const key = parseInt(e.key);
        if (key >= 1 && key <= displayOptions.length) {
          const selectedObj = displayOptions[key - 1];
          handleSelect(selectedObj.originIdx);
        }
      } else {
        if (e.code === "Space") {
          e.preventDefault();
          goToNext(lessonId, totalQuestions);
        }
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        goToPrev(lessonId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, lessonState, showSummary, isAnswered, displayOptions, previewQIndex, handleSelect, goToNext, goToPrev, lessonId, totalQuestions]);

  const renderPassageText = () => {
    if (!passage) return null;
    const isDouble = !!passage.passageA;
    if (isDouble) {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Passage A</p>
            <div className="text-[13px] md:text-[14px] leading-relaxed text-slate-200 font-medium whitespace-pre-wrap font-sans text-justify">{passage.passageA}</div>
          </div>
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Passage B</p>
            <div className="text-[13px] md:text-[14px] leading-relaxed text-slate-200 font-medium whitespace-pre-wrap font-sans text-justify">{passage.passageB}</div>
          </div>
        </div>
      );
    }
    
    // Process text for inline blanks if they exist like {131} or [131]
    if (passage.passage && (passage.passage.includes("{") || passage.passage.includes("["))) {
       const parts = passage.passage.split(/(?:\{|\[)(\d+)(?:\}|\])/g);
       return (
         <div className="text-[13px] md:text-[14px] leading-relaxed text-slate-200 font-medium whitespace-pre-wrap font-sans text-justify">
           {parts.map((part, i) => {
             if (i % 2 === 1) { // It's a blank identifier like 131
               const bIdxStr = part;
               const matchingQuestion = flatQuestions.find(q => q.question.id.toString() === bIdxStr);
               const isCurrent = matchingQuestion?.globalIndex === activeIndex;
               let ansText = "______";
               
               if (matchingQuestion) {
                  const hasAns = answers[matchingQuestion.globalIndex] !== undefined;
                  if (hasAns) {
                     const ansIdx = answers[matchingQuestion.globalIndex];
                     ansText = matchingQuestion.question.answerOptions[ansIdx].text;
                     const isCorrect = matchingQuestion.question.answerOptions[ansIdx].isCorrect;
                     const correctAnsText = matchingQuestion.question.answerOptions.find(o => o.isCorrect)?.text;
                     return (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-lg text-sm font-bold border transition-all ${
                          isCorrect
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/20 line-through"
                        }`}
                      >
                        {ansText}
                        {!isCorrect && (
                          <span className="no-underline text-emerald-400 font-bold ml-1">
                            → {correctAnsText}
                          </span>
                        )}
                      </span>
                     );
                  }
               }
               
               return (
                 <span
                   key={i}
                   className={`inline-flex items-center px-3 py-0.5 mx-0.5 rounded-lg text-sm font-bold border-2 border-dashed transition-all ${
                     isCurrent
                       ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20 animate-pulse"
                       : "bg-white/5 text-slate-400 border-white/5"
                   }`}
                 >
                   {isCurrent ? (
                     <span className="flex items-center gap-1">
                       <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       {part}
                     </span>
                   ) : part}
                 </span>
               );
             }
             return <span key={i}>{part}</span>;
           })}
         </div>
       );
    }

    return (
      <div className="text-[13px] md:text-[14px] leading-relaxed text-slate-200 font-medium whitespace-pre-wrap font-sans text-justify">
        {passage.passage}
      </div>
    );
  };

  if (!mounted) return <QuizEngineSkeleton variant="scenario" />;

  const correctCount = lessonState?.score ?? 0;

  if (showSummary && previewQIndex === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <ResultSummary
          score={correctCount}
          total={totalQuestions}
          items={flatQuestions.map((item) => {
            const hasAnswered = answers[item.globalIndex] !== undefined;
            const correctOptIdx = item.question.answerOptions.findIndex(o => o.isCorrect);
            const isCorrect = hasAnswered ? answers[item.globalIndex] === correctOptIdx : false;
            return {
              id: item.question.id.toString(),
              isCorrect,
              title: `Câu ${item.question.id} (${QUESTION_TYPE_LABELS[item.question.questionType] || item.question.questionType})`,
              subtitle: item.passage.passageTitle,
              onClickReview: () => setPreviewQIndex(item.globalIndex)
            };
          })}
          onRestart={() => restartLesson(lessonId)}
          onExit={() => router.push(`/?tab=part6`)}
          exitLabel="Về Dashboard"
        />
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="flex flex-col min-h-dvh w-full bg-slate-950 text-white pb-32 relative">
      {/* Background radial gradients for glassmorphism glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-5 md:px-6 pt-5 sm:pt-6 md:pt-8 gap-y-4 relative z-10">
        {previewQIndex !== null ? (
          <header className="flex flex-wrap items-center justify-between mb-4 md:mb-6 shrink-0 gap-y-3">
            <button
              onClick={() => setPreviewQIndex(null)}
              className="group flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-white/5 border border-white/10 group-hover:bg-white/10 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </div>
              <span className="font-bold text-sm">Quay về Kết quả</span>
            </button>
          </header>
        ) : (
          <QuizHeader
            titleText={`Part 6 – ${testId.toUpperCase()} • Câu ${question.id}`}
            subtitleText={`${answeredCount} / ${totalQuestions} câu`}
            progressPercent={(answeredCount / totalQuestions) * 100}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onRestart={() => restartLesson(lessonId)}
            onExit={() => router.push(`/?tab=part6`)}
          />
        )}

        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5">
              Đoạn {passage.passageNumber}: Câu {passage.questionRange}
            </span>
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {passage.passageType}
            </span>
            <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              QUESTION_TYPE_COLORS[question.questionType] || "bg-white/5 text-slate-400 border-white/5"
            }`}>
              {QUESTION_TYPE_LABELS[question.questionType] || question.questionType}
            </span>
            {question.blankLabel && (
              <span className="text-[10px] md:text-[11px] font-bold uppercase bg-white/5 text-slate-400 border border-white/5 px-2 py-1 rounded-full">
                Vị trí {question.blankLabel}
              </span>
            )}
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
            {passage.passageTitle}
          </h2>
        </div>

        <div className="w-full flex flex-col gap-4 sm:gap-6 pb-6">
          {/* Passage Text */}
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 sm:p-6 md:p-8 relative shadow-lg backdrop-blur-md">
            {passage.passageA && (
              <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                Double Passage
              </div>
            )}
            {renderPassageText()}
          </div>

          {/* Current Question */}
          <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5 sm:p-6 md:p-8 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">
                {question.id}
              </span>
              <h3 className="text-sm font-bold text-slate-300">
                {question.question ? `Câu hỏi: ${question.question}` : "Chọn đáp án đúng cho chỗ trống"}
              </h3>
            </div>

            <AnswerButtonList
              size="sm"
              options={baseOptions}
              selectedOptionId={isAnswered ? String(selectedOriginIdx) : null}
              correctOptionId={String(correctOriginIdx)}
              isAnswered={isAnswered}
              onSelect={handleSelect}
              isMuted={isMuted}
              restartCount={restartCount}
              stableKey={`${lessonId}-${activeIndex}`}
              getOptionId={(optObj) => String(optObj.originIdx)}
              renderContent={(optObj, isSelected, isCorrectOption, showResult) => {
                const optText = optObj.opt.text;
                return (
                  <div className="flex flex-col gap-0.5 w-full text-left">
                    <span className={`font-semibold text-[13px] leading-snug wrap-break-word transition-colors duration-300 ${
                      showResult && isCorrectOption 
                        ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                        : (showResult && isSelected 
                          ? 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                          : 'text-white group-hover:text-white')
                    }`}>
                      {optText}
                    </span>
                    {showResult && (isSelected || isCorrectOption) && optObj.opt.rationale && (
                      <span className={`text-[11.5px] font-medium leading-snug mt-1 pt-1 border-t ${
                        isCorrectOption ? "text-emerald-400/80 border-white/5" : "text-rose-400/80 border-white/5"
                      }`}>
                        {isCorrectOption ? "✓ " : "✗ "}{optObj.opt.rationale}
                      </span>
                    )}
                  </div>
                );
              }}
            />

            {/* Hint Box (if hint/translation exists) */}
            {(question.hint || question.translation) && isAnswered && (
              <div className="mt-4 flex flex-col gap-2">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors self-start cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Xem giải thích / dịch nghĩa
                  </button>
                ) : (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    {question.hint && (
                      <div className="mb-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Gợi ý</p>
                        <p className="text-[13px] text-zinc-200 leading-relaxed font-medium">{question.hint}</p>
                      </div>
                    )}
                    {question.translation && (
                      <div className={question.hint ? "mt-2 pt-2 border-t border-white/5" : ""}>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dịch</p>
                        <p className="text-[13px] text-zinc-300 italic leading-relaxed">{question.translation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Next/Prev buttons */}
            {previewQIndex === null && (
              <div className="mt-5 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {activeIndex > 0 && (
                  <button
                    onClick={() => goToPrev(lessonId)}
                    className="w-14 md:w-16 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Câu trước (Arrow Left)"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {isAnswered ? (
                  <button
                    onClick={() => goToNext(lessonId, totalQuestions)}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {activeIndex === totalQuestions - 1 ? "Xem Kết Quả (Space)" : "Tiếp Theo (Space)"}
                    <svg className="w-4 h-4 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex-1 py-3.5 bg-white/5 text-white/20 font-bold rounded-xl flex items-center justify-center cursor-not-allowed border border-white/5">
                    Chọn một đáp án
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
