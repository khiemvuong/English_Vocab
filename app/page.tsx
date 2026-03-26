import { HomeContent } from "@/components/HomeContent";
import { getAvailablePart5Tests, getAvailableVocabLessons } from "@/lib/quiz-loader";
import { TOTAL_VOCAB_LESSONS, TOTAL_PART5_TESTS } from "@/lib/constants";

export default function Home() {
  const availablePart5 = new Set(getAvailablePart5Tests());
  const availableVocab = getAvailableVocabLessons();

  const part5Tests = Array.from({ length: TOTAL_PART5_TESTS }, (_, i) => {
    const id = `bt${i + 1}`;
    return {
      id,
      label: id.toUpperCase(),
      range: "Questions 101–130",
      isAvailable: availablePart5.has(id),
    };
  });

  return (
    <HomeContent
      part5Tests={part5Tests}
      totalVocabLessons={TOTAL_VOCAB_LESSONS}
      availableVocabLessons={availableVocab}
    />
  );
}
