"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioData } from "@/lib/types";
import { useQuizStore } from "@/store/quizStore";
import { playSound } from "@/utils/audio";
import { ScenarioOptionGrid } from "@/components/scenario/ScenarioOptionGrid";
import { ResultSummary } from "@/components/common/ResultSummary";
import { QuizHeader } from "@/components/common/QuizHeader";

interface ScenarioEngineProps {
  data: ScenarioData;
  testId: string;
}

export function ScenarioEngine({ data, testId }: ScenarioEngineProps) {
  const router = useRouter();
  const { scenarioProgress, updateScenarioState, answerScenarioBlank, restartScenario, isMuted, toggleMute } = useQuizStore();
  const [mounted, setMounted] = useState(false);
  const [previewBlankKey, setPreviewBlankKey] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const progress = scenarioProgress[testId];
  const scenarioIdx = progress?.scenarioIdx ?? 0;
  const passageIdx = progress?.passageIdx ?? 0;
  const blankIdx = progress?.blankIdx ?? 0;
  const answers = progress?.answers ?? {};
  const showSummary = progress?.isFinished ?? false;

  const activeScenarioIdx = previewBlankKey !== null ? parseInt(previewBlankKey.split("-")[0]) : scenarioIdx;
  const activePassageIdx = previewBlankKey !== null ? parseInt(previewBlankKey.split("-")[1]) : passageIdx;
  const activeBlankIdx = previewBlankKey !== null ? parseInt(previewBlankKey.split("-")[2]) : blankIdx;

  const scenario = data.scenarios[activeScenarioIdx];
  const passage = scenario?.passages[activePassageIdx];
  const blank = passage?.blanks[activeBlankIdx];

  // Count totals
  const totalBlanks = data.scenarios.reduce(
    (sum, s) => sum + s.passages.reduce((ps, p) => ps + p.blanks.length, 0), 0
  );
  const answeredCount = Object.keys(answers).length;

  const blankKey = `${activeScenarioIdx}-${activePassageIdx}-${activeBlankIdx}`;
  const selectedOption = answers[blankKey] ?? null;
  const isAnswered = selectedOption !== null;

  const restartCount = progress?.restartCount ?? 0;
  
  // Stable pseudo-random shuffle per blankKey & restartCount
  const displayOptions = useMemo(() => {
    if (restartCount === 0 || !blank || !blank.options) return blank?.options || [];
    
    let hash = 0;
    const str = blankKey + restartCount;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    const pseudoRandom = () => {
        hash = Math.imul(741103597, hash) + 1 | 0;
        let t = Math.imul(hash ^ (hash >>> 15), 1597334677);
        t = (t ^ (t >>> 15)) * (1.0 / 4294967296);
        return t + 0.5;
    };

    const shuffled = [...blank.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [blank, restartCount, blankKey]);

  const handleSelect = (option: string) => {
    if (selectedOption !== null) return;
    const isCorrect = option === blank?.answer;
    answerScenarioBlank(testId, blankKey, option, isCorrect);
    
    if (!isMuted) {
      playSound(isCorrect ? 'correct' : 'incorrect');
    }
  };

  const goNext = () => {
    // Next blank in current passage
    if (blankIdx < passage.blanks.length - 1) {
      updateScenarioState(testId, { blankIdx: blankIdx + 1 });
      return;
    }

    // Next passage in current scenario
    if (passageIdx < scenario.passages.length - 1) {
      updateScenarioState(testId, { passageIdx: passageIdx + 1, blankIdx: 0 });
      return;
    }

    // Next scenario
    if (scenarioIdx < data.scenarios.length - 1) {
      updateScenarioState(testId, { scenarioIdx: scenarioIdx + 1, passageIdx: 0, blankIdx: 0 });
      return;
    }

    // All done
    updateScenarioState(testId, { isFinished: true });
  };

  const goPrev = () => {
    if (blankIdx > 0) {
      updateScenarioState(testId, { blankIdx: blankIdx - 1 });
      return;
    }

    if (passageIdx > 0) {
      const prevPassage = scenario.passages[passageIdx - 1];
      updateScenarioState(testId, { passageIdx: passageIdx - 1, blankIdx: prevPassage.blanks.length - 1 });
      return;
    }

    if (scenarioIdx > 0) {
      const prevScenario = data.scenarios[scenarioIdx - 1];
      const prevPassage = prevScenario.passages[prevScenario.passages.length - 1];
      updateScenarioState(testId, {
        scenarioIdx: scenarioIdx - 1,
        passageIdx: prevScenario.passages.length - 1,
        blankIdx: prevPassage.blanks.length - 1
      });
      return;
    }
  };

  // Keyboard controls
  useEffect(() => {
    if (!mounted || !progress || showSummary || previewBlankKey !== null) return;

    const currentOptions = blank?.options || [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAnswered) {
        const key = parseInt(e.key);
        if (key >= 1 && key <= currentOptions.length) {
          const opt = currentOptions[key - 1];
          handleSelect(typeof opt === 'string' ? opt : opt.text);
        }
      } else {
        if (e.code === "Space") {
          e.preventDefault();
          goNext();
        }
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, progress, showSummary, isAnswered, blankKey, blank, previewBlankKey, handleSelect, goNext, goPrev]);

  // Render passage text with blanks highlighted
  const renderPassageText = () => {
    if (!passage) return null;
    const parts = passage.text.split(/\{(\d+)\}/g);
    return (
      <p className="text-base md:text-lg leading-loose text-slate-700 font-medium">
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            const bIdx = parseInt(part);
            const bKey = `${activeScenarioIdx}-${activePassageIdx}-${bIdx}`;
            const answered = answers[bKey];
            const blankData = passage.blanks[bIdx];
            const correct = answered === blankData?.answer;
            const isCurrent = bIdx === activeBlankIdx && !(showSummary && previewBlankKey === null);

            if (answered) {
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-lg text-sm font-bold border transition-all ${
                    correct
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-600 border-red-200 line-through"
                  }`}
                >
                  {answered}
                  {!correct && (
                    <span className="no-underline text-emerald-600 font-bold ml-1">
                      → {blankData?.answer}
                    </span>
                  )}
                </span>
              );
            }

            return (
              <span
                key={i}
                className={`inline-flex items-center px-3 py-0.5 mx-0.5 rounded-lg text-sm font-bold border-2 border-dashed transition-all ${
                  isCurrent
                    ? "bg-blue-50 text-blue-600 border-blue-300 animate-pulse"
                    : "bg-slate-50 text-slate-400 border-slate-200"
                }`}
              >
                {isCurrent ? `❓ ${blankData?.hint}` : "______"}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  // Calculate score
  // Calculate score directly from state or store
  const correctCount = progress?.score ?? Object.entries(answers).filter(([key, val]) => {
    const [sIdx, pIdx, bIdx] = key.split("-").map(Number);
    return data.scenarios[sIdx]?.passages[pIdx]?.blanks[bIdx]?.answer === val;
  }).length;

  const allBlanks = data.scenarios.flatMap((s, sIdx) => 
    s.passages.flatMap((p, pIdx) => 
      p.blanks.map((b, bIdx) => ({
        sIdx, pIdx, bIdx, bKey: `${sIdx}-${pIdx}-${bIdx}`, blank: b, scenario: s
      }))
    )
  );

  if (!mounted) return null;

  if (showSummary && previewBlankKey === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <ResultSummary
          score={correctCount}
          total={totalBlanks}
          items={allBlanks.map((item, i) => {
            const hasAnswered = item.bKey in answers;
            const isCorrect = hasAnswered ? item.blank.answer === answers[item.bKey] : false;
            return {
              id: item.bKey,
              isCorrect,
              title: `Vị trí ${i + 1} (${item.blank.hint})`,
              subtitle: item.scenario.title,
              onClickReview: () => setPreviewBlankKey(item.bKey)
            };
          })}
          onRestart={() => restartScenario(testId)}
          onExit={() => router.push(`/part5/${testId}`)}
          exitLabel="Về Luyện Đề"
        />
      </div>
    );
  }

  if (!blank) return null;

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden">
      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6 overflow-hidden">
        {previewBlankKey !== null ? (
          <header className="flex flex-wrap items-center justify-between mb-4 md:mb-6 shrink-0 gap-y-3">
            <button
              onClick={() => setPreviewBlankKey(null)}
              className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-slate-100 group-hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </div>
              <span className="font-bold text-sm">Quay về Kết quả</span>
            </button>
          </header>
        ) : (
          <QuizHeader
            titleText={`Part 5 – ${testId.toUpperCase()} • Tình Huống`}
            subtitleText={`${answeredCount} / ${totalBlanks} từ`}
            progressPercent={(answeredCount / totalBlanks) * 100}
            progressColorClass="bg-emerald-500"
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onRestart={() => restartScenario(testId)}
            onExit={() => router.push(`/part5/${testId}`)}
          />
        )}

        {/* Scenario Title */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {scenario.theme}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            {scenario.title}
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {/* Passage Text */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-6 shadow-sm">
            {renderPassageText()}
          </div>

          {/* Current Blank Question */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {activeBlankIdx + 1}
              </span>
              <h3 className="text-sm font-bold text-slate-600">
                Chọn từ đúng cho chỗ trống: <span className="text-blue-600">{blank.hint}</span>
              </h3>
            </div>

            <ScenarioOptionGrid
              options={displayOptions}
              selectedOption={selectedOption}
              correctAnswer={blank.answer}
              isAnswered={isAnswered}
              onSelect={handleSelect}
            />

            {/* Next/Prev buttons */}
            {previewBlankKey === null && (
              <div className="mt-5 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {(scenarioIdx > 0 || passageIdx > 0 || blankIdx > 0) && (
                  <button
                    onClick={goPrev}
                    className="w-14 md:w-16 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Câu trước (Arrow Left)"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {isAnswered ? (
                  <button
                    onClick={goNext}
                    className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {scenarioIdx === data.scenarios.length - 1 &&
                     passageIdx === scenario.passages.length - 1 &&
                     blankIdx === passage.blanks.length - 1
                      ? "Xem Kết Quả (Space)"
                      : blankIdx === passage.blanks.length - 1 &&
                        passageIdx === scenario.passages.length - 1
                      ? "Tình Huống Tiếp (Space)"
                      : "Tiếp Theo (Space)"}
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex-1 py-3.5 bg-slate-100 text-slate-400 font-bold rounded-xl flex items-center justify-center cursor-not-allowed border border-slate-200/50">
                    Chọn một đáp án
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
  