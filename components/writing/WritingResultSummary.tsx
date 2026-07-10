"use client";

import React, { useMemo, useState } from "react";
import type { WritingQuestion } from "@/lib/types";
import { Check } from "lucide-react";

interface WritingResultSummaryProps {
  score: number;
  total: number;
  allQuestions: WritingQuestion[];
  answers: Record<number, number>;
  skillAccuracy: Record<string, { correct: number; total: number }>;
  onRestart: () => void;
  onRestartWrongOnly: () => void;
  onExit: () => void;
  onReviewQuestion?: (index: number, state: ReviewState) => void;
  practiceMode?: 1 | 2 | 3;
  vocabAnswers?: Record<number, number>;
  typedAnswers?: Record<number, { text: string; isCorrect: boolean; overrideCorrect?: boolean }>;
  skippedStates?: Record<string, true>;
}

type StateStatus = "correct" | "wrong" | "incomplete";

type ReviewState = 1 | 2 | 3;

interface BlockSummary {
  blockNumber: number;
  questionIndices: number[];
}

const STATE_META: Record<ReviewState, { label: string; shortLabel: string }> = {
  1: { label: "Học cụm từ", shortLabel: "S1" },
  2: { label: "Trắc nghiệm câu", shortLabel: "S2" },
  3: { label: "Tự viết câu", shortLabel: "S3" },
};

const STATUS_META: Record<StateStatus, { chip: string; badge: string; dot: string; label: string }> = {
  correct: {
    chip: "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
    label: "Đúng",
  },
  wrong: {
    chip: "border-rose-500/35 bg-rose-500/12 text-rose-300",
    badge: "border-rose-500/25 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-400",
    label: "Sai",
  },
  incomplete: {
    chip: "border-amber-500/35 bg-amber-500/12 text-amber-200",
    badge: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-300",
    label: "Chưa xong",
  },
};

