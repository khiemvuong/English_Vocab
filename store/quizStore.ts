import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LessonProgress {
  currentIndex: number;
  answers: Record<number, number>; // questionIndex -> selectedOptionIndex
  score: number;
  isFinished: boolean;
  totalQuestions: number;
  restartCount?: number;
  updatedAt?: number;
}

export interface ScenarioProgress {
  scenarioIdx: number;
  passageIdx: number;
  blankIdx: number;
  answers: Record<string, string>;
  isFinished: boolean;
  score: number;
  restartCount?: number;
  updatedAt?: number;
}

export interface WritingProgress {
  currentIndex: number;
  answers: Record<number, number>; // questionIndex -> selectedOptionIndex
  score: number;
  isFinished: boolean;
  totalQuestions: number;
  restartCount?: number;
  filteredQuestionIds: string[]; // IDs of filtered questions
  viewedHints: Record<number, boolean>; // Track hints viewed (not penalized)
  skillAccuracy: Record<string, { correct: number; total: number }>; // Accuracy by skillType
  skippedStates?: Record<string, true>;
  
  // New Fields for 3-State Block-based Practice
  blockIndex?: number;
  currentState?: 1 | 2 | 3;
  unlockedBlockIndex?: number;
  typedAnswers?: Record<number, { text: string; isCorrect: boolean; overrideCorrect?: boolean }>;
  vocabAnswers?: Record<number, number>; // questionIndex -> selectedPhraseOptionIndex
  enabledStates?: Record<1 | 2 | 3, boolean>;
  state3RetryIndices?: number[];
  updatedAt?: number;
}

const MAX_PERSISTED_LESSON_PROGRESS = 160;
const MAX_PERSISTED_SCENARIO_PROGRESS = 80;
const MAX_PERSISTED_WRITING_PROGRESS = 40;

function withUpdatedAt<T extends object>(entry: T): T & { updatedAt: number } {
  return { ...entry, updatedAt: Date.now() };
}

function pruneProgressRecord<T extends { isFinished: boolean; updatedAt?: number }>(
  record: Record<string, T>,
  limit: number
) {
  return Object.fromEntries(
    Object.entries(record)
      .sort(([, a], [, b]) => {
        if (a.isFinished !== b.isFinished) return a.isFinished ? 1 : -1;
        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      })
      .slice(0, limit)
  ) as Record<string, T>;
}

interface QuizStore {
  progress: Record<string, LessonProgress>;
  isMuted: boolean;
  toggleMute: () => void;
  initLesson: (lessonId: string, totalQuestions: number) => void;
  answerQuestion: (lessonId: string, qIndex: number, optionIndex: number, isCorrect: boolean) => void;
  goToNext: (lessonId: string, totalQuestions: number) => void;
  goToPrev: (lessonId: string) => void;
  restartLesson: (lessonId: string) => void;
  scenarioProgress: Record<string, ScenarioProgress>;
  updateScenarioState: (testId: string, updates: Partial<ScenarioProgress>) => void;
  answerScenarioBlank: (testId: string, blankKey: string, answer: string, isCorrect: boolean) => void;
  restartScenario: (testId: string) => void;
  // Writing Practice
  writingProgress: Record<string, WritingProgress>;
  initWriting: (sessionId: string, questionIds: string[]) => void;
  answerWritingQuestion: (sessionId: string, qIndex: number, optionIndex: number, isCorrect: boolean, skillType: string) => void;
  toggleWritingHint: (sessionId: string, qIndex: number) => void;
  goToNextWriting: (sessionId: string) => void;
  goToPrevWriting: (sessionId: string) => void;
  restartWriting: (sessionId: string, questionIds: string[]) => void;
  
