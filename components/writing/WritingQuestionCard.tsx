"use client";

import React, { useState } from "react";
import { AnswerButtonList } from "@/components/common/AnswerButtonList";
import type { WritingQuestion, PhraseOption } from "@/lib/types";

import { verb, noun, adjective } from "wink-lemmatizer";

interface DisplayOption {
  text: string;
  isCorrect: boolean;
  meaning?: string;
  rationale?: string;
}

function getLemmas(word: string): string[] {
  const w = word.toLowerCase();
  const cleanW = w.replace(/[^\w]/g, "");
  if (!cleanW) return [w];
  return Array.from(new Set([cleanW, verb(cleanW), noun(cleanW), adjective(cleanW)]));
}

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  if (!keywords || keywords.length === 0) return text;

  // Precompute lemma sets for each keyword
  const keywordLemmaSets = keywords.map((kw) => {
    return kw.split(/\s+/).flatMap((word) => getLemmas(word));
  });

  // Tokenize text into words and non-words to preserve spaces/punctuation
  const tokens = text.split(/(\b[a-zA-Z]+\b)/g);

  return tokens.map((token, index) => {
    const isWord = /^[a-zA-Z]+$/.test(token);
    if (!isWord) return token;

    const tokenLemmas = getLemmas(token);

    // Check if this token matches any of the keywords
    const isKeyword = keywordLemmaSets.some((kwLemmas) => {
      return tokenLemmas.some((tl) => kwLemmas.includes(tl));
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

interface DiffSegment {
  value: string;
  type: "match" | "removed" | "added";
}

function wordDiff(text1: string, text2: string): DiffSegment[] {
  // Normalize: trim and strip trailing punctuation/spaces
  const clean1 = text1.trim().replace(/[.,!?\s]+$/, "");
  const clean2 = text2.trim().replace(/[.,!?\s]+$/, "");

  const tokenize = (text: string): string[] => {
    // Keep contractions like don't, it's, doesn't as single words
    const regex = /(\w+(?:'\w+)?)|([^\w\s]+)|(\s+)/g;
    const tokens: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  };

  const t1 = tokenize(clean1);
  const t2 = tokenize(clean2);

  const n = t1.length;
  const m = t2.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (t1[i - 1].toLowerCase() === t2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n;
  let j = m;
  const result: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && t1[i - 1].toLowerCase() === t2[j - 1].toLowerCase()) {
      // Treat case-insensitive matches as perfect matches (no capitalization penalty)
      result.push({ value: t1[i - 1], type: "match" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ value: t2[j - 1], type: "added" });
      j--;
    } else {
      result.push({ value: t1[i - 1], type: "removed" });
      i--;
    }
  }

  return result.reverse();
}

function DiffViewer({ userText, targetText }: { userText: string; targetText: string }) {
  const diffs = wordDiff(userText, targetText);
  return (
    <span className="inline flex-wrap leading-relaxed font-medium">
      {diffs.map((segment, idx) => {
        if (segment.type === "match") {
          return <span key={idx} className="text-slate-350">{segment.value}</span>;
        } else if (segment.type === "removed") {
          return (
            <span
              key={idx}
              className="text-rose-455 line-through bg-rose-500/15 border border-rose-500/10 px-0.5 rounded mx-0.5 font-bold cursor-help"
              title="Từ dư thừa hoặc sai chính tả"
            >
              {segment.value}
            </span>
          );
        } else {
          return (
            <span
              key={idx}
              className="text-emerald-400 bg-emerald-500/15 border border-dashed border-emerald-500/30 px-1 py-0.5 rounded mx-0.5 font-extrabold cursor-help inline-block animate-pulse duration-1000"
              title="Từ/Ký tự bị thiếu"
            >
              {segment.value}
            </span>
          );
        }
      })}
    </span>
  );
}

interface WritingQuestionCardProps {
  question: WritingQuestion;
  mode: 1 | 2 | 3; // 1: Vocab, 2: Sentence MCQ, 3: Tự viết
  isAnswered: boolean;
  selectedOptionIndex: number | null;
  onAnswer: (optionIndex: number, isCorrect: boolean) => void;
  onAnswerTyped?: (text: string, isCorrect: boolean, overrideCorrect: boolean) => void;
  savedTypedAnswer?: { text: string; isCorrect: boolean; overrideCorrect?: boolean };
  onNext: () => void;
  onPrev?: () => void;
  showHint: boolean;
  onToggleHint: () => void;
  restartCount: number;
  isMuted?: boolean;
}

export function WritingQuestionCard({
  question,
  mode,
  isAnswered,
  selectedOptionIndex,
  onAnswer,
  onAnswerTyped,
  savedTypedAnswer,
  onNext,
  onPrev,
  showHint,
  onToggleHint,
  restartCount,
  isMuted = false,
}: WritingQuestionCardProps) {
  // Option selectors based on mode
  const vocabOptions = question.phraseOptions || [];
  const correctVocabOption = vocabOptions.find((opt) => opt.isCorrect);
  const correctVocabOptionText = correctVocabOption?.text || "";
  const selectedVocabOptionText = selectedOptionIndex !== null ? vocabOptions[selectedOptionIndex]?.text : null;

  const correctOption = question.answerOptions.find((opt) => opt.isCorrect);
  const correctOptionText = correctOption?.text || "";
  const selectedOptionText = selectedOptionIndex !== null ? question.answerOptions[selectedOptionIndex]?.text : null;

  // Active Hint based on state
  const activeHint = mode === 1
    ? (question.vocabHint || `Tìm cụm từ mang ý nghĩa tiếng Việt: "${correctVocabOption?.meaning}"`)
    : question.hint;

  const [loadedImageId, setLoadedImageId] = useState<string | null>(null);
  const imageLoaded = loadedImageId === question.id;

  // Active Writing Mode Local State
  const [typedText, setTypedText] = useState(savedTypedAnswer?.text || "");
  const [isSubmitted, setIsSubmitted] = useState(!!savedTypedAnswer);
  const [typedResult, setTypedResult] = useState<{ isCorrect: boolean; overrideCorrect: boolean } | null>(
    savedTypedAnswer
      ? { isCorrect: savedTypedAnswer.isCorrect, overrideCorrect: savedTypedAnswer.overrideCorrect ?? false }
      : null
  );

  const handleTypedSubmit = () => {
    if (!typedText.trim() || !onAnswerTyped) return;

    // Normalization: lowercase, trim, remove duplicate spaces, remove ending dot
    const cleanUser = typedText.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.\s]+$/, "");
    const cleanTarget = correctOptionText.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.\s]+$/, "");
    const isMatch = cleanUser === cleanTarget;

    if (isMatch) {
      setTypedResult({ isCorrect: true, overrideCorrect: false });
      setIsSubmitted(true);
      onAnswerTyped(typedText, true, false);
    } else {
      setIsSubmitted(true);
      // Wait for user to click "Tôi hiểu rồi" or "Thừa nhận nhập sai"
    }
  };

  const handleOverrideAccept = () => {
    if (!onAnswerTyped) return;
    setTypedResult({ isCorrect: false, overrideCorrect: true });
    onAnswerTyped(typedText, false, true);
  };

  const handleOverrideAdmit = () => {
    if (!onAnswerTyped) return;
    setTypedResult({ isCorrect: false, overrideCorrect: false });
    onAnswerTyped(typedText, false, false);
  };

  // Keyboard shortcut listener to submit in writing mode when pressing Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitted && typedText.trim()) {
        handleTypedSubmit();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-0 h-full">
      {/* Left side: Topic/Keywords + Image */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between shrink-0 min-h-0 lg:h-full space-y-3">
        {/* Header info (Keywords only) */}
        <div className="text-xs bg-slate-950/40 p-2.5 border border-white/5 rounded-xl shrink-0">
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

        {/* Image Container */}
        {question.image ? (
          <div className="relative w-full lg:w-auto h-auto lg:h-full mx-auto overflow-hidden group flex justify-center items-center flex-none lg:flex-1 min-h-0">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center rounded-xl">
                <svg className="w-8 h-8 text-slate-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
            
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={question.id}
              src={question.image}
              alt={question.scene}
              className={`max-h-[320px] md:max-h-[380px] lg:max-h-[420px] w-auto h-auto max-w-full rounded-xl border border-white/10 shadow-md object-contain transition-all duration-500 group-hover:scale-101 ${
                imageLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-98 blur-md"
              }`}
              onLoad={() => setLoadedImageId(question.id)}
            />
          </div>
        ) : (
          <div className="relative aspect-square w-full lg:w-auto h-auto lg:h-full max-h-[320px] md:max-h-[380px] lg:max-h-[420px] mx-auto p-6 bg-linear-to-br from-blue-500/5 to-purple-500/5 border border-white/10 rounded-2xl backdrop-blur-sm flex flex-col justify-center flex-none lg:flex-1 min-h-0">
            <div className="absolute top-4 left-4 px-2 bg-slate-900 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              🖼️ Bối cảnh tranh
            </div>
            <p className="text-slate-200 leading-relaxed text-sm">{question.scene}</p>
          </div>
        )}

        {question.image && (
          <p className="text-xs text-slate-400 italic px-1 mt-1 shrink-0 line-clamp-2" title={question.scene}>
            <span className="font-semibold not-italic text-slate-300">Gợi ý bối cảnh:</span> {question.scene}
          </p>
        )}
      </div>

      {/* Right side: Question & Actions */}
      <div className="flex-1 flex flex-col justify-between space-y-4 pr-1 min-h-0 lg:overflow-y-auto lg:no-scrollbar">
        <div className="space-y-4">
          {/* Question Text */}
          <div className="space-y-1">
            <h3 className="text-base md:text-[17px] font-bold text-white leading-snug">
              {mode === 1 ? (
                "Cụm từ nào đang miêu tả đúng nhất cho bức tranh?"
              ) : mode === 3 ? (
                <span className="ml-2 flex items-center gap-1.5 text-violet-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                  Hãy tự gõ câu mô tả bức tranh sử dụng cả hai từ khóa trên:
                </span>
              ) : (
                highlightKeywords(question.question, question.keywords)
              )}
            </h3>
          </div>

          {/* Render Mode Content */}
          {mode === 3 ? (
            /* Phase 3: Active Writing Layout */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="relative">
                <textarea
                  autoFocus
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitted && typedResult !== null}
                  placeholder="Nhập câu trả lời của bạn tại đây... (Ví dụ: The woman is wiping the counter...)"
                  className="w-full h-30 px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden transition-all placeholder:text-slate-500 resize-none font-medium leading-relaxed"
                />
                {!isSubmitted && (
                  <button
                    onClick={handleTypedSubmit}
                    disabled={!typedText.trim()}
                    className="absolute bottom-3 right-3 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg text-xs transition-all shadow-md"
                  >
                    Nộp bài
                  </button>
                )}
              </div>

              {/* Feedback cards when submitted */}
              {isSubmitted && (
                <div className="space-y-3.5 animate-in slide-in-from-top-1 duration-200">
                  {typedResult !== null ? (
                    // Final state selected card
                    <div
                      className={`p-4 rounded-xl border ${
                        typedResult.isCorrect || typedResult.overrideCorrect
                          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/5 border-rose-500/20 text-rose-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-sm mb-1">
                        {typedResult.isCorrect || typedResult.overrideCorrect ? (
                          <>
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            {typedResult.isCorrect ? "Đúng hoàn hảo!" : "Được chấp nhận!"}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Thừa nhận viết chưa đúng
                          </>
                        )}
                      </div>
                      <div className="text-xs text-slate-350 leading-relaxed font-medium mb-2.5 flex items-start gap-1 flex-wrap">
                        <span className="font-bold text-slate-400 shrink-0">Câu bạn viết:</span>
                        {typedResult.isCorrect || typedResult.overrideCorrect ? (
                          <span className="text-slate-300">&ldquo;{typedText}&rdquo;</span>
                        ) : (
                          <DiffViewer userText={typedText} targetText={correctOptionText} />
                        )}
                      </div>
                      
                      <div className="pt-2.5 border-t border-white/5 space-y-1.5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đáp án mẫu:</div>
                        <p className="text-sm font-semibold text-emerald-300 leading-snug">
                          {correctOptionText}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed pt-1">
                          {correctOption?.rationale}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Intermediate mismatch review card (2 options)
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold text-sm mb-2 text-amber-300">
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Đáp án chưa trùng khớp hoàn toàn!
                      </div>
                      
                      <div className="space-y-2 text-xs leading-relaxed">
                        <div className="flex items-start gap-1 flex-wrap">
                          <span className="font-bold text-slate-400 shrink-0">Câu của bạn:</span>
                          <DiffViewer userText={typedText} targetText={correctOptionText} />
                        </div>
                        <div>
                          <span className="font-bold text-emerald-400">Đáp án mẫu:</span> &ldquo;{correctOptionText}&rdquo;
                        </div>
                        <div className="text-slate-400 italic pt-1">
                          Gợi ý đáp án mẫu: {correctOption?.rationale}
                        </div>
                      </div>

                      <div className="flex gap-2.5 mt-4">
                        <button
                          onClick={handleOverrideAccept}
                          className="flex-1 py-1.5 px-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all shadow-md"
                        >
                          Tôi hiểu rồi (Đáp án hợp lệ)
                        </button>
                        <button
                          onClick={handleOverrideAdmit}
                          className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/5 rounded-lg transition-all"
                        >
                          Thừa nhận nhập sai
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Phase 1 (Vocab) or Phase 2 (Sentence MCQ) Layout */
            <div className="w-full animate-in fade-in duration-200">
              <AnswerButtonList<DisplayOption>
                options={(mode === 1 ? vocabOptions : question.answerOptions) as DisplayOption[]}
                selectedOptionId={mode === 1 ? selectedVocabOptionText : selectedOptionText}
                correctOptionId={mode === 1 ? correctVocabOptionText : correctOptionText}
                isAnswered={isAnswered}
                onSelect={(optionText) => {
                  if (mode === 1) {
                    const idx = vocabOptions.findIndex((o: PhraseOption) => o.text === optionText);
                    if (idx !== -1) onAnswer(idx, vocabOptions[idx].isCorrect);
                  } else {
                    const idx = question.answerOptions.findIndex((o) => o.text === optionText);
                    if (idx !== -1) onAnswer(idx, question.answerOptions[idx].isCorrect);
                  }
                }}
                isMuted={isMuted}
                restartCount={restartCount}
                stableKey={question.id + "-" + mode}
                getOptionId={(opt: DisplayOption) => opt.text}
                size="sm"
                renderContent={(opt: DisplayOption, isSelected, isCorrect, showResult) => (
                  <div className="w-full">
                    {mode === 1 ? (
                      /* Phase 1 Layout (English + Vietnamese) */
                      <div className="w-full text-left py-0.5">
                        <span
                          className={`block text-sm md:text-base font-bold leading-snug transition-colors duration-300 ${
                            showResult && isCorrect
                              ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                              : showResult && isSelected
                              ? "text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                              : "text-white"
                          }`}
                        >
                          {opt.text}
                        </span>
                        {showResult && (
                          <span className="block text-[11px] md:text-xs text-slate-400 font-medium mt-0.5 animate-in fade-in duration-200">
                            {opt.meaning}
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Phase 2 Layout (Sentence with keyword highlight) */
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
                    )}

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
                        {opt.rationale && <p className="leading-relaxed text-slate-350">{opt.rationale}</p>}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          )}

          {/* Review Previous States Block */}
          {mode > 1 && (
            <div className="bg-slate-950/20 border border-white/5 rounded-xl p-3 space-y-2 mt-2">
              <details className="group">
                <summary className="list-none flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer select-none">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 text-slate-400 group-open:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                    Xem lại đáp án phần trước
                  </span>
                </summary>
                
                <div className="pt-2.5 space-y-2 text-xs border-t border-white/5 mt-2 animate-in fade-in duration-200">
                  <div>
                    <span className="font-bold text-slate-400">● Cụm từ vựng (State 1): </span>
                    <span className="text-amber-300 font-semibold">{correctVocabOption?.text}</span>
                    <span className="text-slate-400"> ({correctVocabOption?.meaning})</span>
                  </div>
                  {mode === 3 && (
                    <div>
                      <span className="font-bold text-slate-400">● Cấu trúc câu (State 2): </span>
                      <span className="text-emerald-300 font-semibold">{correctOption?.text}</span>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Hint & Navigation Buttons Area */}
        <div className="space-y-2 pt-2 border-t border-white/5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Left side: Back and Hint buttons */}
            <div className="flex items-center gap-2">
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 rounded-lg text-xs font-semibold text-slate-355 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại
                </button>
              )}

              {((!isAnswered && mode !== 3) || (mode === 3 && !isSubmitted)) && (
                <button
                  onClick={onToggleHint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 transition-all duration-200 cursor-pointer"
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
              )}
            </div>

            {/* Right side: Next button */}
            {((mode !== 3 && isAnswered) || (mode === 3 && isSubmitted && typedResult !== null)) && (
              <button
                onClick={onNext}
                className="px-5 py-2 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-violet-600/10 flex items-center justify-center gap-1.5 text-sm cursor-pointer ml-auto"
              >
                Câu tiếp theo
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>

          {/* Hint text if active */}
          {showHint && ((!isAnswered && mode !== 3) || (mode === 3 && !isSubmitted)) && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-xs text-blue-200 leading-relaxed">💡 {activeHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
