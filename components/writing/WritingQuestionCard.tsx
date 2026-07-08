"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnswerButtonList } from "@/components/common/AnswerButtonList";
import type { WritingQuestion } from "@/lib/types";

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  if (!keywords || keywords.length === 0) return text;

  // Generate stems for all keyword parts
  const stems = keywords.flatMap((kw) => {
    // Split multi-word keywords (e.g. "across from" -> ["across", "from"])
    return kw.split(/\s+/).map((word) => {
      const lower = word.toLowerCase();
      // Drop trailing 'e' for verbs/nouns to match inflections like -ing, -ed, -s (e.g., wipe -> wip)
      if (lower.endsWith("e") && lower.length > 2) {
        return lower.slice(0, -1);
      }
      return lower;
    });
  });

  // Tokenize text into words and non-words to preserve spaces/punctuation
  const tokens = text.split(/(\b[a-zA-Z]+\b)/g);

  return tokens.map((token, index) => {
    const isWord = /^[a-zA-Z]+$/.test(token);
    if (!isWord) return token;

    const lowerToken = token.toLowerCase();

    // Check if this word matches any of the stems
    const isKeyword = stems.some((stem) => {
      if (stem.length < 3) {
        return lowerToken === stem;
      }
      return lowerToken.startsWith(stem);
    });

    if (isKeyword) {
      return (
        <span
          key={index}
          className="text-amber-300 font-extrabold underline decoration-amber-500/40 underline-offset-2 decoration-2 bg-amber-500/5 px-0.5 rounded"
        >
          {token}
        </span>
      );
    }

    return token;
  });
}

interface WritingQuestionCardProps {
  question: WritingQuestion;
  isAnswered: boolean;
  selectedOptionIndex: number | null;
  onAnswer: (optionIndex: number, isCorrect: boolean) => void;
  onNext: () => void;
  showHint: boolean;
  onToggleHint: () => void;
  restartCount: number;
  isMuted?: boolean;
}

export function WritingQuestionCard({
  question,
  isAnswered,
  selectedOptionIndex,
  onAnswer,
  onNext,
  showHint,
  onToggleHint,
  restartCount,
  isMuted = false,
}: WritingQuestionCardProps) {
  const selectedOptionText = selectedOptionIndex !== null ? question.answerOptions[selectedOptionIndex]?.text : null;
  const correctOption = question.answerOptions.find((opt) => opt.isCorrect);
  const correctOptionText = correctOption?.text || "";

  const [loadedImageId, setLoadedImageId] = useState<string | null>(null);
  const imageLoaded = loadedImageId === question.id;

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-0 h-full">
      {/* Left side (Desktop): Topic/Keywords + 1:1 Image container */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between shrink-0 min-h-0 h-full space-y-3">
        {/* Header info (Topic & Keywords) */}
        <div className="text-xs space-y-1 bg-slate-950/40 p-2.5 border border-white/5 rounded-xl shrink-0">
          <div>
            <span className="font-bold text-slate-400">Chủ đề (Topic):</span>{" "}
            <span className="text-slate-200 font-semibold">{question.topic}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-400">Từ khóa (Keywords):</span>
            {question.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs font-black rounded-md border border-amber-500/20"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Flexible Image / Fallback Container */}
        {question.image ? (
          <div className="relative flex-1 min-h-[250px] lg:min-h-0 w-full rounded-xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-md group flex justify-center items-center">
            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
            
            {/* Actual Image using Next.js Image component */}
            <Image
              key={question.id}
              src={question.image}
              alt={question.scene}
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              priority={true}
              className={`object-cover transition-all duration-500 group-hover:scale-101 ${
                imageLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-98 blur-md"
              }`}
              onLoad={() => setLoadedImageId(question.id)}
            />

            {/* Subtle decorative overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/35 via-transparent to-transparent pointer-events-none" />
          </div>
        ) : (
          /* Fallback Text-only Box */
          <div className="relative p-6 bg-linear-to-br from-blue-500/5 to-purple-500/5 border border-white/10 rounded-2xl backdrop-blur-sm flex-1 min-h-[250px] lg:min-h-0 flex flex-col justify-center">
            <div className="absolute top-4 left-4 px-2 bg-slate-900 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              🖼️ Bối cảnh tranh
            </div>
            <p className="text-slate-200 leading-relaxed text-sm">{question.scene}</p>
          </div>
        )}

        {/* Description Caption at the very bottom of left column (shrink-0 guarantees it remains visible) */}
        {question.image && (
          <p className="text-xs text-slate-400 italic px-1 mt-1 shrink-0 line-clamp-2" title={question.scene}>
            <span className="font-semibold not-italic text-slate-300">Gợi ý bối cảnh:</span> {question.scene}
          </p>
        )}
      </div>

      {/* Right side (Desktop): Question details & Answer options */}
      <div className="flex-1 flex flex-col justify-between lg:overflow-y-auto lg:no-scrollbar space-y-4 pr-1 min-h-0">
        <div className="space-y-4">

          {/* Question Text */}
          <div className="space-y-1">
            <h3 className="text-base md:text-[17px] font-bold text-white leading-snug">
              {highlightKeywords(question.question, question.keywords)}
            </h3>
          </div>

          {/* Answer Options */}
          <div className="w-full">
            <AnswerButtonList
              options={question.answerOptions}
              selectedOptionId={selectedOptionText}
              correctOptionId={correctOptionText}
              isAnswered={isAnswered}
              onSelect={(optionText) => {
                const optionIndex = question.answerOptions.findIndex((opt) => opt.text === optionText);
                if (optionIndex !== -1) {
                  const isCorrect = question.answerOptions[optionIndex].isCorrect;
                  onAnswer(optionIndex, isCorrect);
                }
              }}
              isMuted={isMuted}
              restartCount={restartCount}
              stableKey={question.id}
              getOptionId={(opt) => opt.text}
              size="sm"
              renderContent={(opt, isSelected, isCorrect, showResult) => (
                <div className="w-full">
                  <span
                    className={`text-xs md:text-sm leading-snug wrap-break-word font-semibold transition-colors duration-300 ${
                      showResult && isCorrect
                        ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        : showResult && isSelected
                        ? "text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                        : "text-white group-hover:text-white"
                    }`}
                  >
                    {highlightKeywords(opt.text, question.keywords)}
                  </span>

                  {showResult && (
                    <div className="text-xs text-slate-450 animate-in fade-in slide-in-from-top-1 duration-200 mt-1.5">
                      {isCorrect && (
                        <div className="text-emerald-400 font-bold flex items-center gap-1 mb-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Chính xác!
                        </div>
                      )}
                      {isSelected && !isCorrect && (
                        <div className="text-rose-400 font-bold flex items-center gap-1 mb-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Chưa đúng
                        </div>
                      )}
                      <p className="leading-relaxed text-slate-350">{opt.rationale}</p>
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* Hint and Next Button Area */}
        <div className="space-y-2 pt-2 border-t border-white/5 shrink-0">
          {!isAnswered ? (
            <div className="space-y-2">
              <button
                onClick={onToggleHint}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
              </button>

              {showHint && (
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-xs text-blue-200 leading-relaxed">💡 {question.hint}</p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onNext}
              className="w-full py-2.5 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-violet-600/10 flex items-center justify-center gap-1.5 text-sm"
            >
              Câu tiếp theo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
