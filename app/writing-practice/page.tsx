import { WritingPracticeEngine } from "@/components/writing/WritingPracticeEngine";
import writingData from "@/data/writing/data.json";
import type { Metadata } from "next";
import type { WritingQuestionSet } from "@/lib/types";

export const metadata: Metadata = {
  title: "Luyện Viết Câu Mô Tả Tranh - TOEIC Writing Q1-5",
  description:
    "Luyện tập viết câu mô tả tranh theo format TOEIC Writing câu 1-5. Bộ lọc theo kỹ năng và chủ đề, phân tích chi tiết điểm yếu.",
};

export default function WritingPracticePage() {
  return <WritingPracticeEngine data={writingData as WritingQuestionSet} />;
}
