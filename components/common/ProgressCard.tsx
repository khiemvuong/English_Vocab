import Link from "next/link";
import React from "react";

export type CardColorTheme = 'blue' | 'amber' | 'emerald' | 'purple' | 'orange';

export interface ProgressCardProps {
  href: string;
  tagLabel: string;
  mainTitle: string | React.ReactNode;
  subtitle?: React.ReactNode;
  
  isAvailable?: boolean;
  
  isCompleted?: boolean;
  amountAnswered?: number;
  totalQuestions?: number;
  score?: number;
  
  colorTheme?: CardColorTheme;
  customBadge?: React.ReactNode;
  startLabel?: string;
  watermarkText?: string;
  patternTheme?: 'notebook' | 'dots' | 'none';
  
  className?: string;
}

const THEME_MAP = {
  blue: {
    hoverBorder: 'hover:border-blue-300',
    hoverShadow: 'hover:shadow-blue-900/10',
    cardBg: 'bg-linear-to-br from-white via-white to-blue-50/50',
    titleText: 'text-slate-800',
    subtitleText: 'text-slate-500',
    tagText: 'text-slate-400',
    progressBg: 'bg-blue-400',
    progressText: 'text-blue-600',
    scoreLabel: 'text-slate-500',
    scoreText: 'text-slate-800',
    startButtonBg: 'bg-blue-50',
    startButtonText: 'text-blue-700',
    startButtonBorder: 'border-blue-100',
    startPing: 'bg-blue-400',
    startDot: 'bg-blue-500',
  },
  amber: {
    hoverBorder: 'hover:border-amber-300',
    hoverShadow: 'hover:shadow-amber-900/10',
    cardBg: 'bg-linear-to-br from-white via-white to-amber-50/50',
    titleText: 'text-slate-800',
    subtitleText: 'text-slate-500',
    tagText: 'text-slate-400',
    progressBg: 'bg-amber-400',
    progressText: 'text-amber-600',
    scoreLabel: 'text-slate-500',
    scoreText: 'text-slate-800',
    startButtonBg: 'bg-amber-50',
    startButtonText: 'text-amber-700',
    startButtonBorder: 'border-amber-100',
    startPing: 'bg-amber-400',
    startDot: 'bg-amber-500',
  },
  emerald: {
    hoverBorder: 'hover:border-emerald-300 hover:ring-2 hover:ring-emerald-200/50',
    hoverShadow: 'hover:shadow-emerald-900/15',
    cardBg: 'bg-emerald-50/50 backdrop-blur-xl border-emerald-200/70 shadow-[0_8px_30px_rgb(16,185,129,0.08)]',
    titleText: 'text-slate-800',
    subtitleText: 'text-slate-500',
    tagText: 'text-emerald-700',
    progressBg: 'bg-emerald-400',
    progressText: 'text-emerald-600',
    scoreLabel: 'text-slate-500',
    scoreText: 'text-slate-800',
    startButtonBg: 'bg-emerald-100/60 backdrop-blur-sm',
    startButtonText: 'text-emerald-700',
    startButtonBorder: 'border-emerald-200 shadow-sm shadow-emerald-900/5',
    startPing: 'bg-emerald-400',
    startDot: 'bg-emerald-500',
    flareBg: 'bg-linear-to-tl from-emerald-400/60 via-emerald-300/20 to-emerald-100/5',
  },
  purple: {
    hoverBorder: 'hover:border-purple-300',
    hoverShadow: 'hover:shadow-purple-900/10',
    cardBg: 'bg-gradient-to-br from-white via-white to-purple-50/50',
    titleText: 'text-slate-800',
    subtitleText: 'text-slate-500',
    tagText: 'text-slate-400',
    progressBg: 'bg-purple-400',
    progressText: 'text-purple-600',
    scoreLabel: 'text-slate-500',
    scoreText: 'text-slate-800',
    startButtonBg: 'bg-purple-50',
    startButtonText: 'text-purple-700',
    startButtonBorder: 'border-purple-100',
    startPing: 'bg-purple-400',
    startDot: 'bg-purple-500',
  },
  orange: {
    hoverBorder: 'hover:border-orange-300',
    hoverShadow: 'hover:shadow-orange-900/10',
    cardBg: 'bg-gradient-to-br from-white via-white to-orange-50/50',
    titleText: 'text-slate-800',
    subtitleText: 'text-slate-500',
    tagText: 'text-slate-400',
    progressBg: 'bg-orange-400',
    progressText: 'text-orange-600',
    scoreLabel: 'text-slate-500',
    scoreText: 'text-slate-800',
    startButtonBg: 'bg-orange-50',
    startButtonText: 'text-orange-700',
    startButtonBorder: 'border-orange-100',
    startPing: 'bg-orange-400',
    startDot: 'bg-orange-500',
  }
};

