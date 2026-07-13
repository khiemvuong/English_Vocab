"use client";

import { useEffect, useState } from "react";

import { ProgressCard, type CardColorTheme } from "@/components/common/ProgressCard";
import { useWritingProgressStore } from "@/store/writingProgressStore";
import {
  countWriting67CompletedSteps,
  readWriting67SavedProgress,
  WRITING67_STEP_COUNT,
  type Writing67SavedProgress,
} from "@/lib/writing67Progress";

type WritingCourseCardProps =
  | {
      kind: "q1-5";
      file: string;
      tagLabel: string;
      mainTitle: string;
      totalQuestions: number;
      colorTheme: CardColorTheme;
    }
  | {
      kind: "q6-7";
      file: string;
      tagLabel: string;
      mainTitle: string;
      subtitle: string;
      totalPrompts: number;
      colorTheme: CardColorTheme;
    };

export function WritingCourseCard(props: WritingCourseCardProps) {
  const [mounted, setMounted] = useState(false);
  const [writing67Progress, setWriting67Progress] = useState<Writing67SavedProgress | null>(null);
  const writingSessionId = props.kind === "q1-5" ? `writing-${props.file}` : "";
  const writingSession = useWritingProgressStore((state) =>
    writingSessionId ? state.writingProgress[writingSessionId] : undefined
  );

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
      if (props.kind === "q6-7") {
        setWriting67Progress(readWriting67SavedProgress(`writing67-${props.file}`));
      }
    });

    return () => cancelAnimationFrame(handle);
  }, [props.file, props.kind]);

  if (props.kind === "q6-7") {
    const totalUnits = props.totalPrompts * WRITING67_STEP_COUNT;
    const completedUnits = writing67Progress?.isFinished
      ? totalUnits
      : Math.min(countWriting67CompletedSteps(writing67Progress), totalUnits);

    return (
      <ProgressCard
        href={`/writing-67-practice?file=${props.file}`}
        tagLabel={props.tagLabel}
        mainTitle={props.mainTitle}
        subtitle={props.subtitle}
        isAvailable={true}
        isCompleted={mounted && !!writing67Progress?.isFinished}
        amountAnswered={mounted ? completedUnits : 0}
        totalQuestions={totalUnits}
        colorTheme={props.colorTheme}
        startLabel="Học email"
        progressOnly={true}
        watermarkText="67"
        patternTheme="notebook"
      />
    );
  }

  const totalQuestions = mounted && writingSession?.totalQuestions ? writingSession.totalQuestions : props.totalQuestions;
  const totalUnits = totalQuestions * 3;
  let completedUnits = 0;

  if (mounted && writingSession) {
    for (let i = 0; i < totalQuestions; i++) {
      if (writingSession.typedAnswers?.[i] !== undefined) {
        completedUnits += 3;
      } else if (writingSession.answers?.[i] !== undefined) {
        completedUnits += 2;
      } else if (writingSession.vocabAnswers?.[i] !== undefined) {
        completedUnits += 1;
      }
    }
  }

  const isCompleted = mounted && !!writingSession?.isFinished;

  return (
    <ProgressCard
      href={`/writing-practice?file=${props.file}`}
      tagLabel={props.tagLabel}
      mainTitle={props.mainTitle}
      isAvailable={true}
      isCompleted={isCompleted}
      amountAnswered={isCompleted ? totalUnits : completedUnits}
      totalQuestions={totalUnits}
      colorTheme={props.colorTheme}
      startLabel="Luyện viết"
      progressOnly={true}
    />
  );
}
