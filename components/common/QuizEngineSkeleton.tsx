/**
 * QuizEngineSkeleton
 * Reusable loading skeleton matching the exact layout of QuizEngine and
 * ScenarioEngine. Prevents CLS (Cumulative Layout Shift) during store hydration.
 *
 * Use for:
 *   !mounted guard in QuizEngine  → variant="quiz"
 *   !mounted guard in ScenarioEngine → variant="scenario"
 */

interface QuizEngineSkeletonProps {
  variant?: "quiz" | "scenario";
}

function PulseBar({ w, h = "h-4" }: { w: string; h?: string }) {
  return <div className={`${h} ${w} bg-slate-200 rounded-lg animate-pulse`} />;
}

function SkeletonAnswerButton({ widthPercent }: { widthPercent: number }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-100 bg-white">
      <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse shrink-0" />
      <div className="flex-1">
        <div
          className="h-4 bg-slate-200 rounded animate-pulse"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

export function QuizEngineSkeleton({ variant = "quiz" }: QuizEngineSkeletonProps) {
  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden">
      {/* Header skeleton */}
      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 shrink-0 gap-y-3">
          {/* Title area */}
          <PulseBar w="w-36" h="h-4" />
          {/* Progress bar */}
          <div className="flex-1 flex justify-center px-2">
            <div className="w-full max-w-[200px] h-1.5 bg-slate-200 rounded-full" />
          </div>
          {/* Control buttons */}
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-16 h-8 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Body skeleton */}
        <div className="flex-1 overflow-hidden pb-8">
          {variant === "scenario" ? (
            /* Scenario: title + passage block + question block */
            <div className="flex flex-col gap-4">
              {/* Scenario title */}
              <div className="mb-2">
                <PulseBar w="w-20" h="h-4" />
                <div className="mt-2">
                  <PulseBar w="w-3/4" h="h-6" />
                </div>
              </div>
              {/* Passage text block */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
                <PulseBar w="w-full" />
                <PulseBar w="w-5/6" />
                <PulseBar w="w-4/5" />
                <PulseBar w="w-full" />
                <PulseBar w="w-2/3" />
              </div>
              {/* Question + options block */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-slate-200 rounded-full animate-pulse shrink-0" />
                  <PulseBar w="w-48" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[75, 60, 80, 55].map((w, i) => (
                    <SkeletonAnswerButton key={i} widthPercent={w} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Quiz: category badge + question text + 4 answer buttons */
            <div className="flex flex-col gap-4 mb-6">
              {/* Category badge */}
              <PulseBar w="w-20" h="h-5" />
              {/* Question lines */}
              <div className="space-y-2">
                <PulseBar w="w-full" h="h-5" />
                <PulseBar w="w-4/5" h="h-5" />
              </div>
              {/* Answer grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {[72, 58, 80, 65].map((w, i) => (
                  <SkeletonAnswerButton key={i} widthPercent={w} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="shrink-0 w-full bg-white/90 border-t border-slate-200">
        <div className="w-full max-w-3xl mx-auto p-3 md:p-5 px-4 md:px-6 flex justify-between items-center">
          <div className="h-10 w-20 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-slate-100 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
