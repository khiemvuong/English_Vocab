import { WritingPracticeEngine } from "@/components/writing/WritingPracticeEngine";
import mixData from "@/data/writing/mix.json";
import introData from "@/data/writing/intro.json";
import topic1Data from "@/data/writing/topic1.json";
import topic2Data from "@/data/writing/topic2.json";
import topic3Data from "@/data/writing/topic3.json";
import topic4Data from "@/data/writing/topic4.json";
import topic5Data from "@/data/writing/topic5.json";
import type { Metadata } from "next";
import type { WritingQuestionSet, WritingQuestion } from "@/lib/types";

export const metadata: Metadata = {
  title: "Luyện Viết Câu Mô Tả Tranh - TOEIC Writing Q1-5",
  description:
    "Luyện tập viết câu mô tả tranh theo format TOEIC Writing câu 1-5. Bộ lọc theo kỹ năng và chủ đề, phân tích chi tiết điểm yếu.",
};

const DATASETS: Record<string, WritingQuestionSet | WritingQuestion[]> = {
  mix: mixData as WritingQuestionSet,
  intro: introData as unknown as WritingQuestion[],
  topic1: topic1Data as unknown as WritingQuestion[],
  topic2: topic2Data as unknown as WritingQuestion[],
  topic3: topic3Data as unknown as WritingQuestion[],
  topic4: topic4Data as unknown as WritingQuestion[],
  topic5: topic5Data as unknown as WritingQuestion[],
};

const TITLES: Record<string, string> = {
  intro: "Khởi động - Luyện viết câu mô tả tranh",
  topic1: "Topic 1: Workplace - Luyện viết câu mô tả tranh",
  topic2: "Topic 2: Home - Luyện viết câu mô tả tranh",
  topic3: "Topic 3: Streets/Park - Luyện viết câu mô tả tranh",
  topic4: "Topic 4: Transportation - Luyện viết câu mô tả tranh",
  topic5: "Topic 5: Places - Luyện viết câu mô tả tranh",
};

const DESCRIPTIONS: Record<string, string> = {
  intro: "Luyện tập làm quen với các mẫu câu cơ bản, chia thì động từ, giới từ, liên từ và từ chỉ mức độ.",
  topic1: "Luyện viết câu mô tả tranh chủ đề công sở, đồng nghiệp, văn phòng.",
  topic2: "Luyện viết câu mô tả tranh chủ đề gia đình, hoạt động dọn dẹp, nội thất.",
  topic3: "Luyện viết câu mô tả tranh chủ đề hoạt động ngoài trời, công viên, đường sá.",
  topic4: "Luyện viết câu mô tả tranh chủ đề phương tiện giao thông, ga tàu, sân bay.",
  topic5: "Luyện viết câu mô tả tranh chủ đề cửa hàng, nhà hàng, hiệu sách.",
};

export default async function WritingPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ file?: string }>;
}) {
  const resolvedParams = await searchParams;
  const fileKey = resolvedParams.file || "mix";
  const rawData = DATASETS[fileKey] || mixData;

  const data: WritingQuestionSet = Array.isArray(rawData)
    ? {
        setId: `writing-${fileKey}`,
        title: TITLES[fileKey] || "Luyện viết câu mô tả tranh",
        description: DESCRIPTIONS[fileKey] || "Luyện tập viết câu mô tả tranh.",
        sourceMaterial: mixData.sourceMaterial,
        skillTypes: mixData.skillTypes,
        totalQuestions: rawData.length,
        questions: rawData,
      }
    : (rawData as WritingQuestionSet);

  return <WritingPracticeEngine data={data} />;
}
