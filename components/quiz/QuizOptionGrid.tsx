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
            <span className={`text-[15px] md:text-base leading-snug wrap-break-word mt-0.5 ${showResult && isCorrect ? 'text-green-900 font-medium' : (showResult && isSelected ? 'text-red-900 font-medium' : 'text-slate-700')}`}>
              {renderFormattedText(opt.text)}
            </span>
            
            {showResult && (
              <div className="text-sm text-slate-600 animate-in fade-in slide-in-from-top-2 duration-300">
                {isCorrect && <div className="text-green-600 font-medium flex items-center gap-1.5 mb-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  That&apos;s right!
                </div>}
                {isSelected && !isCorrect && <div className="text-red-600 font-medium flex items-center gap-1.5 mb-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Incorrect
                </div>}
                <p className={`leading-relaxed ${isSelected || isCorrect ? 'text-slate-700' : 'text-slate-500'}`}>{opt.rationale}</p>
              </div>
            )}
          </>
        );
      }}
    />
  );
}
