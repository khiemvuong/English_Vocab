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
    hoverBorder: 'hover:border-white/30 hover:ring-2 hover:ring-white/10',
    hoverShadow: 'hover:shadow-black/40',
    cardBg: 'bg-slate-900/40 backdrop-blur-md border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    titleText: 'text-white',
    subtitleText: 'text-slate-300',
    tagText: 'text-zinc-400',
    progressBg: 'bg-white/80',
    progressText: 'text-white font-semibold',
    scoreLabel: 'text-slate-400',
    scoreText: 'text-white',
    startButtonBg: 'bg-white/10 hover:bg-white/20 backdrop-blur-xs transition-colors duration-200',
    startButtonText: 'text-white',
    startButtonBorder: 'border-white/20',
    startPing: 'bg-white/40',
    startDot: 'bg-white',
    flareBg: 'bg-linear-to-tl from-white/5 via-white/0 to-transparent',
  },
  amber: {
    hoverBorder: 'hover:border-white/30 hover:ring-2 hover:ring-white/10',
    hoverShadow: 'hover:shadow-black/40',
    cardBg: 'bg-slate-900/40 backdrop-blur-md border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    titleText: 'text-white',
    subtitleText: 'text-slate-300',
    tagText: 'text-zinc-400',
    progressBg: 'bg-white/80',
    progressText: 'text-white font-semibold',
    scoreLabel: 'text-slate-400',
    scoreText: 'text-white',
    startButtonBg: 'bg-white/10 hover:bg-white/20 backdrop-blur-xs transition-colors duration-200',
    startButtonText: 'text-white',
    startButtonBorder: 'border-white/20',
    startPing: 'bg-white/40',
    startDot: 'bg-white',
    flareBg: 'bg-linear-to-tl from-white/5 via-white/0 to-transparent',
  },
  emerald: {
    hoverBorder: 'hover:border-white/30 hover:ring-2 hover:ring-white/10',
    hoverShadow: 'hover:shadow-black/40',
    cardBg: 'bg-slate-900/40 backdrop-blur-md border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    titleText: 'text-white',
    subtitleText: 'text-slate-300',
    tagText: 'text-zinc-400',
    progressBg: 'bg-white/80',
    progressText: 'text-white font-semibold',
    scoreLabel: 'text-slate-400',
    scoreText: 'text-white',
    startButtonBg: 'bg-white/10 hover:bg-white/20 backdrop-blur-xs transition-colors duration-200',
    startButtonText: 'text-white',
    startButtonBorder: 'border-white/20',
    startPing: 'bg-white/40',
    startDot: 'bg-white',
    flareBg: 'bg-linear-to-tl from-white/5 via-white/0 to-transparent',
  },
  purple: {
    hoverBorder: 'hover:border-white/30 hover:ring-2 hover:ring-white/10',
    hoverShadow: 'hover:shadow-black/40',
    cardBg: 'bg-slate-900/40 backdrop-blur-md border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    titleText: 'text-white',
    subtitleText: 'text-slate-300',
    tagText: 'text-zinc-400',
    progressBg: 'bg-white/80',
    progressText: 'text-white font-semibold',
    scoreLabel: 'text-slate-400',
    scoreText: 'text-white',
    startButtonBg: 'bg-white/10 hover:bg-white/20 backdrop-blur-xs transition-colors duration-200',
    startButtonText: 'text-white',
    startButtonBorder: 'border-white/20',
    startPing: 'bg-white/40',
    startDot: 'bg-white',
    flareBg: 'bg-linear-to-tl from-white/5 via-white/0 to-transparent',
  },
  orange: {
    hoverBorder: 'hover:border-white/30 hover:ring-2 hover:ring-white/10',
    hoverShadow: 'hover:shadow-black/40',
    cardBg: 'bg-slate-900/40 backdrop-blur-md border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    titleText: 'text-white',
    subtitleText: 'text-slate-300',
    tagText: 'text-zinc-400',
    progressBg: 'bg-white/80',
    progressText: 'text-white font-semibold',
    scoreLabel: 'text-slate-400',
    scoreText: 'text-white',
    startButtonBg: 'bg-white/10 hover:bg-white/20 backdrop-blur-xs transition-colors duration-200',
    startButtonText: 'text-white',
    startButtonBorder: 'border-white/20',
    startPing: 'bg-white/40',
    startDot: 'bg-white',
    flareBg: 'bg-linear-to-tl from-white/5 via-white/0 to-transparent',
  }
};

type ThemeValue = typeof THEME_MAP[keyof typeof THEME_MAP];

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
            ? 'border-white/5 opacity-40 cursor-not-allowed bg-slate-900/20 backdrop-blur-xs' 
            : `border-white/10 cursor-pointer hover:-translate-y-1 ${theme.cardBg} ${theme.hoverBorder} ${theme.hoverShadow}`}`}
      >
        {/* Decorative Light Flare */}
        {('flareBg' in theme) && (
          <div 
            className={`absolute bottom-0 right-0 w-2/3 md:w-1/2 h-full pointer-events-none opacity-50 ${(theme as ThemeValue & { flareBg: string }).flareBg}`} 
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
                 <div className="flex flex-wrap justify-between items-center font-semibold text-slate-350 gap-y-1">
                   <span className="flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                     <span className="text-emerald-400 font-bold whitespace-nowrap">{score} đúng</span>
                     <span className="text-slate-600">•</span>
                     <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                     <span className="text-rose-400 font-bold whitespace-nowrap">{(totalQuestions - score)} sai</span>
                   </span>
                   <span className="text-white font-bold">{Math.round((score / totalQuestions) * 100)}%</span>
                 </div>
                 <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex border border-white/5 shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.5)]">
                   <div 
                     className="bg-linear-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                     style={{ width: `${(score / totalQuestions) * 100}%` }}
                   />
                   <div 
                     className="bg-linear-to-r from-rose-600 to-rose-400 h-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" 
                     style={{ width: `${((totalQuestions - score) / totalQuestions) * 100}%` }}
                   />
                 </div>
               </div>
             ) : inProgress ? (
               <div className="flex flex-col w-full text-xs gap-1.5 mt-2">
                 <div className="flex flex-wrap justify-between items-center font-semibold text-slate-350 gap-y-1">
                   <span className="text-slate-400 font-bold whitespace-nowrap">Đang làm: {amountAnswered} / {totalQuestions}</span>
                   <span className="text-white font-bold">{Math.round((amountAnswered / totalQuestions) * 100)}%</span>
                 </div>
                 <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden relative border border-white/5 shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.5)]">
                   <div 
                     className="bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(29,111,251,0.4)] relative overflow-hidden"
                     style={{ width: `${Math.min(100, Math.max(0, (amountAnswered / totalQuestions) * 100))}%` }}
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
             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-900/40 px-3 py-1.5 rounded-full w-fit mt-2 border border-white/5">
               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               Locked
             </div>
          )}
        </div>
        
        {/* Sheen animation global styles definition */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes progress-sheen {
            0% { transform: translateX(-110%); }
            100% { transform: translateX(210%); }
          }
          .animate-progress-sheen {
            animation: progress-sheen 2s linear infinite;
          }
        `}} />
      </div>
    </Link>
  );
}
