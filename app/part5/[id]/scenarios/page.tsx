import { ScenarioEngine } from "@/components/ScenarioEngine";
import { loadScenarioData, getTestsWithScenarios } from "@/lib/quiz-loader";
import Link from "next/link";

export async function generateStaticParams() {
  return getTestsWithScenarios().map((id) => ({ id }));
}

export default async function ScenariosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenarioData = loadScenarioData(id);

  if (!scenarioData) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Chưa có tình huống</h1>
        <p className="text-slate-500 mb-10 max-w-sm text-lg leading-relaxed">
          Bài {id.toUpperCase()} chưa có dữ liệu tình huống từ vựng.
        </p>
        <Link href={`/part5/${id}`} className="px-8 py-3.5 bg-white border border-slate-200 shadow-sm rounded-full text-slate-700 font-medium hover:bg-slate-50 hover:shadow transition-all hover:-translate-y-0.5">
          Về Luyện Đề
        </Link>
      </div>
    );
  }

  return <ScenarioEngine data={scenarioData} testId={id} />;
}
