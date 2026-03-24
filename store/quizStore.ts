import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LessonProgress {
  currentIndex: number;
  answers: Record<number, number>; // questionIndex -> selectedOptionIndex
  score: number;
  isFinished: boolean;
  totalQuestions: number;
}

interface QuizStore {
  progress: Record<string, LessonProgress>;
  initLesson: (lessonId: string, totalQuestions: number) => void;
  answerQuestion: (lessonId: string, qIndex: number, optionIndex: number, isCorrect: boolean) => void;
  goToNext: (lessonId: string, totalQuestions: number) => void;
  goToPrev: (lessonId: string) => void;
  restartLesson: (lessonId: string) => void;
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      progress: {},
      initLesson: (lessonId, totalQuestions) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson) {
          return {
            progress: {
              ...state.progress,
              [lessonId]: { currentIndex: 0, answers: {}, isFinished: false, score: 0, totalQuestions }
            }
          }
        } else if (lesson.totalQuestions !== totalQuestions) {
          return { progress: { ...state.progress, [lessonId]: { ...lesson, totalQuestions } } };
        }
        return state;
      }),
      answerQuestion: (lessonId, qIndex, optionIndex, isCorrect) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson || lesson.answers[qIndex] !== undefined) return state; // already answered
        
        return {
          progress: {
            ...state.progress,
            [lessonId]: {
              ...lesson,
              answers: { ...lesson.answers, [qIndex]: optionIndex },
              score: isCorrect ? lesson.score + 1 : lesson.score
            }
          }
        }
      }),
      goToNext: (lessonId, totalQuestions) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson) return state;
        if (lesson.currentIndex < totalQuestions - 1) {
          return {
            progress: {
              ...state.progress,
              [lessonId]: { ...lesson, currentIndex: lesson.currentIndex + 1 }
            }
          }
        } else {
          return {
            progress: {
              ...state.progress,
              [lessonId]: { ...lesson, isFinished: true }
            }
          }
        }
      }),
      goToPrev: (lessonId) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson || lesson.currentIndex === 0) return state;
        return {
          progress: {
            ...state.progress,
            [lessonId]: { ...lesson, currentIndex: lesson.currentIndex - 1 }
          }
        }
      }),
      restartLesson: (lessonId) => set((state) => ({
        progress: {
          ...state.progress,
          [lessonId]: { 
            currentIndex: 0, 
            answers: {}, 
            isFinished: false, 
            score: 0, 
            totalQuestions: state.progress[lessonId]?.totalQuestions || 0 
          }
        }
      }))
    }),
    {
      name: 'toeic-quiz-storage',
    }
  )
)
