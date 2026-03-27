"use client";

import { useMemo } from "react";

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
}

export function AnswerButtonList<T>({
  options,
  selectedOptionId,
  correctOptionId,
  isAnswered,
  onSelect,
  isMuted = false,
  restartCount = 0,
  stableKey = "default",
  renderContent,
  getOptionId
}: AnswerButtonListProps<T>) {

  const displayOptions = useMemo(() => {
    if (restartCount === 0 || !options || options.length === 0) return options || [];
    
    let hash = 0;
    const str = stableKey + restartCount;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    const pseudoRandom = () => {
        hash = Math.imul(741103597, hash) + 1 | 0;
        let t = Math.imul(hash ^ (hash >>> 15), 1597334677);
        t = (t ^ (t >>> 15)) * (1.0 / 4294967296);
        return t + 0.5;
    };

    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [options, restartCount, stableKey]);

  const handleSelect = (option: T) => {
    if (isAnswered) return;
    const optionId = getOptionId(option);
    onSelect(optionId);
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3`}>
      {displayOptions.map((optObj, i) => {
        const optionId = getOptionId(optObj);
        const letter = ["A", "B", "C", "D", "E", "F"][i]; // matches up to 6 options flexibly
        const isSelected = selectedOptionId === optionId;
        const isCorrectOption = optionId === correctOptionId;
        const showResult = isAnswered;

        let className =
          "flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left w-full";

        if (!showResult) {
          className += " border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98]";
        } else if (isCorrectOption) {
          className += " border-emerald-300 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/20";
        } else if (isSelected && !isCorrectOption) {
          className += " border-red-300 bg-red-50 text-red-700 ring-1 ring-red-500/20";
        } else {
          className += " border-slate-100 bg-white/50 opacity-50";
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
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                showResult && isCorrectOption
                  ? "bg-emerald-500 text-white"
                  : showResult && isSelected
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {letter}
            </span>
            
            <div className="flex flex-col flex-1 text-left min-w-0">
              {renderContent(optObj, isSelected, isCorrectOption, showResult)}
            </div>

            {showResult && isCorrectOption && (
              <svg className="w-5 h-5 ml-auto text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {showResult && isSelected && !isCorrectOption && (
              <svg className="w-5 h-5 ml-auto text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
