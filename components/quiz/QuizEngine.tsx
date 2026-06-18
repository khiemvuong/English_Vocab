"use client";

import { useEffect, useLayoutEffect, useState, useCallback, useMemo } from "react";
import { useQuizStore } from "@/store/quizStore";
import { playSound } from "@/utils/audio";
import { useRouter } from "next/navigation";
import type { QuizData } from "@/lib/types";
import { renderFormattedText } from "@/utils/textFormatting";
import { QuizOptionGrid } from "@/components/quiz/QuizOptionGrid";
import { QuizEngineSkeleton } from "@/components/common/QuizEngineSkeleton";
import { ResultSummary } from "@/components/common/ResultSummary";
import { QuizHeader } from "@/components/common/QuizHeader";
import { QuestionTimer } from "@/components/quiz/QuestionTimer";
import { getDeterministicShuffle } from "@/utils/shuffle";

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  'word-form': { label: 'Từ Loại', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  'vocabulary': { label: 'Từ vựng', color: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
  'grammar': { label: 'Ngữ pháp', color: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  'preposition': { label: 'Giới từ', color: 'bg-teal-500/10 text-teal-300 border-teal-500/20' },
  'conjunction': { label: 'Liên từ', color: 'bg-orange-500/10 text-orange-300 border-orange-500/20' },
  'pronoun': { label: 'Đại từ', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
};

export function QuizEngine({ quizData, lessonId }: { quizData: QuizData; lessonId: string }) {
  const { progress, isMuted, toggleMute, initLesson, answerQuestion, goToNext, goToPrev, restartLesson } = useQuizStore();
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    initLesson(lessonId, quizData.questions.length);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, [lessonId, initLesson, quizData.questions.length]);

  const session = progress[lessonId];
  const currentIndex = session?.currentIndex ?? 0;
  const answers = session?.answers ?? {};
  const isFinished = session?.isFinished ?? false;
  const score = session?.score ?? 0;

  const question = quizData.questions[currentIndex] || quizData.questions[0];
  const selectedOption = answers[currentIndex] ?? null;
  const isAnswered = selectedOption !== null;

  const handleSelectOption = useCallback((idx: number, isCorrect: boolean) => {
    if (selectedOption !== null) return;
    answerQuestion(lessonId, currentIndex, idx, isCorrect);
    
    if (!isMuted) {
      playSound(isCorrect ? 'correct' : 'incorrect');
    }
  }, [selectedOption, answerQuestion, lessonId, currentIndex, isMuted]);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowHint(false);
  }, [currentIndex]);

  const displayOptions = useMemo(() => {
    if (!question?.answerOptions) return [];
    const stableKey = question.id?.toString() || `q-${currentIndex}`;
    return getDeterministicShuffle(question.answerOptions, session?.restartCount || 0, stableKey);
  }, [question, currentIndex, session?.restartCount]);

  useEffect(() => {
    if (!mounted || !session) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (selectedOption === null) {
        const key = parseInt(e.key);
        if (key >= 1 && key <= displayOptions.length) {
          const selectedText = displayOptions[key - 1].text;
          const originalIdx = question.answerOptions.findIndex(o => o.text === selectedText);
          if (originalIdx !== -1) {
            handleSelectOption(originalIdx, question.answerOptions[originalIdx].isCorrect);
          }
        }
      } else {
        if (e.code === "Space") {
          e.preventDefault();
          goToNext(lessonId, quizData.questions.length);
        }
      }
      if (e.code === "ArrowLeft") {
         e.preventDefault();
         goToPrev(lessonId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, selectedOption, isFinished, question, displayOptions, lessonId, quizData.questions.length, answerQuestion, goToNext, goToPrev, mounted, session, handleSelectOption]);

  if (!mounted) return <QuizEngineSkeleton variant="quiz" />;

  if (!session) return null;

  const isEts2026Lesson = lessonId.startsWith("part5-ets2026-");
  const isPart5Lesson = lessonId.startsWith("part5-") && !isEts2026Lesson;
  const homeTab = isEts2026Lesson ? "ets2026" : isPart5Lesson ? "part5" : "vocab";

  const headerTitleText = (() => {
    if (isEts2026Lesson) {
      const etsId = lessonId.replace("part5-ets2026-", "");
      if (etsId.startsWith("test_")) {
        return `ETS 2026 – Test ${etsId.replace("test_", "")}`;
      }
      return `ETS 2026 – ${etsId.toUpperCase()}`;
    }

    if (isPart5Lesson) {
      return `Part 5 – ${lessonId.replace("part5-", "").toUpperCase()}`;
    }

    return `Lesson ${lessonId.padStart(2, "0")}`;
  })();



  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-slate-950 text-white relative">
      {/* Background radial gradients for glassmorphism glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6 overflow-hidden relative z-10">
      <QuizHeader
        titleText={headerTitleText}
        subtitleText={`${currentIndex + 1} / ${quizData.questions.length}`}
        progressPercent={(Object.keys(answers).length / quizData.questions.length) * 100}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onRestart={() => restartLesson(lessonId)}
        onExit={() => router.push(`/?tab=${homeTab}`)}
      />

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <div className="flex flex-col gap-4 mb-6">
          {/* Category badge - always visible */}
          {question.category && CATEGORY_MAP[question.category] && (
            <span className={`self-start text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${CATEGORY_MAP[question.category].color}`}>
              {CATEGORY_MAP[question.category].label}
            </span>
          )}

          <h1 className="text-xl md:text-2xl font-bold text-white leading-relaxed tracking-tight">
            {renderFormattedText(question.question)}
          </h1>

          {/* Translation - revealed after answering */}
          {isAnswered && question.translation && (
            <div className="text-sm text-slate-300 bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              <span className="leading-relaxed italic">{question.translation}</span>
            </div>
          )}
          
          {question.hint && (
            <div className="self-start">
              {!showHint ? (
                <button 
                  onClick={() => setShowHint(true)}
                  disabled={isAnswered}
                  className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer border ${isAnswered ? 'text-slate-500 bg-white/5 border-white/5 cursor-not-allowed hidden' : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  Gợi ý
                </button>
              ) : (
                <div className={`text-sm px-4 py-3 rounded-xl border flex items-start gap-3 transition-colors ${isAnswered ? 'text-slate-400 bg-white/5 border-white/10' : 'text-amber-300 bg-amber-500/10 border-amber-500/20'}`}>
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="leading-relaxed">{question.hint}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <QuizOptionGrid
            options={question.answerOptions}
            selectedOptionText={isAnswered && selectedOption !== null ? question.answerOptions[selectedOption]?.text : null}
            correctOptionText={question.answerOptions.find(o => o.isCorrect)?.text || ''}
            isAnswered={isAnswered}
            onSelect={(text) => {
              const idx = question.answerOptions.findIndex(o => o.text === text);
              if (idx !== -1) handleSelectOption(idx, question.answerOptions[idx].isCorrect);
            }}
            isMuted={isMuted}
            restartCount={session.restartCount || 0}
            stableKey={(question.id?.toString()) || `q-${currentIndex}`}
          />
        </div>

        {/* Keyboard shortcut note for PCs */}
        <div className="hidden md:flex items-center justify-center gap-1.5 mt-10 mb-2 text-[13px] font-medium text-slate-400 opacity-80">
           <span>Mẹo: Nhấn phím</span>
           <kbd className="font-sans font-bold bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 leading-none">1</kbd>
           <span className="mx-0.5">-</span>
           <kbd className="font-sans font-bold bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 leading-none">4</kbd>
           <span>để chọn nhanh tương ứng A, B, C, D</span>
        </div>
      </div>
      </div>

      {lessonId.startsWith('part5-') && !isFinished && (
        <QuestionTimer 
          currentIndex={currentIndex} 
          isAnswered={isAnswered} 
          duration={30} 
        />
      )}

      {/* Footer Action */}
      <div className="shrink-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-white/10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.5)] z-50">
        <div className="w-full max-w-3xl mx-auto p-3 md:p-5 px-4 md:px-6 flex justify-between items-center">
          
          <button 
            title="Go to previous question"
            onClick={() => goToPrev(lessonId)} 
            disabled={currentIndex === 0}
            className={`px-5 py-3 font-semibold rounded-full transition-all flex items-center gap-2 ${currentIndex === 0 ? 'text-white/20 cursor-not-allowed opacity-50' : 'text-white/60 hover:text-white hover:bg-white/10 cursor-pointer active:scale-95'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-4">
            {isAnswered && (
              <span className="text-xs font-bold text-white/30 hidden md:inline-block tracking-widest uppercase">
                {currentIndex < quizData.questions.length - 1 ? 'PRESS SPACE TO CONTINUE' : 'PRESS SPACE TO FINISH'}
              </span>
            )}
            <button 
               onClick={() => goToNext(lessonId, quizData.questions.length)}
               disabled={!isAnswered}
               className={`px-8 py-3 font-semibold rounded-full transition-all flex items-center gap-2 ${!isAnswered ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 cursor-pointer hover:-translate-y-0.5 active:scale-95'}`}
            >
               {currentIndex < quizData.questions.length - 1 ? 'Next' : 'Results'}
               {isAnswered && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>}
            </button>
          </div>
        </div>
      </div>

      {/* End of Quiz Modal Popup */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          {previewQuestionIndex !== null ? (
            <div className="bg-slate-900/95 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] animate-in slide-in-from-right-8 duration-300 text-white">
               {/* Preview Header */}
               <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md shrink-0">
                  <button onClick={() => setPreviewQuestionIndex(null)} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="font-bold text-white">Xem lại Câu {previewQuestionIndex + 1}</div>
                  <div className="w-9" />
               </div>
               
               {/* Preview Body */}
               <div className="p-5 lg:p-6 overflow-y-auto flex-1">
                  <h3 className="font-bold text-white leading-relaxed mb-6 text-lg">
                     {renderFormattedText(quizData.questions[previewQuestionIndex].question)}
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    {quizData.questions[previewQuestionIndex].answerOptions.map((opt, oIdx) => {
                      const ansObj = answers[previewQuestionIndex];
                      const isSelected = ansObj === oIdx;
                      const isCorrect = opt.isCorrect;
                      
                      let boxClass = "border border-white/5 bg-slate-950/20 opacity-45 text-white/60 backdrop-blur-sm";
                      if (isCorrect) {
                        boxClass = "border-emerald-500 bg-emerald-500/10 backdrop-blur-xl text-white ring-1 ring-emerald-400/30 shadow-[0_8px_32px_rgba(16,185,129,0.2)]";
                      } else if (isSelected) {
                        boxClass = "border-rose-500 bg-rose-500/10 backdrop-blur-xl text-white ring-1 ring-rose-400/30 shadow-[0_8px_32px_rgba(244,63,94,0.2)]";
                      }

                      return (
                        <div key={oIdx} className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${boxClass}`}>
                          <div className="flex items-start gap-4">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm mt-0.5 shrink-0 ${isCorrect ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]' : (isSelected ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'bg-white/10 text-white/80')}`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <div className="flex flex-col w-full">
                              <span className={`text-[15px] leading-snug mt-0.5 font-semibold ${isCorrect ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : (isSelected ? 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'text-white/90')}`}>
                                {renderFormattedText(opt.text)}
                              </span>
                              {(isCorrect || isSelected) && opt.rationale && (
                                <div className="mt-3 text-sm animate-in fade-in duration-300">
                                  {isCorrect && <div className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1.5">
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    Chính xác!
                                  </div>}
                                  {isSelected && !isCorrect && <div className="text-rose-400 font-bold flex items-center gap-1.5 mb-1.5">
                                    <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    Lựa chọn của bạn
                                  </div>}
                                  <p className="leading-relaxed text-slate-350">{opt.rationale}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
               </div>
            </div>
          ) : (
            <ResultSummary
              score={score}
              total={quizData.questions.length}
              items={quizData.questions.map((q, i) => {
                const optionIndex = answers[i];
                const hasAnswered = optionIndex !== undefined;
                const isCorrect = hasAnswered ? q.answerOptions[optionIndex].isCorrect : false;
                return {
                  id: i,
                  isCorrect,
                  title: `Câu ${i + 1}`,
                  onClickReview: () => setPreviewQuestionIndex(i)
                };
              })}
              onRestart={() => restartLesson(lessonId)}
              onExit={() => router.push(`/?tab=${homeTab}`)}
              exitLabel="Về Dashboard"
            />
          )}
        </div>
      )}
    </div>
  );
}
