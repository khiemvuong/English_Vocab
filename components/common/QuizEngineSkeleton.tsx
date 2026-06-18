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
  return <div className={`${h} ${w} bg-white/10 rounded-lg animate-pulse`} />;
}

function SkeletonAnswerButton({ widthPercent }: { widthPercent: number }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-slate-900/30 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse shrink-0" />
      <div className="flex-1">
        <div
          className="h-4 bg-white/10 rounded animate-pulse"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

export function QuizEngineSkeleton({ variant = "quiz" }: QuizEngineSkeletonProps) {
  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-slate-950 text-white relative">
      {/* Background radial gradients for glassmorphism glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Main layout container */}
      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6 overflow-hidden relative z-10">
        {/* Header skeleton */}
        <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 shrink-0 gap-y-3">
          {/* Title area */}
          <PulseBar w="w-36" h="h-4" />
          {/* Progress bar */}
          <div className="flex-1 flex justify-center px-2">
            <div className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full" />
          </div>
          {/* Control buttons */}
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
            <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
            <div className="w-16 h-8 bg-white/10 rounded-full animate-pulse" />
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
              <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5 space-y-3 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <PulseBar w="w-full" />
                <PulseBar w="w-5/6" />
                <PulseBar w="w-4/5" />
                <PulseBar w="w-full" />
                <PulseBar w="w-2/3" />
              </div>
              {/* Question + options block */}
              <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-5 space-y-4 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/10 rounded-full animate-pulse shrink-0" />
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
      <div className="shrink-0 w-full bg-slate-900/50 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.55)] relative z-10">
        <div className="w-full max-w-3xl mx-auto p-3 md:p-5 px-4 md:px-6 flex justify-between items-center">
          <div className="h-10 w-20 bg-white/10 rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-white/10 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