  // New Writing Actions
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

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      progress: {},
      scenarioProgress: {},
      isMuted: false,
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      initLesson: (lessonId, totalQuestions) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson) {
          return {
            progress: {
              ...state.progress,
              [lessonId]: withUpdatedAt({ currentIndex: 0, answers: {}, isFinished: false, score: 0, totalQuestions })
            }
          }
        } else if (lesson.totalQuestions !== totalQuestions) {
          return { progress: { ...state.progress, [lessonId]: withUpdatedAt({ ...lesson, totalQuestions }) } };
        }
        return state;
      }),
      answerQuestion: (lessonId, qIndex, optionIndex, isCorrect) => set((state) => {
        const lesson = state.progress[lessonId];
        if (!lesson || lesson.answers[qIndex] !== undefined) return state; // already answered
        
        return {
          progress: {
            ...state.progress,
            [lessonId]: withUpdatedAt({
              ...lesson,
              answers: { ...lesson.answers, [qIndex]: optionIndex },
              score: isCorrect ? lesson.score + 1 : lesson.score
            })
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
              [lessonId]: withUpdatedAt({ ...lesson, currentIndex: lesson.currentIndex + 1 })
            }
          }
        } else {
          return {
            progress: {
              ...state.progress,
              [lessonId]: withUpdatedAt({ ...lesson, isFinished: true })
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
            [lessonId]: withUpdatedAt({ ...lesson, currentIndex: lesson.currentIndex - 1 })
          }
        }
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
            restartCount: (state.progress[lessonId]?.restartCount || 0) + 1
          })
        }
      })),
      updateScenarioState: (testId, updates) => set((state) => {
        const current = state.scenarioProgress[testId] || {
          scenarioIdx: 0,
          passageIdx: 0,
          blankIdx: 0,
          answers: {},
          isFinished: false,
          score: 0
        };
        return {
          scenarioProgress: {
            ...state.scenarioProgress,
            [testId]: withUpdatedAt({ ...current, ...updates })
          }
        };
      }),
      answerScenarioBlank: (testId, blankKey, answer, isCorrect) => set((state) => {
        const current = state.scenarioProgress[testId] || {
          scenarioIdx: 0,
          passageIdx: 0,
          blankIdx: 0,
          answers: {},
          isFinished: false,
          score: 0
        };
        // If already answered, ignore
        if (current.answers[blankKey] !== undefined) return state;
        
        return {
          scenarioProgress: {
            ...state.scenarioProgress,
            [testId]: withUpdatedAt({
              ...current,
              answers: { ...current.answers, [blankKey]: answer },
              score: isCorrect ? current.score + 1 : current.score
            })
          }
        };
      }),
      restartScenario: (testId) => set((state) => {
        const current = state.scenarioProgress[testId];
        return {
          scenarioProgress: {
            ...state.scenarioProgress,
            [testId]: withUpdatedAt({
              ...(current || { scenarioIdx: 0, passageIdx: 0, blankIdx: 0, answers: {}, isFinished: false, score: 0 }),
              answers: {},
              scenarioIdx: 0,
              passageIdx: 0,
              blankIdx: 0,
              isFinished: false,
              score: 0,
              restartCount: (current?.restartCount || 0) + 1
            })
          }
        };
      }),
      // Writing Practice Methods
      writingProgress: {},
      initWriting: (sessionId, questionIds) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session || session.filteredQuestionIds.join(',') !== questionIds.join(',')) {
          return {
            writingProgress: {
              ...state.writingProgress,
              [sessionId]: withUpdatedAt({
                currentIndex: 0,
                answers: {},
                score: 0,
                isFinished: false,
                totalQuestions: questionIds.length,
                restartCount: 0,
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
                state3RetryIndices: []
              })
            }
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
                  total: currentSkillAcc.total + 1
                }
              }
            })
          }
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
                [qIndex]: !session.viewedHints[qIndex]
              }
            })
          }
        };
      }),
      goToNextWriting: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;

        if (session.currentIndex < session.totalQuestions - 1) {
          return {
            writingProgress: {
              ...state.writingProgress,
              [sessionId]: withUpdatedAt({ ...session, currentIndex: session.currentIndex + 1 })
            }
          };
        } else {
          return {
            writingProgress: {
              ...state.writingProgress,
              [sessionId]: withUpdatedAt({ ...session, isFinished: true })
            }
          };
        }
      }),
      goToPrevWriting: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session || session.currentIndex === 0) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({ ...session, currentIndex: session.currentIndex - 1 })
          }
        };
      }),
      restartWriting: (sessionId, questionIds) => set((state) => {
        const session = state.writingProgress[sessionId];
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              currentIndex: 0,
              answers: {},
              score: 0,
              isFinished: false,
              totalQuestions: questionIds.length,
              restartCount: (session?.restartCount || 0) + 1,
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
              state3RetryIndices: []
            })
          }
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
              state3RetryIndices: currentState === 3 ? session.state3RetryIndices || [] : []
            })
          }
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
                [`${qIndex}-${currentState}`]: true
              },
              ...(currentState === 3
                ? {
                    typedAnswers: Object.fromEntries(
                      Object.entries(session.typedAnswers || {}).filter(([key]) => Number(key) !== qIndex)
                    )
                  }
                : {})
            })
          }
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
                  total: currentSkillAcc.total + 1
                }
              }
            })
          }
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
                  total: currentSkillAcc.total + 1
                }
              }
            })
          }
        };
      }),
      unlockNextBlock: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        const currentUnlocked = session.unlockedBlockIndex ?? 0;
        const nextUnlocked = currentUnlocked + 1;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              unlockedBlockIndex: nextUnlocked,
              blockIndex: nextUnlocked,
              currentState: 1,
              currentIndex: 0,
              state3RetryIndices: []
            })
          }
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
              isFinished: false
            })
          }
        };
      }),
      setWritingEnabledStates: (sessionId, enabledStates) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              enabledStates
            })
          }
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
              isFinished: false
            })
          }
        };
      }),
      clearWritingState3Retry: (sessionId) => set((state) => {
        const session = state.writingProgress[sessionId];
        if (!session) return state;
        return {
          writingProgress: {
            ...state.writingProgress,
            [sessionId]: withUpdatedAt({
              ...session,
              state3RetryIndices: []
            })
          }
        };
      })
    }),
    {
      name: 'toeic-quiz-storage',
      partialize: (state) => ({
        progress: pruneProgressRecord(state.progress, MAX_PERSISTED_LESSON_PROGRESS),
        scenarioProgress: pruneProgressRecord(state.scenarioProgress, MAX_PERSISTED_SCENARIO_PROGRESS),
        writingProgress: pruneProgressRecord(state.writingProgress, MAX_PERSISTED_WRITING_PROGRESS),
        isMuted: state.isMuted,
      }),
    }
  )
)
