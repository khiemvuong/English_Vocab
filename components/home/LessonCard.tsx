"use client";

import Link from "next/link";
import { useQuizStore } from "@/store/quizStore";
import { useEffect, useState } from "react";
import { ProgressCard } from "@/components/common/ProgressCard";

export function LessonCard({ lesson, isAvailable = false }: { lesson: number; isAvailable?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const progressState = useQuizStore(state => state.progress[lesson.toString()]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  
  const isCompleted = mounted && progressState?.isFinished;
  const amountAnswered = mounted && progressState?.answers ? Object.keys(progressState.answers).length : 0;
  const totalQuestions = mounted && progressState?.totalQuestions ? progressState.totalQuestions : 1;
  const inProgress = mounted && !isCompleted && amountAnswered > 0;
  
  return (
    <ProgressCard
      href={`/lesson/${lesson}`}
      tagLabel="Lesson"
      mainTitle={lesson.toString().padStart(2, '0')}
      isAvailable={isAvailable}
      isCompleted={isCompleted}
      amountAnswered={amountAnswered}
      totalQuestions={totalQuestions}
      score={progressState?.score}
      colorTheme="blue"
      startLabel="Start Quiz"
    />
  );
}
