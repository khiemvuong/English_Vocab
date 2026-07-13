"use client";

import React, { useMemo, useState } from "react";
import type { WritingQuestion } from "@/lib/types";
import { Check, X } from "lucide-react";

type ReviewState = 1 | 2 | 3;
type StateStatus = "correct" | "wrong" | "skipped";

interface WritingResultSummaryProps {
  score: number;
  total: number;
  allQuestions: WritingQuestion[];
  answers: Record<number, number>;
  skillAccuracy: Record<string, { correct: number; total: number }>;
  onRestart: () => void;
  onExit: () => void;
  vocabAnswers?: Record<number, number>;
  typedAnswers?: Record<number, { text: string; isCorrect: boolean; overrideCorrect?: boolean }>;
  skippedStates?: Record<string, true>;
}

interface BlockSummary {
  blockNumber: number;
  questionIndices: number[];
}

const STATES: ReviewState[] = [1, 2, 3];

const STATE_LABEL: Record<ReviewState, string> = {
  1: "State 1",
  2: "State 2",
  3: "State 3",
};

const STATUS_META: Record<StateStatus, { label: string; chip: string; dot: string }> = {
  correct: {
    label: "Đúng",
    chip: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
    dot: "bg-emerald-400",
  },
  wrong: {
    label: "Sai",
    chip: "border-rose-500/35 bg-rose-500/12 text-rose-200",
    dot: "bg-rose-400",
  },
  skipped: {
    label: "Skip",
    chip: "border-slate-500/35 bg-slate-500/12 text-slate-300",
    dot: "bg-slate-400",
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
  onExit,
  vocabAnswers = {},
  typedAnswers = {},
  skippedStates = {},
}: WritingResultSummaryProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);

  const getStateStatus = useMemo(() => {
    return (questionIndex: number, state: ReviewState): StateStatus => {
      if (skippedStates[`${questionIndex}-${state}`]) return "skipped";

      if (state === 1) {
        const answerIndex = vocabAnswers[questionIndex];
        if (answerIndex === undefined) return "skipped";
        return allQuestions[questionIndex]?.phraseOptions?.[answerIndex]?.isCorrect ? "correct" : "wrong";
      }

      if (state === 2) {
        const answerIndex = answers[questionIndex];
        if (answerIndex === undefined) return "skipped";
        return allQuestions[questionIndex]?.answerOptions[answerIndex]?.isCorrect ? "correct" : "wrong";
      }

      const typedAnswer = typedAnswers[questionIndex];
      if (!typedAnswer) return "skipped";
      return typedAnswer.isCorrect || typedAnswer.overrideCorrect ? "correct" : "wrong";
    };
  }, [allQuestions, answers, skippedStates, typedAnswers, vocabAnswers]);

  const blockSummaries = useMemo(() => buildBlockSummaries(allQuestions.length), [allQuestions.length]);

  const stateCounts = useMemo(() => {
    const counts: Record<StateStatus, number> = { correct: 0, wrong: 0, skipped: 0 };
    for (let questionIndex = 0; questionIndex < allQuestions.length; questionIndex++) {
      STATES.forEach((state) => {
        counts[getStateStatus(questionIndex, state)] += 1;
      });
    }
    return counts;
  }, [allQuestions.length, getStateStatus]);

  const sortedSkills = useMemo(() => {
    return Object.entries(skillAccuracy)
      .map(([skillType, data]) => {
        const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        const skillLabel = allQuestions.find((q) => q.skillType === skillType)?.skillLabel || skillType;
        return { skillType, skillLabel, ...data, accuracy };
      })
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [skillAccuracy, allQuestions]);

  const selectedQuestion = selectedQuestionIndex !== null ? allQuestions[selectedQuestionIndex] : null;
  const selectedTypedAnswer = selectedQuestionIndex !== null ? typedAnswers[selectedQuestionIndex] : null;
  const selectedVocabIndex = selectedQuestionIndex !== null ? vocabAnswers[selectedQuestionIndex] : undefined;
  const selectedSentenceIndex = selectedQuestionIndex !== null ? answers[selectedQuestionIndex] : undefined;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <>
      <div className="bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-300 text-white">
        <div className="px-6 py-6 lg:py-8 border-b border-white/10 text-center shrink-0">
          <div className="flex items-center justify-center gap-2">
            <Check className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl lg:text-2xl font-bold text-white">Hoàn thành bài test</h2>
          </div>
          <p className="text-sm font-medium text-slate-300">
            State 3 đúng: <strong className="mx-0.5 text-xl text-cyan-400">{score}</strong> / {total} ({percentage}%)
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Đúng: {stateCounts.correct}
            </span>
            <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-rose-200">
              Sai: {stateCounts.wrong}
            </span>
            <span className="rounded-full border border-slate-400/25 bg-slate-500/10 px-3 py-1 text-slate-200">
              Skip: {stateCounts.skipped}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 lg:p-6">
          {sortedSkills.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Kỹ năng</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {sortedSkills.map((skill) => (
                  <div key={skill.skillType} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{skill.skillLabel}</p>
                      <p className="text-xs text-slate-400">{skill.correct}/{skill.total} đúng</p>
                    </div>
                    <span className="text-lg font-bold text-cyan-300">{skill.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Tổng kết theo block</h3>
            {blockSummaries.map((block) => (
              <section key={block.blockNumber} className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-white">Block {block.blockNumber}</h4>
                    <p className="text-xs text-slate-400">{block.questionIndices.length} cau</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Đúng</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" />Sai</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" />Skip</span>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {block.questionIndices.map((questionIndex) => (
                    <button
                      key={questionIndex}
                      type="button"
                      onClick={() => setSelectedQuestionIndex(questionIndex)}
                      className="rounded-xl border border-white/10 bg-slate-900/45 p-3 text-left transition-transform hover:-translate-y-0.5 hover:bg-slate-900/70"
                    >
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Cau {questionIndex + 1}</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {STATES.map((state) => {
                          const status = getStateStatus(questionIndex, state);
                          const meta = STATUS_META[status];
                          return (
                            <span key={state} className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${meta.chip}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                              {state}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 p-4 lg:p-6 md:flex-row">
          <button onClick={onRestart} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 lg:text-base">
            Làm lại toàn bộ bài test
          </button>
          <button onClick={onExit} className="flex-1 rounded-xl bg-linear-to-r from-cyan-600 to-sky-600 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-600/20 transition-all hover:from-cyan-700 hover:to-sky-700 lg:text-base">
            Về Dashboard
          </button>
        </div>
      </div>

      {selectedQuestion && selectedQuestionIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Chi tiết câu {selectedQuestionIndex + 1}</p>
                <h4 className="mt-1 text-lg font-bold text-white">{selectedQuestion.skillLabel}</h4>
              </div>
              <button type="button" onClick={() => setSelectedQuestionIndex(null)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid max-h-[74vh] gap-4 overflow-y-auto px-5 py-5 text-sm text-slate-300 md:grid-cols-[240px_1fr]">
              {selectedQuestion.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedQuestion.image} alt={selectedQuestion.scene} className="h-auto w-full rounded-xl border border-white/10 object-contain" />
              )}

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Câu hỏi</p>
                  <p className="mt-2 leading-relaxed text-white">{selectedQuestion.question}</p>
                </div>

                <div className="grid gap-3">
                  {STATES.map((state) => {
                    const status = getStateStatus(selectedQuestionIndex, state);
                    const meta = STATUS_META[status];
                    return (
                      <div key={state} className="rounded-2xl border border-white/8 bg-slate-950/45 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white">{STATE_LABEL[state]}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.chip}`}>{meta.label}</span>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
