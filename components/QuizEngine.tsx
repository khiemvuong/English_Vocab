"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuizStore } from "@/store/quizStore";
import { playSound, speakWord } from "@/utils/audio";
import { AudioButton } from "@/components/AudioButton";
import { useRouter } from "next/navigation";
import type { QuizData } from "@/lib/types";

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  'word-form': { label: 'Dạng từ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'vocabulary': { label: 'Từ vựng', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  'grammar': { label: 'Ngữ pháp', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'preposition': { label: 'Giới từ', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  'conjunction': { label: 'Liên từ', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'pronoun': { label: 'Đại từ', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\/[^\/]+\/)/g);
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
         if (part.startsWith('/') && part.endsWith('/')) {
           const textBefore = i > 0 ? parts[i-1] : '';
           let wordToSpeak = '';
           const strictQuoteMatch = textBefore.match(/['"]([^'"]+)['"]\s*$/);
           if (strictQuoteMatch) {
             wordToSpeak = strictQuoteMatch[1];
           } else {
             const words = textBefore.trim().split(/\s+/);
             if (words.length <= 3) {
               wordToSpeak = textBefore.replace(/['":;,.()]/g, '').trim();
             } else {
               wordToSpeak = words[words.length - 1].replace(/['":;,.()]/g, '');
             }
           }
           
           return (
             <span key={i} className="inline-flex items-center whitespace-nowrap px-2 py-0.5 mx-0.5 bg-indigo-50/80 text-indigo-700 font-medium rounded-lg text-[0.9em] tracking-wide align-baseline border border-indigo-100/50">
               {part}
               <AudioButton text={wordToSpeak} />
             </span>
           );
         }
         return <span key={i}>{part}</span>;
      })}
    </span>
  );
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
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between mb-4 md:mb-8 shrink-0 gap-y-4">
        {/* Left: Lesson Info */}
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">
          {lessonId.startsWith('part5-') ? `Part 5 – ${lessonId.replace('part5-', '').toUpperCase()}` : `Lesson ${lessonId.padStart(2, '0')}`}
          <span className="mx-1.5 text-slate-300">•</span> 
          {currentIndex + 1} / {quizData.questions.length}
        </div>

        {/* Center: Progress Bar */}
        <div className="flex-1 flex justify-center w-full min-w-[150px] order-3 md:order-2 md:w-auto px-2 md:px-0">
          <div className="w-full max-w-[200px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${((currentIndex) / quizData.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex justify-end items-center shrink-0 order-2 md:order-3 gap-2.5">
          <button 
            onClick={toggleMute}
            className="p-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors flex items-center justify-center h-8 w-8"
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            )}
          </button>
          
          <button 
            onClick={() => {
              router.push(lessonId.startsWith('part5') ? '/?tab=part5' : '/?tab=vocab');
            }}
            title="Exit Quiz"
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 bg-slate-100 hover:text-red-700 hover:bg-red-50 active:bg-red-100 rounded-full transition-colors cursor-pointer"
          >
            <span className="text-sm font-bold">Exit</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </header>

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

        <div className="flex flex-col gap-3">
          {question.answerOptions.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = opt.isCorrect;

            let boxClass = "border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm";
            if (isAnswered) {
              if (isCorrect) {
                 boxClass = "border-green-300 bg-green-50 shadow-sm";
              } else if (isSelected) {
                 boxClass = "border-red-200 bg-red-50";
              } else {
                 boxClass = "border-slate-100 bg-white opacity-60";
              }
            }

            return (
              <div
                key={idx}
                onClick={() => { if (!isAnswered) handleSelectOption(idx, isCorrect); }}
                className={`w-full text-left p-3.5 md:p-4 rounded-xl transition-all duration-300 ${boxClass} ${!isAnswered ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}`}
              >
                <div className="flex items-start gap-4">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5 transition-colors ${!isAnswered ? 'bg-slate-100 text-slate-500' : (isCorrect ? 'bg-green-500 text-white' : (isSelected ? 'bg-red-500 text-white' : 'bg-slate-100/50 text-slate-400'))}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  
                  <div className="flex flex-col w-full">
                    <span className={`text-[15px] md:text-base leading-snug mt-0.5 ${isAnswered && isCorrect ? 'text-green-900 font-medium' : (isAnswered && isSelected ? 'text-red-900 font-medium' : 'text-slate-700')}`}>
                      {renderFormattedText(opt.text)}
                    </span>
                    
                    {isAnswered && (
                      <div className="mt-3 text-sm text-slate-600 animate-in fade-in slide-in-from-top-2 duration-300">
                        {isCorrect && <div className="text-green-600 font-medium flex items-center gap-1.5 mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          That&apos;s right!
                        </div>}
                        {isSelected && !isCorrect && <div className="text-red-600 font-medium flex items-center gap-1.5 mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          Incorrect
                        </div>}
                        <p className={`leading-relaxed ${isSelected || isCorrect ? 'text-slate-700' : 'text-slate-500'}`}>{opt.rationale}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[85vh] animate-in fade-in zoom-in-95 duration-300">
              
              {/* Modal Header */}
              <div className="px-6 py-6 lg:py-8 border-b border-slate-100 text-center shrink-0 bg-white relative">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-50/80 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 ring-4 ring-blue-50/50">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-1 lg:mb-2">Hoàn thành bài tập!</h2>
                <p className="text-slate-500 font-medium">
                  Kết quả: <strong className="text-blue-600 text-xl mx-0.5">
                    {score}
                  </strong> / {quizData.questions.length}
                </p>
              </div>
              
              {/* Modal Body - Scrollable Modal approx 50vh */}
              <div className="p-4 lg:p-6 overflow-y-auto bg-slate-50/50 flex-1 max-h-[50vh]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Kết quả chi tiết</h3>
                
                <div className="flex flex-col gap-2.5">
                  {quizData.questions.map((q, i) => {
                    const optionIndex = answers[i];
                    const hasAnswered = optionIndex !== undefined;
                    const isCorrect = hasAnswered ? q.answerOptions[optionIndex].isCorrect : false;
                    return (
                      <button
                        key={i}
                        onClick={() => setPreviewQuestionIndex(i)}
                        className={`flex items-center justify-between p-3.5 lg:p-4 cursor-pointer rounded-2xl border transition-transform hover:-translate-y-0.5 active:scale-95 ${isCorrect ? 'bg-green-50/60 border-green-200 text-green-700 hover:bg-green-50' : 'bg-red-50/60 border-red-200 text-red-700 hover:bg-red-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-100' : 'bg-red-100/80'}`}>
                             {isCorrect ? (
                               <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             ) : (
                               <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                             )}
                          </div>
                          <span className="font-bold text-sm lg:text-base">Câu {i + 1}</span>
                        </div>
                        
                        <div className="text-xs lg:text-sm font-semibold flex items-center gap-1 opacity-80">
                          Xem lại
                          <svg className="w-4 h-4 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 lg:p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0">
                <button 
                  onClick={() => restartLesson(lessonId)} 
                  className="flex-[0.4] py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm lg:text-base cursor-pointer"
                >
                  Làm lại
                </button>
                <button 
                  onClick={() => {
                    router.push(lessonId.startsWith('part5') ? '/?tab=part5' : '/?tab=vocab');
                  }}
                  className="flex-1 py-3.5 flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-xl shadow-blue-600/20 text-sm lg:text-base cursor-pointer"
                >
                  Về Dashboard
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
