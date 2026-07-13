"use client";

import { type CardColorTheme } from "@/components/common/ProgressCard";
import { WritingCourseCard } from "@/components/home/WritingCourseCard";

interface Writing67LessonCardProps {
  file: string;
  tagLabel: string;
  mainTitle: string;
  subtitle: string;
  totalPrompts: number;
  colorTheme: CardColorTheme;
}

export function Writing67LessonCard(props: Writing67LessonCardProps) {
  return <WritingCourseCard kind="q6-7" {...props} />;
}
