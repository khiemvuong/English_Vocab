"use client";

import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";
import { ProgressCard } from "@/components/common/ProgressCard";

interface Ets2026CardProps {
  testId: string;
  testLabel: string;
  isAvailable: boolean;
}

export function Ets2026Card({ testId, testLabel, isAvailable }: Ets2026CardProps) {
  const [mounted, setMounted] = useState(false);
  const progressState = useQuizStore((state) => state.progress[`part5-ets2026-${testId}`]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isCompleted = mounted && progressState?.isFinished;
  const amountAnswered =
    mounted && progressState?.answers ? Object.keys(progressState.answers).length : 0;
  const totalQuestions =
    mounted && progressState?.totalQuestions ? progressState.totalQuestions : 30;

  return (
    <ProgressCard
      href={`/part5-ets2026/${testId}`}
      tagLabel={testLabel}
      mainTitle="Part 5"
      subtitle="Questions 101–130"
      isAvailable={isAvailable}
      isCompleted={isCompleted}
      amountAnswered={amountAnswered}
      totalQuestions={totalQuestions}
      score={progressState?.score}
      colorTheme="amber"
      startLabel="Làm bài"
    />
  );
}
