"use client";

import { type CardColorTheme } from "@/components/common/ProgressCard";
import { WritingCourseCard } from "@/components/home/WritingCourseCard";

interface WritingLessonCardProps {
  file: string;
  tagLabel: string;
  mainTitle: string;
  totalQuestions: number;
  colorTheme: CardColorTheme;
}

export function WritingLessonCard(props: WritingLessonCardProps) {
  return <WritingCourseCard kind="q1-5" {...props} />;
}
