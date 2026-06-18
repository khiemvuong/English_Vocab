import { ScenarioEngine } from "@/components/scenario/ScenarioEngine";
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
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 bg-slate-950 text-white relative overflow-hidden">
        {/* Background radial gradients for glassmorphism glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white/5 border border-white/10 text-slate-300 rounded-3xl flex items-center justify-center mb-6 shadow-lg backdrop-blur-md">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Chưa có tình huống</h1>
          <p className="text-slate-400 mb-10 max-w-sm text-lg leading-relaxed">
            Bài {id.toUpperCase()} chưa có dữ liệu tình huống từ vựng.
          </p>
          <Link href={`/part5/${id}`} className="px-8 py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 shadow-md shadow-white/5">
            Về Luyện Đề
          </Link>
        </div>
      </div>
    );
  }

  return <ScenarioEngine data={scenarioData} testId={id} />;
}
