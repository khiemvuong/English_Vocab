import fs from "fs";
import path from "path";
import type { QuizData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function scanQuizFiles(subdir: string, pattern: RegExp): string[] {
  const dir = path.join(DATA_DIR, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => pattern.test(f))
    .map((f) => f.match(pattern)![1])
    .sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ""));
      const nb = parseInt(b.replace(/\D/g, ""));
      return na - nb;
    });
}

export function getAvailablePart5Tests(): string[] {
  return scanQuizFiles("part5", /^(.+)_quiz\.json$/);
}

export function getAvailableVocabLessons(): number[] {
  return scanQuizFiles("vocabulary", /^lesson(\d+)_quiz\.json$/).map(Number);
}

export function loadQuizData(
  category: "part5" | "vocabulary",
  id: string
): QuizData | null {
  const filename =
    category === "part5" ? `${id}_quiz.json` : `lesson${id}_quiz.json`;
  const filePath = path.join(DATA_DIR, category, filename);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
