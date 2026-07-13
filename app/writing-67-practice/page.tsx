import type { Metadata } from "next";
import companyEventsData from "@/data/writing67/company-events.json";
import customerServiceData from "@/data/writing67/customer-service.json";
import productsServicesData from "@/data/writing67/products-services.json";
import practiceTestData from "@/data/writing67/practice-test.json";
import { Writing67PracticeEngine } from "@/components/writing67/Writing67PracticeEngine";
import type { Writing67Set } from "@/lib/types";

export const metadata: Metadata = {
  title: "TOEIC Writing 6-7 - Respond to a Written Request",
  description:
    "Học TOEIC Writing câu 6-7 theo luồng vocabulary, dịch nghĩa, task map, mẫu câu, điền đáp án, guided writing và review rubric.",
};

const DATASETS: Record<string, Writing67Set> = {
  "company-events": companyEventsData as Writing67Set,
  "customer-service": customerServiceData as Writing67Set,
  "products-services": productsServicesData as Writing67Set,
  "practice-test": practiceTestData as Writing67Set,
};

export default async function Writing67PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ file?: string }>;
}) {
  const resolvedParams = await searchParams;
  const fileKey = resolvedParams.file || "practice-test";
  const data = DATASETS[fileKey] || DATASETS["practice-test"];

  return <Writing67PracticeEngine data={data} />;
}
