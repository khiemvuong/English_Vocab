import { QuizEngine } from "@/components/QuizEngine";
import { loadQuizData, getAvailablePart5Tests } from "@/lib/quiz-loader";
import Link from "next/link";

export async function generateStaticParams() {
  return getAvailablePart5Tests().map((id) => ({ id }));
}

export default async function Part5Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quizData = loadQuizData("part5", id);

  if (!quizData) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Bài {id.toUpperCase()} Chưa Có</h1>
        <p className="text-slate-500 mb-10 max-w-sm text-lg leading-relaxed">
          Bài kiểm tra này chưa được nạp vào hệ thống.
        </p>
        <Link href="/" className="px-8 py-3.5 bg-white border border-slate-200 shadow-sm rounded-full text-slate-700 font-medium hover:bg-slate-50 hover:shadow transition-all hover:-translate-y-0.5">
          Về Dashboard
        </Link>
      </div>
    );
  }

  return <QuizEngine quizData={quizData} lessonId={`part5-${id}`} />;
}
