"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuizStore } from "@/store/quizStore";
import { playSound } from "@/utils/audio";
import { useRouter } from "next/navigation";
import type { QuizData } from "@/lib/types";
import { renderFormattedText } from "@/utils/textFormatting";
import { QuizOptionGrid } from "@/components/quiz/QuizOptionGrid";
import { ResultSummary } from "@/components/common/ResultSummary";
import { QuizHeader } from "@/components/common/QuizHeader";
import { QuestionTimer } from "@/components/quiz/QuestionTimer";

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  'word-form': { label: 'Dạng từ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'vocabulary': { label: 'Từ vựng', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  'grammar': { label: 'Ngữ pháp', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'preposition': { label: 'Giới từ', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  'conjunction': { label: 'Liên từ', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'pronoun': { label: 'Đại từ', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowHint(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!mounted || !session) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (selectedOption === null) {
        const key = parseInt(e.key);
        if (key >= 1 && key <= question.answerOptions.length) {
          handleSelectOption(key - 1, question.answerOptions[key - 1].isCorrect);
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
  }, [currentIndex, selectedOption, isFinished, question, lessonId, quizData.questions.length, answerQuestion, goToNext, goToPrev, mounted, session, handleSelectOption]);

  if (!mounted) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-slate-400 font-medium">
        Loading module data...
      </div>
    );
  }

  if (!session) return null;



  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden">
      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6 overflow-hidden">
      <QuizHeader
        titleText={lessonId.startsWith('part5-') ? `Part 5 – ${lessonId.replace('part5-', '').toUpperCase()}` : `Lesson ${lessonId.padStart(2, '0')}`}
        subtitleText={`${currentIndex + 1} / ${quizData.questions.length}`}
        progressPercent={(currentIndex / quizData.questions.length) * 100}
        progressColorClass="bg-blue-500"
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onRestart={() => restartLesson(lessonId)}
        onExit={() => router.push(lessonId.startsWith('part5') ? '/?tab=part5' : '/?tab=vocab')}
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

          <h1 className="text-lg md:text-xl font-semibold text-slate-800 leading-relaxed">
            {renderFormattedText(question.question)}
          </h1>

          {/* Translation - revealed after answering */}
          {isAnswered && question.translation && (
            <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
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
                  className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${isAnswered ? 'text-slate-400 bg-slate-100 cursor-not-allowed hidden' : 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  Gợi ý
                </button>
              ) : (
                <div className={`text-sm px-4 py-3 rounded-xl border flex items-start gap-3 transition-colors ${isAnswered ? 'text-slate-500 bg-slate-50 border-slate-200' : 'text-amber-700 bg-amber-50/80 border-amber-200/50'}`}>
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
      <div className="shrink-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-50">
        <div className="w-full max-w-3xl mx-auto p-3 md:p-5 px-4 md:px-6 flex justify-between items-center">
          
          <button 
            title="Go to previous question"
            onClick={() => goToPrev(lessonId)} 
            disabled={currentIndex === 0}
            className={`px-5 py-3 font-semibold rounded-full transition-all flex items-center gap-2 ${currentIndex === 0 ? 'text-slate-300 cursor-not-allowed opacity-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer active:scale-95'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-4">
            {isAnswered && (
              <span className="text-xs font-bold text-slate-300 hidden md:inline-block tracking-widest uppercase">
                {currentIndex < quizData.questions.length - 1 ? 'PRESS SPACE TO CONTINUE' : 'PRESS SPACE TO FINISH'}
              </span>
            )}
            <button 
               onClick={() => goToNext(lessonId, quizData.questions.length)}
               disabled={!isAnswered}
               className={`px-8 py-3 font-semibold rounded-full transition-all flex items-center gap-2 ${!isAnswered ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 cursor-pointer hover:-translate-y-0.5 active:scale-95'}`}
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
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] animate-in slide-in-from-right-8 duration-300">
               {/* Preview Header */}
               <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                  <button onClick={() => setPreviewQuestionIndex(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="font-bold text-slate-700">Xem lại Câu {previewQuestionIndex + 1}</div>
                  <div className="w-9" />
               </div>
               
               {/* Preview Body */}
               <div className="p-5 lg:p-6 overflow-y-auto flex-1">
                  <h3 className="font-bold text-slate-800 leading-relaxed mb-6 text-lg">
                     {renderFormattedText(quizData.questions[previewQuestionIndex].question)}
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    {quizData.questions[previewQuestionIndex].answerOptions.map((opt, oIdx) => {
                      const ansObj = answers[previewQuestionIndex];
                      const isSelected = ansObj === oIdx;
                      const isCorrect = opt.isCorrect;
                      
                      let boxClass = "border border-slate-200 bg-white opacity-60";
                      if (isCorrect) {
                        boxClass = "border-green-300 bg-green-50 shadow-sm opacity-100 ring-2 ring-green-500/20";
                      } else if (isSelected) {
                        boxClass = "border-red-200 bg-red-50 opacity-100 ring-2 ring-red-500/20";
                      }

                      return (
                        <div key={oIdx} className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${boxClass}`}>
                          <div className="flex items-start gap-4">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm mt-0.5 shrink-0 ${isCorrect ? 'bg-green-500 text-white' : (isSelected ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400')}`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <div className="flex flex-col w-full">
                              <span className={`text-[15px] leading-snug mt-0.5 ${isCorrect ? 'text-green-900 font-bold' : (isSelected ? 'text-red-900 font-bold' : 'text-slate-500 font-medium')}`}>
                                {renderFormattedText(opt.text)}
                              </span>
                              {(isCorrect || isSelected) && opt.rationale && (
                                <div className="mt-3 text-sm animate-in fade-in duration-300">
                                  {isCorrect && <div className="text-green-700 font-bold flex items-center gap-1.5 mb-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    Chính xác!
                                  </div>}
                                  {isSelected && !isCorrect && <div className="text-red-700 font-bold flex items-center gap-1.5 mb-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    Lựa chọn của bạn
                                  </div>}
                                  <p className={`leading-relaxed ${isSelected && !isCorrect ? 'text-slate-600' : 'text-slate-700'}`}>{opt.rationale}</p>
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
              onExit={() => router.push(lessonId.startsWith('part5') ? '/?tab=part5' : '/?tab=vocab')}
              exitLabel="Về Dashboard"
            />
          )}
        </div>
      )}
    </div>
  );
}
