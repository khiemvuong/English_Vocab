import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  MAX_PERSISTED_LESSON_PROGRESS,
  pruneProgressRecord,
  readLegacyQuizStorageState,
  withUpdatedAt,
} from "@/lib/progressPersistence";

export interface LessonProgress {
  currentIndex: number;
  answers: Record<number, number>;
  score: number;
  isFinished: boolean;
  totalQuestions: number;
  restartCount?: number;
  updatedAt?: number;
}

interface LessonProgressStore {
  progress: Record<string, LessonProgress>;
  initLesson: (lessonId: string, totalQuestions: number) => void;
  answerQuestion: (lessonId: string, qIndex: number, optionIndex: number, isCorrect: boolean) => void;
  goToNext: (lessonId: string, totalQuestions: number) => void;
  goToPrev: (lessonId: string) => void;
  restartLesson: (lessonId: string) => void;
}

function getLegacyLessonProgress() {
  const legacyState = readLegacyQuizStorageState();
  const progress = legacyState?.progress;
  return progress && typeof progress === "object" ? progress as Record<string, LessonProgress> : {};
}

export const useLessonProgressStore = create<LessonProgressStore>()(
  persist(
    (set) => ({
      progress: getLegacyLessonProgress(),
      initLesson: (lessonId, totalQuestions) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson) {
          return {
            progress: {
              ...state.progress,
              [lessonId]: withUpdatedAt({ currentIndex: 0, answers: {}, isFinished: false, score: 0, totalQuestions }),
            },
          };
        }
        if (lesson.totalQuestions !== totalQuestions) {
          return { progress: { ...state.progress, [lessonId]: withUpdatedAt({ ...lesson, totalQuestions }) } };
        }
        return state;
      }),
      answerQuestion: (lessonId, qIndex, optionIndex, isCorrect) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson || lesson.answers[qIndex] !== undefined) return state;

        return {
          progress: {
            ...state.progress,
            [lessonId]: withUpdatedAt({
              ...lesson,
              answers: { ...lesson.answers, [qIndex]: optionIndex },
              score: isCorrect ? lesson.score + 1 : lesson.score,
            }),
          },
        };
      }),
      goToNext: (lessonId, totalQuestions) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson) return state;

        return {
          progress: {
            ...state.progress,
            [lessonId]: withUpdatedAt(
              lesson.currentIndex < totalQuestions - 1
                ? { ...lesson, currentIndex: lesson.currentIndex + 1 }
                : { ...lesson, isFinished: true }
            ),
          },
        };
      }),
      goToPrev: (lessonId) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson || lesson.currentIndex === 0) return state;
        return {
          progress: {
            ...state.progress,
            [lessonId]: withUpdatedAt({ ...lesson, currentIndex: lesson.currentIndex - 1 }),
          },
        };
      }),
      restartLesson: (lessonId) => set((state) => ({
        progress: {
          ...state.progress,
          [lessonId]: withUpdatedAt({
            ...(state.progress[lessonId] || {}),
            currentIndex: 0,
            answers: {},
            isFinished: false,
            score: 0,
            totalQuestions: state.progress[lessonId]?.totalQuestions || 0,
            restartCount: (state.progress[lessonId]?.restartCount || 0) + 1,
          }),
        },
      })),
    }),
    {
      name: "toeic-lesson-progress-storage",
      partialize: (state) => ({
        progress: pruneProgressRecord(state.progress, MAX_PERSISTED_LESSON_PROGRESS),
      }),
    }
  )
);
