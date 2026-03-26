"use client";

import Link from "next/link";
import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";

interface PracticeCardProps {
  testId: string;
  testLabel: string;
  questionRange: string;
  isAvailable: boolean;
  hasScenarios?: boolean;
}

export function PracticeCard({ testId, testLabel, questionRange, isAvailable, hasScenarios }: PracticeCardProps) {
  const [mounted, setMounted] = useState(false);
  const progressState = useQuizStore(state => state.progress[`part5-${testId}`]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isCompleted = mounted && progressState?.isFinished;
  const amountAnswered = mounted && progressState?.answers ? Object.keys(progressState.answers).length : 0;
  const totalQuestions = mounted && progressState?.totalQuestions ? progressState.totalQuestions : 30;
  const inProgress = mounted && !isCompleted && amountAnswered > 0;

  return (
    <Link href={isAvailable ? `/part5/${testId}` : "#"} prefetch={false}>
      <div
        className={`flex flex-col h-full bg-white border rounded-2xl p-5 md:p-6 transition-all duration-300 relative overflow-hidden
          ${!isAvailable
            ? 'border-slate-100 opacity-60 cursor-not-allowed bg-slate-50/50'
            : 'border-slate-200 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-900/5 cursor-pointer hover:-translate-y-1'}`}
      >
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {testLabel}
          </span>

          {isCompleted && (
            <div className="bg-green-100 text-green-600 rounded-full p-1 border border-green-200">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
        </div>

        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-1">
          Part 5
        </h2>
        <p className="text-xs text-slate-400 font-medium mb-2">{questionRange}</p>
        {hasScenarios && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 mb-3">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Tình Huống
          </span>
        )}

        <div className="mt-auto flex flex-col items-start gap-2">
          {isAvailable ? (
             isCompleted ? (
               <div className="flex flex-col w-full text-xs gap-1.5 mt-2">
                 <div className="flex justify-between font-medium text-slate-500">
                   <span>Score</span>
                   <span className="text-slate-800">{progressState?.score}/{totalQuestions}</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-green-500 h-full w-full"></div>
                 </div>
               </div>
             ) : inProgress ? (
               <div className="flex flex-col w-full text-xs gap-1.5 mt-2">
                 <div className="flex justify-between font-medium text-amber-600">
                   <span>In Progress</span>
                   <span>{amountAnswered} / {totalQuestions}</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div
                     className="bg-amber-400 h-full rounded-full transition-all duration-500 max-w-full"
                     style={{ width: `${(amountAnswered / totalQuestions) * 100}%` }}
                   ></div>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit border border-amber-100">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                 </span>
                 Làm bài
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
