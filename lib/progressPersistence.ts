export const MAX_PERSISTED_LESSON_PROGRESS = 160;
export const MAX_PERSISTED_SCENARIO_PROGRESS = 80;
export const MAX_PERSISTED_WRITING_PROGRESS = 40;

export interface TimestampedProgress {
  isFinished: boolean;
  updatedAt?: number;
}

export function withUpdatedAt<T extends object>(entry: T): T & { updatedAt: number } {
  return { ...entry, updatedAt: Date.now() };
}

export function pruneProgressRecord<T extends TimestampedProgress>(
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

export function readLegacyQuizStorageState() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("toeic-quiz-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: unknown };
    return parsed.state && typeof parsed.state === "object" ? parsed.state as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
