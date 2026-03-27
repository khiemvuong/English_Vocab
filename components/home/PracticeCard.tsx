"use client";

import Link from "next/link";
import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";
import { ProgressCard } from "@/components/common/ProgressCard";

interface PracticeCardProps {
  testId: string;
  testLabel: string;
  questionRange: string;
  isAvailable: boolean;
  hasScenarios?: boolean;
}

export function PracticeCard({ testId, testLabel, questionRange, isAvailable, hasScenarios }: PracticeCardProps) {
  const [mounted, setMounted] = useState(false);
  const progressState = useQuizStore(state => state.progress[`part5-${testId}`]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isCompleted = mounted && progressState?.isFinished;
  const amountAnswered = mounted && progressState?.answers ? Object.keys(progressState.answers).length : 0;
  const totalQuestions = mounted && progressState?.totalQuestions ? progressState.totalQuestions : 30;
  const inProgress = mounted && !isCompleted && amountAnswered > 0;

  const customBadge = hasScenarios ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 mt-2">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      Tình Huống
      </span>
  ) : undefined;

  return (
    <ProgressCard
      href={`/part5/${testId}`}
      tagLabel={testLabel}
      mainTitle="Part 5"
      subtitle={questionRange}
      isAvailable={isAvailable}
      isCompleted={isCompleted}
      amountAnswered={amountAnswered}
      totalQuestions={totalQuestions}
      score={progressState?.score}
      colorTheme="amber"
      startLabel="Làm bài"
      customBadge={customBadge}
    />
  );
}
