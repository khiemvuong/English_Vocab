"use client";

import React from "react";

interface QuizHeaderProps {
  titleText: React.ReactNode;
  subtitleText?: React.ReactNode;
  progressPercent: number; // 0 to 100
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function QuizHeader({
  titleText,
  subtitleText,
  progressPercent,
  isMuted,
  onToggleMute,
  onRestart,
  onExit
}: QuizHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between mb-4 md:mb-6 shrink-0 gap-y-3">
      {/* Left: Info */}
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">
        {titleText}
        {subtitleText && (
          <>
            <span className="mx-1.5 text-slate-600">•</span>
            {subtitleText}
          </>
        )}
      </div>

      {/* Center: Progress Bar */}
      <div className="flex-1 flex justify-center w-full min-w-[150px] order-3 md:order-2 md:w-auto px-2 md:px-0">
        <div className="w-full max-w-[200px] h-1.5 bg-slate-900 rounded-full overflow-hidden relative border border-white/5 shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.5)]">
          <div
            className="bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-400 h-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(29,111,251,0.4)] relative overflow-hidden"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          >
            {/* Glossy sheen reflection sweep */}
            <span 
              className="absolute inset-y-0 left-0 w-1/2 rounded-full animate-progress-sheen pointer-events-none"
              style={{ 
                background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)",
                mixBlendMode: "screen"
              }}
            />
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center justify-end gap-2.5 order-2 md:order-3 shrink-0">
        <button 
          onClick={onRestart}
          className="p-1.5 text-white/70 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center h-8 w-8 cursor-pointer"
          title="Làm lại từ đầu"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button 
          onClick={onToggleMute}
          className="p-1.5 text-white/70 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center h-8 w-8 cursor-pointer"
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          )}
        </button>
        <button
          onClick={onExit}
          title="Thoát"
          className="flex items-center gap-1.5 px-3 py-1.5 text-white/80 bg-white/5 border border-white/10 hover:text-red-400 hover:border-red-500/20 rounded-full transition-colors cursor-pointer"
        >
          <span className="text-sm font-bold">Thoát</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress-sheen {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(210%); }
        }
        .animate-progress-sheen {
          animation: progress-sheen 2s linear infinite;
        }
      `}} />
    </header>
  );
}
