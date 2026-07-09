"use client";

import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";
import { ProgressCard } from "@/components/common/ProgressCard";

interface PracticeCardProps {
  testId: string;
  testLabel: string;
  questionRange: string;
  isAvailable: boolean;
}

export function PracticeCard({ testId, testLabel, questionRange, isAvailable }: PracticeCardProps) {
  const [mounted, setMounted] = useState(false);
  const progressState = useQuizStore(state => state.progress[`part5-${testId}`]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isCompleted = mounted && progressState?.isFinished;
  const amountAnswered = mounted && progressState?.answers ? Object.keys(progressState.answers).length : 0;
  const totalQuestions = mounted && progressState?.totalQuestions ? progressState.totalQuestions : 30;

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
    />
  );
}
