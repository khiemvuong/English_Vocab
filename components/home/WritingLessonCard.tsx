"use client";

import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";
import { ProgressCard, CardColorTheme } from "@/components/common/ProgressCard";

interface WritingLessonCardProps {
  file: string;
  tagLabel: string;
  mainTitle: string;
  totalQuestions: number;
  colorTheme: CardColorTheme;
}

export function WritingLessonCard({
  file,
  tagLabel,
  mainTitle,
  totalQuestions: defaultTotalQuestions,
  colorTheme,
}: WritingLessonCardProps) {
  const [mounted, setMounted] = useState(false);
  const sessionId = `writing-${file}`;
  const session = useQuizStore((state) => state.writingProgress[sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isCompleted = mounted && !!session?.isFinished;
  const totalQuestions = mounted && session?.totalQuestions ? session.totalQuestions : defaultTotalQuestions;

  const totalPoints = totalQuestions * 3;
  let completedPoints = 0;
  if (mounted && session) {
    for (let i = 0; i < totalQuestions; i++) {
      if (session.typedAnswers?.[i] !== undefined) {
        completedPoints += 3;
      } else if (session.answers?.[i] !== undefined) {
        completedPoints += 2;
      } else if (session.vocabAnswers?.[i] !== undefined) {
        completedPoints += 1;
      }
    }
  }
  const displayAmount = isCompleted ? totalPoints : completedPoints;

  return (
    <ProgressCard
      href={`/writing-practice?file=${file}`}
      tagLabel={tagLabel}
      mainTitle={mainTitle}
      isAvailable={true}
      isCompleted={isCompleted}
      amountAnswered={displayAmount}
      totalQuestions={totalPoints}
      colorTheme={colorTheme}
      startLabel="Luyện viết"
      progressOnly={true}
    />
  );
}
