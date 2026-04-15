import { Suspense } from "react";
import { HomeContent } from "@/components/home/HomeContent";
import {
  getAvailablePart5Tests,
  getAvailableVocabLessons,
  getAvailablePart6Tests,
  getAvailablePart5Ets2026Tests,
} from "@/lib/quiz-loader";
import { TOTAL_VOCAB_LESSONS, TOTAL_PART5_TESTS, TOTAL_PART6_TESTS } from "@/lib/constants";

export default function Home() {
  const availablePart5 = new Set(getAvailablePart5Tests());
  const availableVocab = getAvailableVocabLessons();
  const availablePart6 = new Set(getAvailablePart6Tests());
  const availableEts2026 = new Set(getAvailablePart5Ets2026Tests());

  const part5Tests = Array.from({ length: TOTAL_PART5_TESTS }, (_, i) => {
    const id = `bt${i + 1}`;
    return {
      id,
      label: id.toUpperCase(),
      range: "Questions 101–130",
      isAvailable: availablePart5.has(id),
    };
  });

  const part6Tests = Array.from({ length: TOTAL_PART6_TESTS }, (_, i) => {
    const id = `bt${i + 1}`;
    return {
      id,
      label: id.toUpperCase(),
      isAvailable: availablePart6.has(id),
    };
  });

  const ets2026Tests = Array.from({ length: 10 }, (_, i) => {
    const id = `test_${i + 1}`;
    return {
      id,
      label: `Test ${i + 1}`,
      isAvailable: availableEts2026.has(id),
    };
  });

  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <HomeContent
        part5Tests={part5Tests}
        part6Tests={part6Tests}
        ets2026Tests={ets2026Tests}
        totalVocabLessons={TOTAL_VOCAB_LESSONS}
        availableVocabLessons={availableVocab}
      />
    </Suspense>
  );
}
