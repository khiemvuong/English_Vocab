"use client";

import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";
import { ProgressCard } from "@/components/common/ProgressCard";

export function ScenarioBanner({ testId, totalBlanks }: { testId: string, totalBlanks: number }) {
  const [mounted, setMounted] = useState(false);
  const progressState = useQuizStore(state => state.scenarioProgress[testId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isCompleted = mounted && progressState?.isFinished;
  const amountAnswered = mounted && progressState?.answers ? Object.keys(progressState.answers).length : 0;

  return (
    <ProgressCard
      href={`/part5/${testId}/scenarios`}
      tagLabel={`Dành riêng cho Part 5 - ${testId.toUpperCase()}`}
      mainTitle="Học Từ Vựng Bằng Truyện Chêm"
      subtitle="Bổ sung vốn từ thực tế trước khi làm bài thi"
      isAvailable={true}
      isCompleted={isCompleted}
      amountAnswered={amountAnswered}
      totalQuestions={totalBlanks}
      score={progressState?.score}
      colorTheme="emerald"
      startLabel="Bắt đầu học"
      watermarkText="🕮"
      patternTheme="notebook"
    />
  );
}
