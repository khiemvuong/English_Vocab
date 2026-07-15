"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Inbox, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Question, QuizData } from "@/lib/types";
import { useLessonProgressStore } from "@/store/lessonProgressStore";
import { renderFormattedText } from "@/utils/textFormatting";

interface Part5QuizBundle {
  id: string;
  title: string;
  sourceLabel: string;
  progressKey: string;
  href: string;
  quizData: QuizData;
}

interface WrongQuestion {
  testId: string;
  testTitle: string;
  sourceLabel: string;
  progressKey: string;
  href: string;
  questionIndex: number;
  question: Question;
  selectedText: string;
  correctText: string;
  rationale?: string;
}

interface Part5MistakesReviewProps {
  quizzes: Part5QuizBundle[];
}

export function Part5MistakesReview({ quizzes }: Part5MistakesReviewProps) {
  const [mounted, setMounted] = useState(false);
  const progress = useLessonProgressStore((state) => state.progress);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const wrongQuestions = useMemo(() => {
    if (!mounted) return [];

    return quizzes.flatMap(({ id, title, sourceLabel, progressKey, href, quizData }) => {
      const lessonProgress = progress[progressKey];
      if (!lessonProgress) return [];

      return Object.entries(lessonProgress.answers).flatMap(([rawIndex, selectedIndex]) => {
        const questionIndex = Number(rawIndex);
        const question = quizData.questions[questionIndex];
        const selectedOption = question?.answerOptions[selectedIndex];
        const correctOption = question?.answerOptions.find((option) => option.isCorrect);

        if (!question || !selectedOption || !correctOption || selectedOption.isCorrect) return [];

        return [{
          testId: id,
          testTitle: title,
          sourceLabel,
          progressKey,
          href,
          questionIndex,
          question,
          selectedText: selectedOption.text,
          correctText: correctOption.text,
          rationale: correctOption.rationale,
        }];
      });
    });
  }, [mounted, progress, quizzes]);

  const groupedQuestions = useMemo(() => {
    return wrongQuestions.reduce<Record<string, WrongQuestion[]>>((groups, item) => {
      groups[item.progressKey] = [...(groups[item.progressKey] ?? []), item];
      return groups;
    }, {});
  }, [wrongQuestions]);

  return (
    <main className="min-h-dvh overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[460px] w-[460px] rounded-full bg-red-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
        <header className="flex flex-col gap-5 rounded-4xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/30 md:p-7">
          <Link
            href="/?tab=part5"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Về Part 5
          </Link>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">Ôn câu sai Part 5</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-400 md:text-base">
                Bộ những câu hỏi bạn đã chọn sai trong quá trình học
              </p>
            </div>
            <div className="rounded-3xl border border-amber-200/20 bg-amber-300/10 px-6 py-4 text-left md:text-right">
              <p className="text-5xl font-black tabular-nums text-white">{wrongQuestions.length}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-100/60">câu đang sai</p>
            </div>
          </div>
        </header>

        {wrongQuestions.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-4xl border border-white/10 bg-white/[0.035] px-6 py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-slate-300">
              <Inbox className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Chưa có câu sai Part 5</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              Hãy làm vài bộ Part 5 trước. Những câu chọn sai sẽ tự xuất hiện tại đây sau khi được lưu vào localStorage.
            </p>
          </section>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedQuestions).map(([progressKey, items]) => (
              <section key={progressKey} className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">
                      {items[0].sourceLabel} / {items[0].testId}
                    </p>
                    <h2 className="text-2xl font-black tracking-tight text-white">{items[0].testTitle}</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                    {items.length} câu
                  </span>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <article
                      key={`${item.progressKey}-${item.questionIndex}`}
                      className="rounded-3xl border border-white/10 bg-white/4 p-5 shadow-xl shadow-black/20"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
                          Câu {item.questionIndex + 1}
                        </span>
                        <Link
                          href={item.href}
                          className="text-xs font-bold text-amber-200 transition-colors hover:text-amber-100"
                        >
                          Mở bài gốc
                        </Link>
                      </div>

                      <div className="text-lg font-bold leading-relaxed text-white">
                        {renderFormattedText(item.question.question)}
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <AnswerState icon={<XCircle className="h-5 w-5" />} label="Bạn chọn" value={item.selectedText} tone="wrong" />
                        <AnswerState icon={<CheckCircle2 className="h-5 w-5" />} label="Đáp án đúng" value={item.correctText} tone="correct" />
                      </div>

                      {(item.rationale || item.question.translation || item.question.hint) && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-slate-300">
                          {item.rationale && <p>{item.rationale}</p>}
                          {item.question.translation && <p className="mt-2 italic text-slate-400">{item.question.translation}</p>}
                          {item.question.hint && <p className="mt-2 text-amber-100/80">Gợi ý: {item.question.hint}</p>}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function AnswerState({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "wrong" | "correct" }) {
  const toneClass = tone === "wrong"
    ? "border-red-300/20 bg-red-400/10 text-red-100"
    : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70">
        {icon}
        {label}
      </div>
      <p className="font-bold leading-relaxed">{value}</p>
    </div>
  );
}
