import { QuizEngine } from "@/components/QuizEngine";
import fs from "fs";
import path from "path";
import Link from "next/link";

interface AnswerOption {
  text: string;
  isCorrect: boolean;
  rationale: string;
}

interface Question {
  question: string;
  answerOptions: AnswerOption[];
  hint: string;
}

interface QuizData {
  title: string;
  questions: Question[];
}

export async function generateStaticParams() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: (i + 1).toString(),
  }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const lessonNum = parseInt(id);

  if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 8) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Lesson {id} Locked</h1>
        <p className="text-slate-500 mb-10 max-w-sm text-lg leading-relaxed">
          Generate the quiz using NotebookLM to unlock this vocabulary module.
        </p>
        <Link href="/" className="px-8 py-3.5 bg-white border border-slate-200 shadow-sm rounded-full text-slate-700 font-medium hover:bg-slate-50 hover:shadow transition-all hover:-translate-y-0.5">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const filePath = path.join(process.cwd(), "data", `lesson${id}_quiz.json`);
  let quizData: QuizData;
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    quizData = JSON.parse(fileContents);
  } catch (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-md text-center">
           <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <p className="font-medium">Error loading quiz data. Ensure data/lesson2_quiz.json exists.</p>
        </div>
      </div>
    );
  }

  return <QuizEngine quizData={quizData} lessonId={id} />;
}
