import { Part5MistakesReview } from "@/components/part5/Part5MistakesReview";
import { getAvailablePart5Tests, loadQuizData } from "@/lib/quiz-loader";

export default function Part5MistakesPage() {
  const quizzes = getAvailablePart5Tests()
    .map((id) => {
      const quizData = loadQuizData("part5", id);
      if (!quizData) return null;

      return {
        id,
        title: quizData.title || `Part 5 – ${id.toUpperCase()}`,
        quizData,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return <Part5MistakesReview quizzes={quizzes} />;
}
