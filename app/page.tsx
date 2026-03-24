import { LessonCard } from "@/components/LessonCard";

export default function Home() {
  const lessons = Array.from({ length: 21 }, (_, i) => i + 1);

  return (
    <div className="min-h-dvh p-4 md:p-8 lg:p-12 max-w-5xl mx-auto flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-linear-to-b from-blue-400/20 via-indigo-400/10 to-transparent blur-3xl -z-10 pointer-events-none"></div>

      <header className="mb-16 text-center flex flex-col items-center mt-8 md:mt-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur text-blue-700 rounded-full text-sm font-bold tracking-wide shadow-sm border border-blue-100/50 mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          Intensive Course
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-blue-800 to-indigo-900 drop-shadow-sm mb-5 pb-1">
          TOEIC Vocabulary
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-base md:text-xl font-medium leading-relaxed">
          Master business terminology with a clean, focused, and distraction-free learning experience.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 pb-12 relative z-10">
        {lessons.map((lesson) => (
          <LessonCard key={lesson} lesson={lesson} />
        ))}
      </section>
    </div>
  );
}
