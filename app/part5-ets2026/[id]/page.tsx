import { QuizEngine } from "@/components/quiz/QuizEngine";
import { loadPart5Ets2026Data, getAvailablePart5Ets2026Tests } from "@/lib/quiz-loader";
import Link from "next/link";

export async function generateStaticParams() {
  return getAvailablePart5Ets2026Tests().map((id) => ({ id }));
}

export default async function Part5Ets2026Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quizData = loadPart5Ets2026Data(id);

  const testNum = id.replace("test_", "");

  if (!quizData) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 bg-slate-950 text-white relative overflow-hidden">
        {/* Background radial gradients for glassmorphism glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white/5 border border-white/10 text-slate-300 rounded-3xl flex items-center justify-center mb-6 shadow-lg backdrop-blur-md">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">ETS 2026 Test {testNum} Chưa Có</h1>
          <p className="text-slate-400 mb-10 max-w-sm text-lg leading-relaxed">
            Bài kiểm tra này chưa được nạp vào hệ thống.
          </p>
          <Link href="/" className="px-8 py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 shadow-md shadow-white/5">
            Về Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <QuizEngine quizData={quizData} lessonId={`part5-ets2026-${id}`} />
  );
}
