import { Part5MistakesReview } from "@/components/part5/Part5MistakesReview";
import {
  getAvailablePart5Ets2026Tests,
  getAvailablePart5Tests,
  loadPart5Ets2026Data,
  loadQuizData,
} from "@/lib/quiz-loader";

export default function Part5MistakesPage() {
  const practiceQuizzes = getAvailablePart5Tests()
    .map((id) => {
      const quizData = loadQuizData("part5", id);
      if (!quizData) return null;

      return {
        id,
        title: quizData.title || `Part 5 - ${id.toUpperCase()}`,
        sourceLabel: "Part 5 Practice",
        progressKey: `part5-${id}`,
        href: `/part5/${id}`,
        quizData,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const ets2026Quizzes = getAvailablePart5Ets2026Tests()
    .map((id) => {
      const quizData = loadPart5Ets2026Data(id);
      if (!quizData) return null;

      return {
        id,
        title: quizData.title || `ETS 2026 - ${id.replace("test_", "Test ")}`,
        sourceLabel: "ETS 2026",
        progressKey: `part5-ets2026-${id}`,
        href: `/part5-ets2026/${id}`,
        quizData,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return <Part5MistakesReview quizzes={[...practiceQuizzes, ...ets2026Quizzes]} />;
}
