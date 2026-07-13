import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  MAX_PERSISTED_SCENARIO_PROGRESS,
  pruneProgressRecord,
  readLegacyQuizStorageState,
  withUpdatedAt,
} from "@/lib/progressPersistence";

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

interface ScenarioProgressStore {
  scenarioProgress: Record<string, ScenarioProgress>;
  updateScenarioState: (testId: string, updates: Partial<ScenarioProgress>) => void;
  answerScenarioBlank: (testId: string, blankKey: string, answer: string, isCorrect: boolean) => void;
  restartScenario: (testId: string) => void;
}

function createEmptyScenarioProgress(): ScenarioProgress {
  return {
    scenarioIdx: 0,
    passageIdx: 0,
    blankIdx: 0,
    answers: {},
    isFinished: false,
    score: 0,
  };
}

function getLegacyScenarioProgress() {
  const legacyState = readLegacyQuizStorageState();
  const scenarioProgress = legacyState?.scenarioProgress;
  return scenarioProgress && typeof scenarioProgress === "object" ? scenarioProgress as Record<string, ScenarioProgress> : {};
}

export const useScenarioProgressStore = create<ScenarioProgressStore>()(
  persist(
    (set) => ({
      scenarioProgress: getLegacyScenarioProgress(),
      updateScenarioState: (testId, updates) => set((state) => {
        const current = state.scenarioProgress[testId] || createEmptyScenarioProgress();
        return {
          scenarioProgress: {
            ...state.scenarioProgress,
            [testId]: withUpdatedAt({ ...current, ...updates }),
          },
        };
      }),
      answerScenarioBlank: (testId, blankKey, answer, isCorrect) => set((state) => {
        const current = state.scenarioProgress[testId] || createEmptyScenarioProgress();
        if (current.answers[blankKey] !== undefined) return state;

        return {
          scenarioProgress: {
            ...state.scenarioProgress,
            [testId]: withUpdatedAt({
              ...current,
              answers: { ...current.answers, [blankKey]: answer },
              score: isCorrect ? current.score + 1 : current.score,
            }),
          },
        };
      }),
      restartScenario: (testId) => set((state) => {
        const current = state.scenarioProgress[testId];
        return {
          scenarioProgress: {
            ...state.scenarioProgress,
            [testId]: withUpdatedAt({
              ...(current || createEmptyScenarioProgress()),
              answers: {},
              scenarioIdx: 0,
              passageIdx: 0,
              blankIdx: 0,
              isFinished: false,
              score: 0,
              restartCount: (current?.restartCount || 0) + 1,
            }),
          },
        };
      }),
    }),
    {
      name: "toeic-scenario-progress-storage",
      partialize: (state) => ({
        scenarioProgress: pruneProgressRecord(state.scenarioProgress, MAX_PERSISTED_SCENARIO_PROGRESS),
      }),
    }
  )
);
