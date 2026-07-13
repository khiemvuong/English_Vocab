import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  MAX_PERSISTED_WRITING_PROGRESS,
  pruneProgressRecord,
  readLegacyQuizStorageState,
  withUpdatedAt,
} from "@/lib/progressPersistence";

export interface WritingProgress {
  currentIndex: number;
  answers: Record<number, number>;
  score: number;
  isFinished: boolean;
  totalQuestions: number;
  restartCount?: number;
  filteredQuestionIds: string[];
  viewedHints: Record<number, boolean>;
  skillAccuracy: Record<string, { correct: number; total: number }>;
  skippedStates?: Record<string, true>;
  blockIndex?: number;
  currentState?: 1 | 2 | 3;
  unlockedBlockIndex?: number;
  typedAnswers?: Record<number, { text: string; isCorrect: boolean; overrideCorrect?: boolean }>;
  vocabAnswers?: Record<number, number>;
  enabledStates?: Record<1 | 2 | 3, boolean>;
  state3RetryIndices?: number[];
  updatedAt?: number;
}

interface WritingProgressStore {
  writingProgress: Record<string, WritingProgress>;
  initWriting: (sessionId: string, questionIds: string[]) => void;
  answerWritingQuestion: (sessionId: string, qIndex: number, optionIndex: number, isCorrect: boolean, skillType: string) => void;
  toggleWritingHint: (sessionId: string, qIndex: number) => void;
  goToNextWriting: (sessionId: string) => void;
  goToPrevWriting: (sessionId: string) => void;
  restartWriting: (sessionId: string, questionIds: string[]) => void;
  finishWriting: (sessionId: string) => void;
  setWritingBlockAndState: (sessionId: string, blockIndex: number, currentState: 1 | 2 | 3) => void;
  markWritingStateSkipped: (sessionId: string, qIndex: number, currentState: 1 | 2 | 3) => void;
  answerWritingVocab: (sessionId: string, qIndex: number, optionIndex: number, isCorrect: boolean, skillType: string) => void;
  answerWritingTyped: (sessionId: string, qIndex: number, text: string, isCorrect: boolean, overrideCorrect: boolean, skillType: string) => void;
  unlockNextBlock: (sessionId: string) => void;
  restartWritingBlock: (sessionId: string, indicesToClear: number[]) => void;
  setWritingEnabledStates: (sessionId: string, enabledStates: Record<1 | 2 | 3, boolean>) => void;
  restartWritingState3Mistakes: (sessionId: string, indicesToClear: number[]) => void;
  clearWritingState3Retry: (sessionId: string) => void;
}

function createWritingSession(questionIds: string[], restartCount = 0): WritingProgress {
  return {
    currentIndex: 0,
    answers: {},
    score: 0,
    isFinished: false,
    totalQuestions: questionIds.length,
    restartCount,
    filteredQuestionIds: questionIds,
    viewedHints: {},
    skillAccuracy: {},
    skippedStates: {},
    blockIndex: 0,
    currentState: 1,
    unlockedBlockIndex: 0,
    typedAnswers: {},
    vocabAnswers: {},
    enabledStates: { 1: true, 2: true, 3: true },
    state3RetryIndices: [],
  };
}

function getLegacyWritingProgress() {
  const legacyState = readLegacyQuizStorageState();
  const writingProgress = legacyState?.writingProgress;
  return writingProgress && typeof writingProgress === "object" ? writingProgress as Record<string, WritingProgress> : {};
}

