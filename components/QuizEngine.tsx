"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuizStore } from "@/store/quizStore";
import { playSound } from "@/utils/audio";

interface AnswerOption {
  text: string;
  isCorrect: boolean;
  rationale: string;
}

interface Question {
  question: string;
  answerOptions: AnswerOption[];
  hint: string;
}

interface QuizData {
  title: string;
  questions: Question[];
}

const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\/[^\/]+\/)/g);
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
         if (part.startsWith('/') && part.endsWith('/')) {
           return (
             <span key={i} className="inline-block whitespace-nowrap px-2 py-0.5 mx-0.5 bg-indigo-50/80 text-indigo-700 font-medium rounded-lg text-[0.9em] tracking-wide align-baseline border border-indigo-100/50">
               {part}
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

  useEffect(() => {
    initLesson(lessonId, quizData.questions.length);
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

  const handleSelectOption = (idx: number, isCorrect: boolean) => {
    if (selectedOption !== null) return;
    answerQuestion(lessonId, currentIndex, idx, isCorrect);
    
    if (!isMuted) {
      playSound(isCorrect ? 'correct' : 'incorrect');
    }
  };

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
  }, [currentIndex, selectedOption, isFinished, question, lessonId, quizData.questions.length, answerQuestion, goToNext, goToPrev, mounted, session]);

  if (!mounted) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-slate-400 font-medium">
        Loading module data...
      </div>
    );
  }

  if (!session) return null;

  if (isFinished) {
    const percentage = Math.round((score / quizData.questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete</h2>
        <p className="text-slate-500 mb-8">You have successfully mastered Module {lessonId}.</p>
        
        <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-sm shadow-sm mb-8">
          <div className="text-5xl font-bold text-blue-600 mb-2">{score}/{quizData.questions.length}</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Score ({percentage}%)</div>
        </div>
        
        <div className="flex gap-4">
          <Link href="/" className="px-6 py-3 bg-white border border-slate-200 rounded-full font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Dashboard
          </Link>
          <button onClick={() => restartLesson(lessonId)} className="cursor-pointer px-6 py-3 bg-blue-600 rounded-full font-medium text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg transition-all">
            Restart Mission
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden">
      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 shrink-0 relative">
        <div className="flex items-center gap-3 z-10 flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Lesson {lessonId.toString().padStart(2, '0')} 
            <span className="ml-2 text-slate-300">•</span>
            <span className="ml-2">{currentIndex + 1} / {quizData.questions.length}</span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-[200px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${((currentIndex) / quizData.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex justify-end z-10 items-center">
          <button 
            onClick={toggleMute}
            className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center h-8 w-8"
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            )}
          </button>
          
          <Link 
            href="/" 
            title="Exit Quiz"
            className="flex items-center gap-1.5 px-3 py-1.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <span className="text-sm font-semibold">Exit</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </Link>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <h1 className="text-lg md:text-xl font-semibold text-slate-800 leading-relaxed mb-6">
          {renderFormattedText(question.question)}
        </h1>

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
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx, isCorrect)}
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
                          That's right!
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
              </button>
            )
          })}
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
    </div>
  );
}
