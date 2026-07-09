"use client";

import React, { useMemo } from "react";
import type { WritingQuestion } from "@/lib/types";

interface WritingResultSummaryProps {
  score: number;
  total: number;
  allQuestions: WritingQuestion[];
  answers: Record<number, number>;
  skillAccuracy: Record<string, { correct: number; total: number }>;
  onRestart: () => void;
  onRestartWrongOnly: () => void;
  onExit: () => void;
  onReviewQuestion: (index: number) => void;
  // New props for supporting block-based vocab and active writing modes
  practiceMode?: 1 | 2 | 3;
  vocabAnswers?: Record<number, number>;
  typedAnswers?: Record<number, { text: string; isCorrect: boolean; overrideCorrect?: boolean }>;
}

export function WritingResultSummary({
  score,
  total,
  allQuestions,
  answers,
  skillAccuracy,
  onRestart,
  onRestartWrongOnly,
  onExit,
  onReviewQuestion,
  practiceMode = 2,
  vocabAnswers = {},
  typedAnswers = {},
}: WritingResultSummaryProps) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // Compute results for each question based on active practiceMode
  const questionResults = useMemo(() => {
    return allQuestions.map((q, idx) => {
      if (practiceMode === 1) {
        // Vocab Mode
        const ansIdx = vocabAnswers[idx];
        const hasAns = ansIdx !== undefined;
        const isCorrect = hasAns && q.phraseOptions?.[ansIdx]?.isCorrect === true;
        const text = hasAns ? q.phraseOptions?.[ansIdx]?.text : "";
        const meaning = hasAns ? q.phraseOptions?.[ansIdx]?.meaning : "";
        return { isCorrect, text: `${text} (${meaning})`, isTyped: false, hasAnswered: hasAns };
      } else if (practiceMode === 3) {
        // Active Writing Mode
        const typedAns = typedAnswers[idx];
        const hasAns = typedAns !== undefined;
        const isCorrect = hasAns && (typedAns.isCorrect || typedAns.overrideCorrect === true);
        const text = hasAns ? typedAns.text : "";
        return { isCorrect, text, isTyped: true, hasAnswered: hasAns };
      } else {
        // Sentence MCQ Mode (Default)
        const ansIdx = answers[idx];
        const hasAns = ansIdx !== undefined;
        const isCorrect = hasAns && q.answerOptions[ansIdx]?.isCorrect === true;
        const text = hasAns ? q.answerOptions[ansIdx]?.text : "";
        return { isCorrect, text, isTyped: false, hasAnswered: hasAns };
      }
    });
  }, [allQuestions, practiceMode, vocabAnswers, typedAnswers, answers]);

  // Calculate wrong question count based on computed results
  const wrongCount = useMemo(() => {
    return questionResults.filter((r) => r.hasAnswered && !r.isCorrect).length;
  }, [questionResults]);

  // Sort skills by accuracy (lowest first to highlight weaknesses)
  const sortedSkills = useMemo(() => {
    return Object.entries(skillAccuracy)
      .map(([skillType, data]) => {
        const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        const skillLabel = allQuestions.find((q) => q.skillType === skillType)?.skillLabel || skillType;
        return { skillType, skillLabel, ...data, accuracy: acc };
      })
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [skillAccuracy, allQuestions]);

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", emoji: "🟢" };
    if (acc >= 50) return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", emoji: "🟡" };
    return { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", emoji: "🔴" };
  };

  return (
    <div className="bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-300 text-white">
      {/* Header */}
      <div className="px-6 py-6 lg:py-8 border-b border-white/10 text-center shrink-0 bg-transparent relative">
        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-400 ring-4 ring-violet-500/5">
          <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">Hoàn thành bài học!</h2>
        <p className="text-slate-300 font-medium text-sm">
          Kết quả: <strong className="text-violet-400 text-xl mx-0.5">{score}</strong> / {total} ({percentage}%)
        </p>
      </div>

      {/* Body - Scrollable */}
      <div className="p-4 lg:p-6 overflow-y-auto bg-transparent flex-1 space-y-6">
        {/* Skill Breakdown */}
        {sortedSkills.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Phân tích theo kỹ năng
            </h3>

            <div className="space-y-2">
              {sortedSkills.map((skill) => {
                const colors = getAccuracyColor(skill.accuracy);
                return (
                  <div
                    key={skill.skillType}
                    className={`p-3 ${colors.bg} border ${colors.border} rounded-xl flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xl">{colors.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{skill.skillLabel}</p>
                        <p className="text-xs text-slate-400">
                          {skill.correct}/{skill.total} câu
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${colors.text}`}>{skill.accuracy}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Review List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chi tiết từng câu</h3>
          <div className="space-y-2">
            {allQuestions.map((q, idx) => {
              const res = questionResults[idx];
              const isCorrect = res?.isCorrect;

              return (
                <button
                  key={q.id}
                  onClick={() => onReviewQuestion(idx)}
                  className={`w-full flex flex-col p-3.5 cursor-pointer rounded-xl border text-left transition-transform hover:-translate-y-0.5 active:scale-95 space-y-1.5 ${
                    isCorrect
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/30"
                      : "bg-rose-950/20 border-rose-500/30 text-rose-300 hover:bg-rose-950/30"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                        {isCorrect ? (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white/95">Câu {idx + 1}</span>
                        <span className="text-[10px] text-slate-400">{q.skillLabel}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  
                  {res?.text && (
                    <div className="text-xs pl-10 text-slate-300 leading-relaxed wrap-break-word">
                      <span className="font-semibold text-slate-450">Đã trả lời:</span> &ldquo;{res.text}&rdquo;
                      {practiceMode === 3 && !isCorrect && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          <span className="font-bold text-emerald-400">Đáp án mẫu:</span> &ldquo;{q.answerOptions.find(o => o.isCorrect)?.text}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 lg:p-6 bg-transparent border-t border-white/10 flex flex-col gap-3 shrink-0">
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors text-sm lg:text-base"
          >
            Làm lại
          </button>
          {wrongCount > 0 && (
            <button
              onClick={onRestartWrongOnly}
              className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold rounded-xl transition-colors text-sm lg:text-base"
            >
              Luyện lại câu sai ({wrongCount})
            </button>
          )}
        </div>
        <button
          onClick={onExit}
          className="w-full py-3 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-violet-600/20 text-sm lg:text-base"
        >
          Về Dashboard
        </button>
      </div>
    </div>
  );
}
