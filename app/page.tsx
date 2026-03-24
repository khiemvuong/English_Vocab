import { LessonCard } from "@/components/LessonCard";

export default function Home() {
  const lessons = Array.from({ length: 21 }, (_, i) => i + 1);

  return (
    <div className="min-h-dvh p-4 md:p-8 lg:p-12 max-w-5xl mx-auto flex flex-col">
      <header className="mb-10 text-center flex flex-col items-center mt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          Intensive Course
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
          TOEIC Vocabulary
        </h1>
        <p className="mt-4 text-slate-500 max-w-xl mx-auto text-base md:text-lg">
          Master business terminology with a clean, focused, and distraction-free learning experience.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 pb-12">
        {lessons.map((lesson) => (
          <LessonCard key={lesson} lesson={lesson} />
        ))}
      </section>
    </div>
  );
}