export const useWritingProgressStore = create<WritingProgressStore>()(
  persist(
    (set) => ({
      writingProgress: getLegacyWritingProgress(),
      initWriting: (sessionId, questionIds) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session || session.filteredQuestionIds.join(",") !== questionIds.join(",")) {
          return {
            writingProgress: {
              ...state.writingProgress,
              [sessionId]: withUpdatedAt(createWritingSession(questionIds)),
            },
          };
        }
        return state;
      }),
      answerWritingQuestion: (sessionId, qIndex, optionIndex, isCorrect, skillType) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session || session.answers[qIndex] !== undefined) return state;

        const currentSkillAcc = session.skillAccuracy[skillType] || { correct: 0, total: 0 };
        const skippedStates = { ...(session.skippedStates || {}) };
        delete skippedStates[`${qIndex}-2`];

        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              answers: { ...session.answers, [qIndex]: optionIndex },
              score: isCorrect ? session.score + 1 : session.score,
              skippedStates,
              skillAccuracy: {
                ...session.skillAccuracy,
                [skillType]: {
                  correct: isCorrect ? currentSkillAcc.correct + 1 : currentSkillAcc.correct,
                  total: currentSkillAcc.total + 1,
                },
              },
            }),
          },
        };
      }),
      toggleWritingHint: (sessionId, qIndex) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;

        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              viewedHints: {
                ...session.viewedHints,
                [qIndex]: !session.viewedHints[qIndex],
              },
            }),
          },
        };
      }),
      goToNextWriting: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;

        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt(
              session.currentIndex < session.totalQuestions - 1
                ? { ...session, currentIndex: session.currentIndex + 1 }
                : { ...session, isFinished: true }
            ),
          },
        };
      }),
      goToPrevWriting: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session || session.currentIndex === 0) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({ ...session, currentIndex: session.currentIndex - 1 }),
          },
        };
      }),
      restartWriting: (sessionId, questionIds) => set((state) => {
        const session = state.writingProgress[sessionId];
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt(createWritingSession(questionIds, (session?.restartCount || 0) + 1)),
          },
        };
      }),
      finishWriting: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({ ...session, isFinished: true }),
          },
        };
      }),
      setWritingBlockAndState: (sessionId, blockIndex, currentState) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              blockIndex,
              currentState,
              currentIndex: 0,
              state3RetryIndices: currentState === 3 ? session.state3RetryIndices || [] : [],
            }),
          },
        };
      }),
      markWritingStateSkipped: (sessionId, qIndex, currentState) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              skippedStates: {
                ...(session.skippedStates || {}),
                [`${qIndex}-${currentState}`]: true,
              },
              ...(currentState === 3
                ? {
                    typedAnswers: Object.fromEntries(
                      Object.entries(session.typedAnswers || {}).filter(([key]) => Number(key) !== qIndex)
                    ),
                  }
                : {}),
            }),
          },
        };
      }),
      answerWritingVocab: (sessionId, qIndex, optionIndex, isCorrect, skillType) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        const vocabAnswers = session.vocabAnswers || {};
        if (vocabAnswers[qIndex] !== undefined) return state;

        const currentSkillAcc = session.skillAccuracy[skillType] || { correct: 0, total: 0 };
        const skippedStates = { ...(session.skippedStates || {}) };
        delete skippedStates[`${qIndex}-1`];
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              vocabAnswers: { ...vocabAnswers, [qIndex]: optionIndex },
              score: isCorrect ? session.score + 1 : session.score,
              skippedStates,
              skillAccuracy: {
                ...session.skillAccuracy,
                [skillType]: {
                  correct: isCorrect ? currentSkillAcc.correct + 1 : currentSkillAcc.correct,
                  total: currentSkillAcc.total + 1,
                },
              },
            }),
          },
        };
      }),
      answerWritingTyped: (sessionId, qIndex, text, isCorrect, overrideCorrect, skillType) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        const typedAnswers = session.typedAnswers || {};
        if (typedAnswers[qIndex] !== undefined) return state;

        const currentSkillAcc = session.skillAccuracy[skillType] || { correct: 0, total: 0 };
        const finalCorrect = isCorrect || overrideCorrect;
        const skippedStates = { ...(session.skippedStates || {}) };
        delete skippedStates[`${qIndex}-3`];
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              typedAnswers: { ...typedAnswers, [qIndex]: { text, isCorrect, overrideCorrect } },
              score: finalCorrect ? session.score + 1 : session.score,
              skippedStates,
              skillAccuracy: {
                ...session.skillAccuracy,
                [skillType]: {
                  correct: finalCorrect ? currentSkillAcc.correct + 1 : currentSkillAcc.correct,
                  total: currentSkillAcc.total + 1,
                },
              },
            }),
          },
        };
      }),
      unlockNextBlock: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        const nextUnlocked = (session.unlockedBlockIndex ?? 0) + 1;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              unlockedBlockIndex: nextUnlocked,
              blockIndex: nextUnlocked,
              currentState: 1,
              currentIndex: 0,
              state3RetryIndices: [],
            }),
          },
        };
      }),
      restartWritingBlock: (sessionId, indicesToClear) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;

        const newAnswers = { ...session.answers };
        const newVocabAnswers = { ...(session.vocabAnswers || {}) };
        const newTypedAnswers = { ...(session.typedAnswers || {}) };
        const newSkippedStates = { ...(session.skippedStates || {}) };

        indicesToClear.forEach((idx) => {
          delete newAnswers[idx];
          delete newVocabAnswers[idx];
          delete newTypedAnswers[idx];
          delete newSkippedStates[`${idx}-1`];
          delete newSkippedStates[`${idx}-2`];
          delete newSkippedStates[`${idx}-3`];
        });

        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              currentIndex: 0,
              answers: newAnswers,
              vocabAnswers: newVocabAnswers,
              typedAnswers: newTypedAnswers,
              skippedStates: newSkippedStates,
              isFinished: false,
            }),
          },
        };
      }),
      setWritingEnabledStates: (sessionId, enabledStates) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({ ...session, enabledStates }),
          },
        };
      }),
      restartWritingState3Mistakes: (sessionId, indicesToClear) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;

        const newTypedAnswers = { ...(session.typedAnswers || {}) };
        const newSkippedStates = { ...(session.skippedStates || {}) };

        indicesToClear.forEach((idx) => {
          delete newTypedAnswers[idx];
          delete newSkippedStates[`${idx}-3`];
        });

        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              currentIndex: 0,
              currentState: 3,
              typedAnswers: newTypedAnswers,
              skippedStates: newSkippedStates,
              state3RetryIndices: indicesToClear,
              isFinished: false,
            }),
          },
        };
      }),
      clearWritingState3Retry: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({ ...session, state3RetryIndices: [] }),
          },
        };
      }),
    }),
    {
      name: "toeic-writing-progress-storage",
      partialize: (state) => ({
        writingProgress: pruneProgressRecord(state.writingProgress, MAX_PERSISTED_WRITING_PROGRESS),
      }),
    }
  )
);