export function ProgressCard({
  href,
  tagLabel,
  mainTitle,
  subtitle,
  isAvailable = true,
  isCompleted = false,
  amountAnswered = 0,
  totalQuestions = 1,
  score = 0,
  colorTheme = 'blue',
  customBadge,
  startLabel = "Bắt đầu",
  watermarkText,
  patternTheme,
  className = ""
}: ProgressCardProps) {
  
  const inProgress = !isCompleted && amountAnswered > 0;
  const theme = THEME_MAP[colorTheme] || THEME_MAP.blue;
  
  return (
    <Link href={isAvailable ? href : "#"} prefetch={false} className={className}>
      <div 
        className={`flex flex-col h-full border rounded-2xl p-5 md:p-6 transition-all duration-300 relative overflow-hidden
          ${!isAvailable 
            ? 'border-slate-100 opacity-60 cursor-not-allowed bg-slate-50/50' 
            : `border-slate-200 cursor-pointer hover:-translate-y-1 ${theme.cardBg} ${theme.hoverBorder} ${theme.hoverShadow}`}`}
      >
        {/* Decorative Light Flare */}
        {(theme as any).flareBg && (
          <div 
            className={`absolute bottom-0 right-0 w-2/3 md:w-1/2 h-full pointer-events-none opacity-50 ${(theme as any).flareBg}`} 
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
          />
        )}

        {/* Notebook Paper Overlay Pattern */}
        {patternTheme === 'notebook' && (
          <div 
            className={`absolute inset-0 pointer-events-none ${isAvailable ? 'opacity-[0.04]' : 'opacity-0'}`}
            style={{ 
              backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 23px, currentColor 23px, currentColor 24px)',
              backgroundSize: '100% 24px',
              backgroundPosition: '0 12px'
            }}
          />
        )}

        {/* Typographic Watermark */}
        {watermarkText && (
          <div className="absolute -bottom-6 right-2 md:right-8 text-[120px] md:text-[180px] font-serif font-black leading-none opacity-[0.03] md:opacity-[0.04] pointer-events-none select-none rotate-[-8deg] z-0">
            {watermarkText}
          </div>
        )}

        <div className="flex justify-between items-start mb-3 relative z-10">
          <span className={`text-xs font-semibold uppercase tracking-wider ${theme.tagText || 'text-slate-400'}`}>
            {tagLabel}
          </span>
          
          {isCompleted && (
            <div className="bg-green-100 text-green-600 rounded-full p-1 border border-green-200 shrink-0 ml-2 shadow-sm">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
        </div>

        <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-1 line-clamp-2 relative z-10 ${theme.titleText || 'text-slate-800'}`}>
          {mainTitle}
        </h2>
        
        {subtitle && (
          <p className={`text-xs font-medium mb-3 relative z-10 ${theme.subtitleText || 'text-slate-400'}`}>{subtitle}</p>
        )}
        
        {customBadge && (
          <div className="mb-3 relative z-10">
            {customBadge}
          </div>
        )}

        <div className="mt-auto flex flex-col items-start gap-2 pt-2 relative z-10">
          {isAvailable ? (
             isCompleted ? (
               <div className="flex flex-col w-full text-xs gap-1.5 mt-2">
                 <div className={`flex justify-between font-medium ${theme.scoreLabel || 'text-slate-500'}`}>
                   <span>Score</span>
                   <span className={`font-bold ${theme.scoreText || 'text-slate-800'}`}>{score} / {totalQuestions}</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-green-500 h-full w-full"></div>
                 </div>
               </div>
             ) : inProgress ? (
               <div className="flex flex-col w-full text-xs gap-1.5 mt-2">
                 <div className={`flex justify-between font-bold ${theme.progressText}`}>
                   <span>In Progress</span>
                   <span>{amountAnswered} / {totalQuestions}</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div 
                     className={`${theme.progressBg} h-full rounded-full transition-all duration-500 max-w-full`}
                     style={{ width: `${Math.min(100, Math.max(0, (amountAnswered / totalQuestions) * 100))}%` }}
                   ></div>
                 </div>
               </div>
             ) : (
               <div className={`flex items-center gap-1.5 text-xs font-bold ${theme.startButtonText} ${theme.startButtonBg} px-3 py-1.5 rounded-full w-fit border ${theme.startButtonBorder}`}>
                 <span className="relative flex h-2 w-2">
                   <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.startPing} opacity-75`}></span>
                   <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.startDot}`}></span>
                 </span>
                 {startLabel}
               </div>
             )
          ) : (
             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full w-fit mt-2">
               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               Locked
             </div>
          )}
        </div>
      </div>
    </Link>
  );
}
