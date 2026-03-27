"use client";

import { AudioButton } from "@/components/common/AudioButton";
import type { ScenarioOption } from "@/lib/types";
import { AnswerButtonList } from "@/components/common/AnswerButtonList";

interface ScenarioOptionGridProps {
  options: (string | ScenarioOption)[];
  selectedOption: string | null;
  correctAnswer: string;
  isAnswered: boolean;
  onSelect: (option: string) => void;
  isMuted?: boolean;
  restartCount?: number;
  blankKey?: string;
}

export function ScenarioOptionGrid({
  options,
  selectedOption,
  correctAnswer,
  isAnswered,
  onSelect,
  isMuted = false,
  restartCount = 0,
  blankKey = "default"
}: ScenarioOptionGridProps) {
  return (
    <AnswerButtonList
      options={options}
      selectedOptionId={selectedOption}
      correctOptionId={correctAnswer}
      isAnswered={isAnswered}
      onSelect={onSelect}
      isMuted={isMuted}
      restartCount={restartCount}
      stableKey={blankKey}
      getOptionId={(optObj) => (typeof optObj === 'string' ? optObj : optObj.text)}
      renderContent={(optObj, isSelected, isCorrectOption, showResult) => {
        const optionText = typeof optObj === 'string' ? optObj : optObj.text;
        return (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold text-[15px] leading-snug wrap-break-word ${showResult && isCorrectOption ? 'text-emerald-900' : (showResult && isSelected ? 'text-red-900' : 'text-slate-700')}`}>
                {optionText}
              </span>
              {showResult && (
                <AudioButton 
                  text={optionText}
                  className={`p-1 rounded-full transition-colors hover:text-indigo-600 bg-slate-100/80 hover:bg-slate-200 ${showResult && isCorrectOption ? "text-emerald-700" : showResult && isSelected ? "text-red-700" : "text-slate-500"}`}
                  iconClassName="w-3.5 h-3.5"
                />
              )}
            </div>
            
            {showResult && typeof optObj !== 'string' && optObj.phonetic && optObj.meaning && (
              <div className="flex flex-col animate-in fade-in duration-300 gap-0.5">
                <span className={`text-[13px] font-mono tracking-tight ${isCorrectOption ? "text-emerald-700/80" : isSelected ? "text-red-700/80" : "text-slate-500"}`}>
                  {optObj.phonetic}
                </span>
                <span className={`text-[13.5px] font-medium leading-snug ${isCorrectOption ? "text-emerald-800/90" : isSelected ? "text-red-800/90" : "text-slate-600"}`}>
                  {optObj.meaning}
                </span>
              </div>
            )}
          </>
        );
      }}
    />
  );
}
