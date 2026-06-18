"use client";

import { useMemo } from "react";

import { getDeterministicShuffle } from "@/utils/shuffle";

export interface AnswerButtonListProps<T> {
  options: T[];
  selectedOptionId: string | null;
  correctOptionId: string;
  isAnswered: boolean;
  onSelect: (optionId: string) => void;
  isMuted?: boolean;
  restartCount?: number;
  stableKey?: string; // used for PRNG seed
  
  // Render Prop so we can custom render the inside of the button container
  renderContent: (option: T, isSelected: boolean, isCorrect: boolean, showResult: boolean) => React.ReactNode;
  // Extract an ID to compare selected/correct
  getOptionId: (option: T) => string;

  // Layout size
  size?: "default" | "sm";
}

export function AnswerButtonList<T>({
  options,
  selectedOptionId,
  correctOptionId,
  isAnswered,
  onSelect,
  restartCount = 0,
  stableKey = "default",
  renderContent,
  getOptionId,
  size = "default"
}: AnswerButtonListProps<T>) {

  const displayOptions = useMemo(() => {
    return getDeterministicShuffle(options, restartCount, stableKey);
  }, [options, restartCount, stableKey]);

  const handleSelect = (option: T) => {
    if (isAnswered) return;
    const optionId = getOptionId(option);
    onSelect(optionId);
  };

    return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${size === "sm" ? "gap-2 sm:gap-3" : "gap-3"}`}>
      {displayOptions.map((optObj, i) => {
        const optionId = getOptionId(optObj);
        const letter = ["A", "B", "C", "D", "E", "F"][i]; // matches up to 6 options flexibly
        const isSelected = selectedOptionId === optionId;
        const isCorrectOption = optionId === correctOptionId;
        const showResult = isAnswered;

        let className =
          `group flex items-start ${size === "sm" ? "gap-3 p-3 rounded-xl" : "gap-4 p-4 rounded-xl"} border transition-all duration-300 ease-out cursor-pointer text-left w-full relative overflow-hidden`;

        if (!showResult) {
          className += " border-white/15 bg-slate-900/50 backdrop-blur-xl text-white shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-white/30 hover:bg-slate-800/60 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,255,255,0.06)] hover:ring-1 hover:ring-white/15 active:scale-[0.98]";
        } else if (isCorrectOption) {
          className += " border-emerald-500 bg-emerald-500/10 backdrop-blur-xl text-white ring-1 ring-emerald-400/30 shadow-[0_8px_32px_rgba(16,185,129,0.2)]";
        } else if (isSelected && !isCorrectOption) {
          className += " border-rose-500 bg-rose-500/10 backdrop-blur-xl text-white ring-1 ring-rose-400/30 shadow-[0_8px_32px_rgba(244,63,94,0.2)]";
        } else {
          className += " border-white/5 bg-slate-950/20 opacity-45 text-white/60 backdrop-blur-sm";
        }

        return (
          <div
            key={optionId}
            id={`option-btn-${optionId}`} // useful for global keydown binding if needed
            onClick={() => handleSelect(optObj)}
            className={className}
            role="button"
            tabIndex={0}
          >
            {/* Subtle glassmorphic decorative flare inside each card */}
            <div className="absolute inset-0 pointer-events-none bg-linear-to-tr from-white/1 via-transparent to-white/4 opacity-40 transition-opacity duration-300 group-hover:opacity-100" />

            <span
              className={`${size === "sm" ? "w-6 h-6 md:w-7 md:h-7 text-xs" : "w-8 h-8 text-sm"} rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 transition-all duration-300 z-10 ${
                showResult && isCorrectOption
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : showResult && isSelected
                  ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  : "bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:text-white group-hover:scale-105"
              }`}
            >
              {letter}
            </span>
            
            <div className="flex flex-col flex-1 text-left min-w-0 z-10">
              {renderContent(optObj, isSelected, isCorrectOption, showResult)}
            </div>

            {showResult && isCorrectOption && (
              <svg className="w-5 h-5 ml-auto text-emerald-500 shrink-0 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {showResult && isSelected && !isCorrectOption && (
              <svg className="w-5 h-5 ml-auto text-red-500 shrink-0 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
