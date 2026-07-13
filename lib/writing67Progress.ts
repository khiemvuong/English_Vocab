import type { Writing67TaskType } from "@/lib/types";

export const WRITING67_STEP_COUNT = 7;

export interface Writing67SavedProgress {
  promptIndex: number;
  step: number;
  selectedVocabAnswers: Record<string, string>;
  contextAnswers: Record<string, string>;
  selectedTaskTypesByPrompt: Record<string, Writing67TaskType[]>;
  selectedPatternIdsByPrompt: Record<string, string[]>;
  blankAnswers: Record<string, string>;
  drafts: Record<string, string>;
  completedSteps: Record<string, true>;
  completedPrompts: Record<string, true>;
  isFinished: boolean;
}

export function getWriting67DraftStorageKey(setId: string) {
  return `writing67:${setId}:drafts`;
}

export function getWriting67ProgressStorageKey(setId: string) {
  return `writing67:${setId}:progress`;
}

export function readWriting67SavedProgress(setId: string) {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.localStorage.getItem(getWriting67ProgressStorageKey(setId)) || "null") as Writing67SavedProgress | null;
  } catch {
    return null;
  }
}

export function countWriting67CompletedSteps(progress: Writing67SavedProgress | null) {
  return Object.keys(progress?.completedSteps ?? {}).length;
}
