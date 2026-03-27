"use client";

import React from "react";

export interface ResultItem {
  id: string | number;
  isCorrect: boolean;
  title: string;
  subtitle?: string;
  onClickReview: () => void;
}

interface ResultSummaryProps {
  score: number;
  total: number;
  items: ResultItem[];
  onRestart: () => void;
  onExit: () => void;
  exitLabel?: string;
}

export function ResultSummary({
  score,
  total,
  items,
  onRestart,
  onExit,
  exitLabel = "Về Dashboard"
}: ResultSummaryProps) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[85vh] animate-in fade-in zoom-in-95 duration-300">
      
      {/* Modal Header */}
      <div className="px-6 py-6 lg:py-8 border-b border-slate-100 text-center shrink-0 bg-white relative">
        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-50/80 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 ring-4 ring-blue-50/50">
          <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-1 lg:mb-2">Hoàn thành bài tập!</h2>
        <p className="text-slate-500 font-medium">
          Kết quả: <strong className="text-blue-600 text-xl mx-0.5">
            {score}
          </strong> / {total}
        </p>
      </div>
      
      {/* Modal Body */}
      <div className="p-4 lg:p-6 overflow-y-auto bg-slate-50/50 flex-1 max-h-[50vh]">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Kết quả chi tiết</h3>
        <div className="flex flex-col gap-2.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={item.onClickReview}
              className={`flex items-center justify-between p-3.5 lg:p-4 cursor-pointer rounded-2xl border transition-transform hover:-translate-y-0.5 active:scale-95 ${item.isCorrect ? 'bg-green-50/60 border-green-200 text-green-700 hover:bg-green-50' : 'bg-red-50/60 border-red-200 text-red-700 hover:bg-red-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.isCorrect ? 'bg-green-100' : 'bg-red-100/80'}`}>
                   {item.isCorrect ? (
                     <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   ) : (
                     <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                   )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-sm lg:text-base">{item.title}</span>
                  {item.subtitle && <span className="text-xs opacity-70 line-clamp-1 mt-0.5">{item.subtitle}</span>}
                </div>
              </div>
              
              <div className="text-xs lg:text-sm font-semibold flex items-center gap-1 opacity-80 shrink-0">
                Xem lại
                <svg className="w-4 h-4 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 lg:p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0">
        <button 
          onClick={onRestart} 
          className="flex-[0.4] py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm lg:text-base cursor-pointer"
        >
          Làm lại
        </button>
        <button 
          onClick={onExit}
          className="flex-1 py-3.5 flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-xl shadow-blue-600/20 text-sm lg:text-base cursor-pointer"
        >
          {exitLabel}
        </button>
      </div>
    </div>
  );
}
