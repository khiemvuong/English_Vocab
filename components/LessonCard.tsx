"use client";

import Link from "next/link";
import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";

export function LessonCard({ lesson }: { lesson: number }) {
  const isAvailable = lesson >= 1 && lesson <= 8;
  const [mounted, setMounted] = useState(false);
  const progressState = useQuizStore(state => state.progress[lesson.toString()]);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isCompleted = mounted && progressState?.isFinished;
  const amountAnswered = mounted && progressState?.answers ? Object.keys(progressState.answers).length : 0;
  const totalQuestions = mounted && progressState?.totalQuestions ? progressState.totalQuestions : 1;
  const inProgress = mounted && !isCompleted && amountAnswered > 0;
  
  return (
    <Link href={isAvailable ? `/lesson/${lesson}` : "#"}>
      <div 
        className={`flex flex-col h-full bg-white border rounded-2xl p-5 md:p-6 transition-all duration-300 relative overflow-hidden
          ${!isAvailable 
            ? 'border-slate-100 opacity-60 cursor-not-allowed bg-slate-50/50' 
            : 'border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 cursor-pointer hover:-translate-y-1'}`}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Lesson
          </span>
          
          {isCompleted && (
            <div className="bg-green-100 text-green-600 rounded-full p-1 border border-green-200">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
        </div>

        <h2 className="text-3xl md:text-4xl font-semibold text-slate-800 mb-6">
          {lesson.toString().padStart(2, '0')}
        </h2>
        
        <div className="mt-auto flex flex-col items-start gap-2">
          {isAvailable ? (
             isCompleted ? (
               <div className="flex flex-col w-full text-xs gap-1.5 mt-2">
                 <div className="flex justify-between font-medium text-slate-500">
                   <span>Score</span>
                   <span className="text-slate-800">{progressState?.score} points</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-green-500 h-full w-full"></div>
                 </div>
               </div>
             ) : inProgress ? (
               <div className="flex flex-col w-full text-xs gap-1.5 mt-2">
                 <div className="flex justify-between font-medium text-blue-600">
                   <span>In Progress</span>
                   <span>{amountAnswered} / {totalQuestions}</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div 
                     className="bg-blue-400 h-full rounded-full transition-all duration-500 max-w-full"
                     style={{ width: `${(amountAnswered / totalQuestions) * 100}%` }}
                   ></div>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full w-fit border border-blue-100">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                 </span>
                 Start Quiz
               </div>
             )
          ) : (
             <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-fit mt-2">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               Locked
             </div>
          )}
        </div>
      </div>
    </Link>
  );
}
