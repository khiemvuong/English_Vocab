"use client";

import { ProgressCard, type CardColorTheme } from "@/components/common/ProgressCard";

interface Writing67LessonCardProps {
  file: string;
  tagLabel: string;
  mainTitle: string;
  subtitle: string;
  totalPrompts: number;
  colorTheme: CardColorTheme;
}

export function Writing67LessonCard({
  file,
  tagLabel,
  mainTitle,
  subtitle,
  totalPrompts,
  colorTheme,
}: Writing67LessonCardProps) {
  return (
    <ProgressCard
      href={`/writing-67-practice?file=${file}`}
      tagLabel={tagLabel}
      mainTitle={mainTitle}
      subtitle={subtitle}
      isAvailable={true}
      amountAnswered={0}
      totalQuestions={totalPrompts * 7}
      colorTheme={colorTheme}
      startLabel="Học email"
      progressOnly={true}
      watermarkText="67"
      patternTheme="notebook"
    />
  );
}
