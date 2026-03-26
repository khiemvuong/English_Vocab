"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioData } from "@/lib/types";
import { useQuizStore } from "@/store/quizStore";

interface ScenarioEngineProps {
  data: ScenarioData;
  testId: string;
}

export function ScenarioEngine({ data, testId }: ScenarioEngineProps) {
  const router = useRouter();
  const { scenarioProgress, updateScenarioState, answerScenarioBlank, restartScenario } = useQuizStore();
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

  const handleSelect = (option: string) => {
    if (selectedOption !== null) return;
    const isCorrect = option === blank?.answer;
    answerScenarioBlank(testId, blankKey, option, isCorrect);
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
          handleSelect(currentOptions[key - 1]);
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
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[85vh] animate-in fade-in zoom-in-95 duration-300">
          
          {/* Modal Header */}
          <div className="px-6 py-6 lg:py-8 border-b border-slate-100 text-center shrink-0 bg-white relative">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-50/80 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 ring-4 ring-blue-50/50">
              <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-1 lg:mb-2">Hoàn thành bài tập!</h2>
            <p className="text-slate-500 font-medium">
              Kết quả: <strong className="text-blue-600 text-xl mx-0.5">
                {correctCount}
              </strong> / {totalBlanks}
            </p>
          </div>

          {/* Modal Body - Scrollable Modal approx 50vh */}
          <div className="p-4 lg:p-6 overflow-y-auto bg-slate-50/50 flex-1 max-h-[50vh]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Kết quả chi tiết</h3>
            
            <div className="flex flex-col gap-2.5">
              {allBlanks.map((item, i) => {
                const hasAnswered = item.bKey in answers;
                const isCorrect = hasAnswered ? item.blank.answer === answers[item.bKey] : false;
                
                return (
                  <button
                    key={item.bKey}
                    onClick={() => setPreviewBlankKey(item.bKey)}
                    className={`flex items-center justify-between p-3.5 lg:p-4 cursor-pointer rounded-2xl border transition-transform hover:-translate-y-0.5 active:scale-95 ${isCorrect ? 'bg-green-50/60 border-green-200 text-green-700 hover:bg-green-50' : 'bg-red-50/60 border-red-200 text-red-700 hover:bg-red-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-100' : 'bg-red-100/80'}`}>
                         {isCorrect ? (
                           <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                         ) : (
                           <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                         )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-sm lg:text-base">Vị trí {i + 1} ({item.blank.hint})</span>
                        <span className="text-xs opacity-70 line-clamp-1">{item.scenario.title}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs lg:text-sm font-semibold flex items-center gap-1 opacity-80 shrink-0">
                      Xem lại
                      <svg className="w-4 h-4 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 lg:p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0">
            <button
              onClick={() => {
                restartScenario(testId);
              }}
              className="flex-[0.4] py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm lg:text-base cursor-pointer"
            >
              Làm lại
            </button>
            <button
            
              onClick={() => router.push(`/part5/${testId}`)}
              className="flex-1 py-3.5 flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-xl shadow-blue-600/20 text-sm lg:text-base cursor-pointer"
            >
              Về Luyện Đề
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!blank) return null;

  // Static options directly from data
  const options = blank.options;

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden">
      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6 overflow-hidden">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between mb-4 md:mb-6 shrink-0 gap-y-3">
          {previewBlankKey !== null ? (
            <button
              onClick={() => setPreviewBlankKey(null)}
              className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-slate-100 group-hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </div>
              <span className="font-bold text-sm">Quay về Kết quả</span>
            </button>
          ) : (
            <>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">
                Tình huống {activeScenarioIdx + 1}/{data.scenarios.length}
                <span className="mx-1.5 text-slate-300">•</span>
                {answeredCount}/{totalBlanks} từ
              </div>

              {/* Progress */}
              <div className="flex-1 flex justify-center w-full min-w-[150px] order-3 md:order-2 md:w-auto px-2 md:px-0">
                <div className="w-full max-w-[200px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(answeredCount / totalBlanks) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => router.push(`/?tab=part5`)}
                title="Exit"
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 bg-slate-100 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer order-2 md:order-3"
              >
                <span className="text-sm font-bold">Exit</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </header>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((option, i) => {
                const letter = ["A", "B", "C", "D"][i];
                const isSelected = selectedOption === option;
                const isCorrectOption = option === blank.answer;
                const showResult = isAnswered;

                let className =
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left";

                if (!showResult) {
                  className += " border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98]";
                } else if (isCorrectOption) {
                  className += " border-emerald-300 bg-emerald-50 text-emerald-800";
                } else if (isSelected && !isCorrectOption) {
                  className += " border-red-300 bg-red-50 text-red-700";
                } else {
                  className += " border-slate-100 bg-white/50 opacity-50";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    disabled={isAnswered}
                    className={className}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                        showResult && isCorrectOption
                          ? "bg-emerald-200 text-emerald-800"
                          : showResult && isSelected
                          ? "bg-red-200 text-red-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="font-semibold text-sm">{option}</span>

                    {showResult && isCorrectOption && (
                      <svg className="w-5 h-5 ml-auto text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <svg className="w-5 h-5 ml-auto text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

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
  