function buildBlockSummaries(totalQuestions: number): BlockSummary[] {
  if (totalQuestions <= 0) return [];

  const numBlocks = Math.ceil(totalQuestions / 10);
  const baseSize = Math.floor(totalQuestions / numBlocks);
  const remainder = totalQuestions % numBlocks;

  const blocks: BlockSummary[] = [];
  let start = 0;

  for (let index = 0; index < numBlocks; index++) {
    const size = index < remainder ? baseSize + 1 : baseSize;
    const questionIndices = Array.from({ length: size }, (_, offset) => start + offset);
    blocks.push({ blockNumber: index + 1, questionIndices });
    start += size;
  }

  return blocks;
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
  skippedStates = {},
}: WritingResultSummaryProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [selectedReviewState, setSelectedReviewState] = useState<ReviewState | null>(null);

  const getStateStatus = useMemo(() => {
    return (questionIndex: number, state: ReviewState): StateStatus => {
      if (skippedStates[`${questionIndex}-${state}`]) {
        return "incomplete";
      }

      if (state === 1) {
        const answerIndex = vocabAnswers[questionIndex];
        if (answerIndex === undefined) return "incomplete";
        return allQuestions[questionIndex]?.phraseOptions?.[answerIndex]?.isCorrect ? "correct" : "wrong";
      }

      if (state === 2) {
        const answerIndex = answers[questionIndex];
        if (answerIndex === undefined) return "incomplete";
        return allQuestions[questionIndex]?.answerOptions[answerIndex]?.isCorrect ? "correct" : "wrong";
      }

      const typedAnswer = typedAnswers[questionIndex];
      if (!typedAnswer) return "incomplete";
      return typedAnswer.isCorrect || typedAnswer.overrideCorrect ? "correct" : "wrong";
    };
  }, [allQuestions, answers, skippedStates, typedAnswers, vocabAnswers]);

  const getFirstProblemState = useMemo(() => {
    return (questionIndex: number): ReviewState | null => {
      for (const state of [1, 2, 3] as const) {
        if (getStateStatus(questionIndex, state) !== "correct") {
          return state;
        }
      }
      return null;
    };
  }, [getStateStatus]);

  const blockSummaries = useMemo(() => buildBlockSummaries(allQuestions.length), [allQuestions.length]);

  const perfectQuestionCount = useMemo(() => {
    return allQuestions.filter((_, questionIndex) => {
      return getStateStatus(questionIndex, 1) === "correct"
        && getStateStatus(questionIndex, 2) === "correct"
        && getStateStatus(questionIndex, 3) === "correct";
    }).length;
  }, [allQuestions, getStateStatus]);

  const percentage = total > 0 ? Math.round((perfectQuestionCount / total) * 100) : 0;

  const retryCount = useMemo(() => {
    return allQuestions.filter((_, questionIndex) => {
      return getStateStatus(questionIndex, 1) !== "correct"
        || getStateStatus(questionIndex, 2) !== "correct"
        || getStateStatus(questionIndex, 3) !== "correct";
    }).length;
  }, [allQuestions, getStateStatus]);

  const incompleteCount = useMemo(() => {
    let count = 0;

    for (let questionIndex = 0; questionIndex < allQuestions.length; questionIndex++) {
      for (const state of [1, 2, 3] as const) {
        if (getStateStatus(questionIndex, state) === "incomplete") {
          count++;
        }
      }
    }

    return count;
  }, [allQuestions.length, getStateStatus]);

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
    if (acc >= 80) return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" };
    if (acc >= 50) return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" };
    return { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" };
  };

  const selectedQuestion = selectedQuestionIndex !== null ? allQuestions[selectedQuestionIndex] : null;
  const selectedTypedAnswer = selectedQuestionIndex !== null ? typedAnswers[selectedQuestionIndex] : null;
  const selectedVocabIndex = selectedQuestionIndex !== null ? vocabAnswers[selectedQuestionIndex] : undefined;
  const selectedSentenceIndex = selectedQuestionIndex !== null ? answers[selectedQuestionIndex] : undefined;
  const selectedReviewTargetState = selectedQuestionIndex !== null ? getFirstProblemState(selectedQuestionIndex) : null;

  const handleOpenQuestion = (questionIndex: number, state: ReviewState) => {
    setSelectedQuestionIndex(questionIndex);
    setSelectedReviewState(state);
  };

  const handleCloseQuestion = () => {
    setSelectedQuestionIndex(null);
    setSelectedReviewState(null);
  };

  const handleReview = () => {
    if (selectedQuestionIndex === null || !selectedReviewTargetState || !onReviewQuestion) return;
    onReviewQuestion(selectedQuestionIndex, selectedReviewTargetState);
    handleCloseQuestion();
  };

  return (
    <>
      <div className="bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-300 text-white">
        <div className="px-6 py-6 lg:py-8 border-b border-white/10 text-center shrink-0 bg-transparent relative">
          <div className="flex items-center justify-center gap-2"><Check className="w-6 h-6 text-emerald-400" /><h2 className="text-xl lg:text-2xl font-bold text-white">Hoàn thành bài học!</h2> </div>
          <p className="text-slate-300 font-medium text-sm">
            Hoàn thành trọn vẹn: <strong className="text-cyan-400 text-xl mx-0.5">{perfectQuestionCount || score}</strong> / {total} ({percentage}%)
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]">
            {retryCount > 0 && (
              <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-rose-200">
                Redo: {retryCount}
              </span>
            )}
            {incompleteCount > 0 && (
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-amber-200">
                Incomplete states: {incompleteCount}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-6 overflow-y-auto bg-transparent flex-1 space-y-6">
          {sortedSkills.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Phân tích theo kỹ năng</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {sortedSkills.map((skill) => {
                  const colors = getAccuracyColor(skill.accuracy);
                  return (
                    <div
                      key={skill.skillType}
                      className={`p-3 ${colors.bg} border ${colors.border} rounded-xl flex items-center justify-between gap-3`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{skill.skillLabel}</p>
                        <p className="text-xs text-slate-400">{skill.correct}/{skill.total} lượt đúng</p>
                      </div>
                      <span className={`text-lg font-bold ${colors.text}`}>{skill.accuracy}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tổng kết theo block / state</h3>

            {blockSummaries.map((block) => (
              <section key={block.blockNumber} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-white">Block {block.blockNumber}</h4>
                    <p className="text-xs text-slate-400">{block.questionIndices.length} câu trong block này</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Đúng</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" />Sai</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" />Chưa xong</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {([1, 2, 3] as const).map((state) => (
                    <div key={state} className="rounded-xl border border-white/6 bg-slate-900/45 p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-300">
                            {STATE_META[state].shortLabel}
                          </span>
                          <span className="text-sm font-semibold text-white">{STATE_META[state].label}</span>
                        </div>
                        <span className="text-xs text-slate-400">Bấm để xem chi tiết và làm lại</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {block.questionIndices.map((questionIndex, localIndex) => {
                          const status = getStateStatus(questionIndex, state);
                          const meta = STATUS_META[status];

                          return (
                            <button
                              key={`${questionIndex}-${state}`}
                              type="button"
                              onClick={() => handleOpenQuestion(questionIndex, state)}
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 ${meta.chip}`}
                            >
                              <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                              <span>Câu {localIndex + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="p-4 lg:p-6 bg-transparent border-t border-white/10 flex flex-col gap-3 shrink-0">
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={onRestart}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors text-sm lg:text-base"
            >
              Làm lại toàn bộ
            </button>
            {retryCount > 0 && (
              <button
                onClick={onRestartWrongOnly}
                className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold rounded-xl transition-colors text-sm lg:text-base"
              >
                Redo câu sai / chưa xong ({retryCount})
              </button>
            )}
          </div>
          <button
            onClick={onExit}
            className="w-full py-3 bg-linear-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-cyan-600/20 text-sm lg:text-base"
          >
            Về Dashboard
          </button>
        </div>
      </div>

      {selectedQuestion && selectedQuestionIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Chi tiết câu {selectedQuestionIndex + 1}</p>
                <h4 className="mt-1 text-lg font-bold text-white">{selectedQuestion.skillLabel}</h4>
                {selectedReviewState && (
                  <p className="mt-1 text-xs text-slate-400">Bạn đang xem: {STATE_META[selectedReviewState].label}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCloseQuestion}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4 px-5 py-5 text-sm text-slate-300 max-h-[70vh] overflow-y-auto">
              <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Câu hỏi</p>
                <p className="mt-2 leading-relaxed text-white">{selectedQuestion.question}</p>
              </div>

              {selectedReviewTargetState && selectedReviewTargetState !== selectedReviewState && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  Câu này đang lỗi từ {STATE_META[selectedReviewTargetState].shortLabel}. Nút làm lại sẽ đưa bạn về đúng state lỗi đầu tiên.
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                {([1, 2, 3] as const).map((state) => {
                  const status = getStateStatus(selectedQuestionIndex, state);
                  const meta = STATUS_META[status];

                  return (
                    <div key={state} className="rounded-2xl border border-white/8 bg-slate-950/45 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">{STATE_META[state].label}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>

                      {state === 1 && (
                        <div className="space-y-1 text-xs leading-relaxed">
                          <p><span className="font-bold text-slate-400">Bạn chọn:</span> {selectedVocabIndex !== undefined ? `${selectedQuestion.phraseOptions?.[selectedVocabIndex]?.text || "-"} (${selectedQuestion.phraseOptions?.[selectedVocabIndex]?.meaning || ""})` : "-"}</p>
                          <p><span className="font-bold text-emerald-400">Đáp án đúng:</span> {selectedQuestion.phraseOptions?.find((option) => option.isCorrect)?.text || "-"}</p>
                        </div>
                      )}

                      {state === 2 && (
                        <div className="space-y-1 text-xs leading-relaxed">
                          <p><span className="font-bold text-slate-400">Bạn chọn:</span> {selectedSentenceIndex !== undefined ? selectedQuestion.answerOptions[selectedSentenceIndex]?.text || "-" : "-"}</p>
                          <p><span className="font-bold text-emerald-400">Đáp án đúng:</span> {selectedQuestion.answerOptions.find((option) => option.isCorrect)?.text || "-"}</p>
                        </div>
                      )}

                      {state === 3 && (
                        <div className="space-y-1 text-xs leading-relaxed">
                          <p><span className="font-bold text-slate-400">Bạn viết:</span> {selectedTypedAnswer?.text || "-"}</p>
                          <p><span className="font-bold text-emerald-400">Đáp án mẫu:</span> {selectedQuestion.answerOptions.find((option) => option.isCorrect)?.text || "-"}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 md:flex-row md:justify-end">
              <button
                type="button"
                onClick={handleCloseQuestion}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10"
              >
                Tiếp tục xem tổng kết
              </button>
              {onReviewQuestion && selectedReviewTargetState && (
                <button
                  type="button"
                  onClick={handleReview}
                  className="rounded-xl bg-amber-600/20 px-4 py-3 text-sm font-bold text-amber-200 border border-amber-500/30 transition-colors hover:bg-amber-600/30"
                >
                  Làm lại từ {STATE_META[selectedReviewTargetState].shortLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
