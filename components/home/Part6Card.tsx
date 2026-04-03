"use client";

import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";
import { ProgressCard } from "@/components/common/ProgressCard";

interface Part6CardProps {
  testId: string;
  testLabel: string;
  isAvailable: boolean;
}

export function Part6Card({ testId, testLabel, isAvailable }: Part6CardProps) {
  const [mounted, setMounted] = useState(false);
  const progressState = useQuizStore((state) => state.progress[`part6-${testId}`]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCompleted = mounted && progressState?.isFinished;
  const amountAnswered =
    mounted && progressState?.answers ? Object.keys(progressState.answers).length : 0;
  const totalQuestions =
    mounted && progressState?.totalQuestions ? progressState.totalQuestions : 16;
  const inProgress = mounted && !isCompleted && amountAnswered > 0;

  return (
    <ProgressCard
      href={`/part6/${testId}`}
      tagLabel={testLabel}
      mainTitle="Part 6"
      subtitle="Text Completion"
      isAvailable={isAvailable}
      isCompleted={isCompleted}
      amountAnswered={amountAnswered}
      totalQuestions={totalQuestions}
      score={progressState?.score}
      colorTheme="emerald"
      startLabel="Làm bài"
    />
  );
}
