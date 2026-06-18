"use client";

import { renderFormattedText } from "@/utils/textFormatting";
import { AnswerButtonList } from "@/components/common/AnswerButtonList";

interface QuizOption {
  text: string;
  isCorrect: boolean;
  rationale?: string;
}

interface QuizOptionGridProps {
  options: QuizOption[];
  selectedOptionText: string | null;
  correctOptionText: string;
  isAnswered: boolean;
  onSelect: (optionText: string) => void;
  isMuted?: boolean;
  restartCount?: number;
  stableKey?: string;
}

export function QuizOptionGrid({
  options,
  selectedOptionText,
  correctOptionText,
  isAnswered,
  onSelect,
  isMuted = false,
  restartCount = 0,
  stableKey = "default"
}: QuizOptionGridProps) {
  return (
    <AnswerButtonList
      options={options}
      selectedOptionId={selectedOptionText}
      correctOptionId={correctOptionText}
      isAnswered={isAnswered}
      onSelect={onSelect}
      isMuted={isMuted}
      restartCount={restartCount}
      stableKey={stableKey}
      getOptionId={(opt) => opt.text}
      renderContent={(opt, isSelected, isCorrect, showResult) => {
        return (
          <>
            <span className={`text-[15px] md:text-base leading-snug wrap-break-word mt-0.5 font-semibold transition-colors duration-300 ${
              showResult && isCorrect 
                ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                : (showResult && isSelected 
                  ? 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                  : 'text-white group-hover:text-white')
            }`}>
              {renderFormattedText(opt.text)}
            </span>
            
            {showResult && (
              <div className="text-sm text-slate-400 animate-in fade-in slide-in-from-top-2 duration-300 mt-2">
                {isCorrect && (
                  <div className="text-emerald-400 font-medium flex items-center gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    That&apos;s right!
                  </div>
                )}
                {isSelected && !isCorrect && (
                  <div className="text-rose-400 font-medium flex items-center gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    Incorrect
                  </div>
                )}
                <p className={`leading-relaxed ${isSelected || isCorrect ? 'text-slate-200' : 'text-slate-500'}`}>{opt.rationale}</p>
              </div>
            )}
          </>
        );
      }}
    />
  );
}
