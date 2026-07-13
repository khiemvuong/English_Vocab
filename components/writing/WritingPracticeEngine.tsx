"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { getDeterministicShuffle } from "@/utils/shuffle";
import type { WritingQuestionSet, PhraseOption } from "@/lib/types";
import { WritingQuestionCard } from "./WritingQuestionCard";
import { WritingResultSummary } from "./WritingResultSummary";
import { QuizHeader } from "@/components/common/QuizHeader";
import { playSound } from "@/utils/audio";

interface WritingPracticeEngineProps {
  data: WritingQuestionSet;
}

export function WritingPracticeEngine({ data }: WritingPracticeEngineProps) {
  const router = useRouter();
  const {
    writingProgress,
    isMuted,
    toggleMute,
    initWriting,
    answerWritingQuestion,
    answerWritingVocab,
    answerWritingTyped,
    setWritingBlockAndState,
    markWritingStateSkipped,
    unlockNextBlock,
    restartWritingState3Mistakes,
    clearWritingState3Retry,
    setWritingEnabledStates,
    toggleWritingHint,
    restartWriting,
    goToNextWriting,
    goToPrevWriting,
  } = useQuizStore();

  const [mounted, setMounted] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isBlockSettingsOpen, setIsBlockSettingsOpen] = useState(true);
  const [draftEnabledStates, setDraftEnabledStates] = useState<Record<1 | 2 | 3, boolean>>({
    1: true,
    2: true,
    3: true,
  });

  // Stable session ID for the current writing set.
  const [sessionId, setSessionId] = useState(() => data.setId || "writing-practice-main");

  const allQuestions = data.questions;
  const questionIds = useMemo(() => allQuestions.map((q) => q.id), [allQuestions]);

  const session = writingProgress[sessionId];
  const restartCount = session?.restartCount || 0;

  // Filter questions based on current session's filteredQuestionIds
  const activeQuestions = useMemo(() => {
    if (!session?.filteredQuestionIds || session.filteredQuestionIds.length === 0) {
      return allQuestions;
    }
    return session.filteredQuestionIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter((q): q is typeof allQuestions[0] => !!q);
  }, [allQuestions, session]);

  // Dynamic block calculations
  const totalQuestions = activeQuestions.length;

  const blockSizes = useMemo(() => {
    if (totalQuestions <= 0) return [];
    const numBlocks = Math.ceil(totalQuestions / 10);
    const baseSize = Math.floor(totalQuestions / numBlocks);
    const remainder = totalQuestions % numBlocks;

    const sizes: number[] = [];
    for (let i = 0; i < numBlocks; i++) {
      sizes.push(i < remainder ? baseSize + 1 : baseSize);
    }
    return sizes;
  }, [totalQuestions]);

  const blockStartIndices = useMemo(() => {
    const indices: number[] = [];
    let currentStart = 0;
    for (const size of blockSizes) {
      indices.push(currentStart);
      currentStart += size;
    }
    return indices;
  }, [blockSizes]);

  const blockIndex = session?.blockIndex ?? 0;
  const currentState = (session?.currentState ?? 1) as 1 | 2 | 3;
  const numBlocks = blockSizes.length;
  const enabledStates = useMemo(
    () => session?.enabledStates ?? { 1: true, 2: true, 3: true },
    [session?.enabledStates]
  );
  const enabledStateList = useMemo(() => {
    return ([1, 2, 3] as const).filter((state) => enabledStates[state]);
  }, [enabledStates]);

  // Current block questions
  const blockQuestions = useMemo(() => {
    const startIdx = blockStartIndices[blockIndex] ?? 0;
    const currentBlockSize = blockSizes[blockIndex] ?? 0;
    return activeQuestions.slice(startIdx, startIdx + currentBlockSize);
  }, [activeQuestions, blockIndex, blockStartIndices, blockSizes]);

  const blockAbsoluteIndices = useMemo(() => {
    const startIdx = blockStartIndices[blockIndex] ?? 0;
    return blockQuestions.map((_, index) => startIdx + index);
  }, [blockIndex, blockQuestions, blockStartIndices]);

  const answers = useMemo(() => session?.answers ?? {}, [session?.answers]);
  const vocabAnswers = useMemo(() => session?.vocabAnswers ?? {}, [session?.vocabAnswers]);
  const typedAnswers = useMemo(() => session?.typedAnswers ?? {}, [session?.typedAnswers]);
  const skippedStates = useMemo(() => session?.skippedStates ?? {}, [session?.skippedStates]);
  const state3RetryIndices = useMemo(() => session?.state3RetryIndices ?? [], [session?.state3RetryIndices]);
  const isState3Retry = currentState === 3 && state3RetryIndices.length > 0;
  const visibleAbsoluteIndices = useMemo(() => {
    return isState3Retry ? state3RetryIndices : blockAbsoluteIndices;
  }, [blockAbsoluteIndices, isState3Retry, state3RetryIndices]);
  const currentIndex = Math.min(session?.currentIndex ?? 0, Math.max(visibleAbsoluteIndices.length - 1, 0));
  const currentAbsoluteIndex = visibleAbsoluteIndices[currentIndex] ?? blockAbsoluteIndices[0] ?? 0;

  const isFinished = session?.isFinished ?? false;
  const viewedHints = useMemo(() => session?.viewedHints ?? {}, [session?.viewedHints]);
  const skillAccuracy = useMemo(() => session?.skillAccuracy ?? {}, [session?.skillAccuracy]);

  const currentQuestion = activeQuestions[currentAbsoluteIndex];

  // Retrieve selected answer index based on currentState
  const selectedOptionIndex = useMemo(() => {
    if (currentState === 1) {
      return vocabAnswers[currentAbsoluteIndex] ?? null;
    } else if (currentState === 2) {
      return answers[currentAbsoluteIndex] ?? null;
    }
    return null;
  }, [currentState, vocabAnswers, answers, currentAbsoluteIndex]);

  const isAnswered = useMemo(() => {
    if (skippedStates[`${currentAbsoluteIndex}-${currentState}`]) {
      return true;
    }
    if (currentState === 1) {
      return vocabAnswers[currentAbsoluteIndex] !== undefined;
    } else if (currentState === 2) {
      return answers[currentAbsoluteIndex] !== undefined;
    } else if (currentState === 3) {
      return typedAnswers[currentAbsoluteIndex] !== undefined;
    }
    return false;
  }, [currentState, skippedStates, vocabAnswers, answers, typedAnswers, currentAbsoluteIndex]);

  const showHint = viewedHints[currentAbsoluteIndex] || false;

  const showResult = isFinished && !hasReviewed;

  const vocabOptions = useMemo(() => currentQuestion?.phraseOptions || [], [currentQuestion]);

  const displayOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const opts = currentState === 1 ? vocabOptions : currentQuestion.answerOptions;
    return getDeterministicShuffle(opts as (PhraseOption | typeof currentQuestion.answerOptions[0])[], restartCount, currentQuestion.id + "-" + currentState);
  }, [currentQuestion, currentState, vocabOptions, restartCount]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (questionIds.length > 0) {
      initWriting(sessionId, questionIds);
    }
  }, [sessionId, questionIds, initWriting]);

  const handleAnswer = useCallback(
    (optionIndex: number, isCorrect: boolean) => {
      if (!currentQuestion) return;
      if (currentState === 1) {
        answerWritingVocab(sessionId, currentAbsoluteIndex, optionIndex, isCorrect, currentQuestion.skillType);
      } else {
        answerWritingQuestion(sessionId, currentAbsoluteIndex, optionIndex, isCorrect, currentQuestion.skillType);
      }
      if (!isMuted) {
        playSound(isCorrect ? "correct" : "incorrect");
      }
    },
    [sessionId, currentAbsoluteIndex, currentState, currentQuestion, answerWritingVocab, answerWritingQuestion, isMuted]
  );

  const handleAnswerTyped = useCallback(
    (text: string, isCorrect: boolean, overrideCorrect: boolean) => {
      if (!currentQuestion) return;
      answerWritingTyped(sessionId, currentAbsoluteIndex, text, isCorrect, overrideCorrect, currentQuestion.skillType);
      if (!isMuted) {
        playSound(isCorrect || overrideCorrect ? "correct" : "incorrect");
      }
    },
    [sessionId, currentAbsoluteIndex, currentQuestion, answerWritingTyped, isMuted]
  );

  const handleAdvanceAfterState = useCallback(() => {
    if (currentIndex < visibleAbsoluteIndices.length - 1) {
      goToNextWriting(sessionId);
      return;
    }

    setShowTransition(true);
  }, [currentIndex, goToNextWriting, sessionId, visibleAbsoluteIndices.length]);


  const handleNext = useCallback(() => {
    handleAdvanceAfterState();
  }, [handleAdvanceAfterState]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      goToPrevWriting(sessionId);
    }
  }, [currentIndex, sessionId, goToPrevWriting]);

  useEffect(() => {
    if (!mounted || isFinished || showTransition || isBlockSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if (!isAnswered) {
        if (currentState !== 3) {
          const key = parseInt(e.key);
          if (key >= 1 && key <= displayOptions.length) {
            e.preventDefault();
            const selectedText = displayOptions[key - 1].text;
            const originalIdx = (currentState === 1 ? vocabOptions : currentQuestion.answerOptions).findIndex(
              (o) => o.text === selectedText
            );
            if (originalIdx !== -1) {
              handleAnswer(originalIdx, (currentState === 1 ? vocabOptions : currentQuestion.answerOptions)[originalIdx].isCorrect);
            }
          }
        }
      } else {
        if (e.code === "Space" || e.code === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
      }

      if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, isFinished, showTransition, isBlockSettingsOpen, isAnswered, currentState, displayOptions, vocabOptions, currentQuestion, handleAnswer, handleNext, handlePrev]);

  const handleToggleHint = useCallback(() => {
    toggleWritingHint(sessionId, currentAbsoluteIndex);
  }, [sessionId, currentAbsoluteIndex, toggleWritingHint]);

  const handleRestart = useCallback(() => {
    const mainSessionId = data.setId || "writing-practice-main";
    restartWriting(mainSessionId, questionIds);
    setSessionId(mainSessionId);
    setHasReviewed(false);
    setShowTransition(false);
    setIsBlockSettingsOpen(true);
    setDraftEnabledStates({ 1: true, 2: true, 3: true });
  }, [questionIds, restartWriting, data.setId]);

  const handleFinishSession = useCallback(() => {
    setHasReviewed(false);
    useQuizStore.setState((state) => ({
      writingProgress: {
        ...state.writingProgress,
        [sessionId]: {
          ...state.writingProgress[sessionId],
          isFinished: true,
        },
      },
    }));
  }, [sessionId]);

  const handleExit = useCallback(() => router.push("/?tab=writing"), [router]);

  const handleSkipState = useCallback(() => {
    markWritingStateSkipped(sessionId, currentAbsoluteIndex, currentState);
    handleAdvanceAfterState();
  }, [currentAbsoluteIndex, currentState, handleAdvanceAfterState, markWritingStateSkipped, sessionId]);

  // Compute mistake question indices for redoing wrong ones in State 3
  const blockMistakeAbsoluteIndices = useMemo(() => {
    const wrong: number[] = [];
    for (const absIdx of blockAbsoluteIndices) {
      if (skippedStates[`${absIdx}-3`]) continue;
      const ans = typedAnswers[absIdx];
      if (ans && !ans.isCorrect && !ans.overrideCorrect) {
        wrong.push(absIdx);
      }
    }
    return wrong;
  }, [blockAbsoluteIndices, skippedStates, typedAnswers]);

  const handleRedoMistakes = useCallback(() => {
    if (blockMistakeAbsoluteIndices.length === 0) return;
    restartWritingState3Mistakes(sessionId, blockMistakeAbsoluteIndices);
    setShowTransition(false);
  }, [blockMistakeAbsoluteIndices, sessionId, restartWritingState3Mistakes]);

  const finalTypedScore = useMemo(() => {
    let correctCount = 0;
    for (let i = 0; i < activeQuestions.length; i++) {
      const typedAns = typedAnswers[i];
      if (typedAns && (typedAns.isCorrect || typedAns.overrideCorrect)) {
        correctCount++;
      }
    }
    return correctCount;
  }, [activeQuestions, typedAnswers]);

  const moveToNextBlockOrFinish = useCallback(() => {
    clearWritingState3Retry(sessionId);
    if (blockIndex < numBlocks - 1) {
      unlockNextBlock(sessionId);
      setDraftEnabledStates(enabledStates);
      setIsBlockSettingsOpen(true);
      setShowTransition(false);
      return;
    }

    handleFinishSession();
    setShowTransition(false);
  }, [blockIndex, clearWritingState3Retry, enabledStates, handleFinishSession, numBlocks, sessionId, unlockNextBlock]);

  const handleContinueAfterCompletedState = useCallback(() => {
    clearWritingState3Retry(sessionId);
    const nextState = enabledStateList.find((state) => state > currentState);

    if (nextState) {
      setWritingBlockAndState(sessionId, blockIndex, nextState);
      setShowTransition(false);
      return;
    }

    moveToNextBlockOrFinish();
  }, [
    blockIndex,
    clearWritingState3Retry,
    currentState,
    enabledStateList,
    moveToNextBlockOrFinish,
    sessionId,
    setWritingBlockAndState,
  ]);

  const handleStartBlock = useCallback(() => {
    const hasEnabledState = ([1, 2, 3] as const).some((state) => draftEnabledStates[state]);
    if (!hasEnabledState) return;

    setWritingEnabledStates(sessionId, draftEnabledStates);

    for (const state of [1, 2, 3] as const) {
      if (draftEnabledStates[state]) continue;
      blockAbsoluteIndices.forEach((absIdx) => {
        markWritingStateSkipped(sessionId, absIdx, state);
      });
    }

    const firstEnabledState = ([1, 2, 3] as const).find((state) => draftEnabledStates[state]) ?? 1;
    setWritingBlockAndState(sessionId, blockIndex, firstEnabledState);
    clearWritingState3Retry(sessionId);
    setIsBlockSettingsOpen(false);
    setShowTransition(false);
  }, [
    blockAbsoluteIndices,
    blockIndex,
    clearWritingState3Retry,
    draftEnabledStates,
    markWritingStateSkipped,
    sessionId,
    setWritingBlockAndState,
    setWritingEnabledStates,
  ]);

  if (!mounted) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Không tìm thấy câu hỏi</h2>
          <p className="text-slate-400">Vui lòng kiểm tra lại file mix.json.</p>
          <button
            onClick={handleExit}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-slate-950">
        <WritingResultSummary
          score={finalTypedScore}
          total={activeQuestions.length}
          allQuestions={activeQuestions}
          answers={answers}
          skillAccuracy={skillAccuracy}
          onRestart={handleRestart}
          onExit={handleExit}
          vocabAnswers={vocabAnswers}
          typedAnswers={typedAnswers}
          skippedStates={skippedStates}
        />
      </div>
    );
  }

  const progressPercent = visibleAbsoluteIndices.length > 0 ? Math.round((currentIndex / visibleAbsoluteIndices.length) * 100) : 0;
  const progressText = `Block ${blockIndex + 1}/${numBlocks} - Cau ${currentIndex + 1}/${visibleAbsoluteIndices.length}`;

  return (
    <div className="min-h-dvh w-screen bg-slate-950 text-white relative flex flex-col p-4 md:p-6 lg:h-dvh lg:overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-500/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-500/8 blur-[120px] pointer-events-none" />

      {/* Header Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto shrink-0 mb-4">
        <QuizHeader
          titleText={
            sessionId === "writing-practice-wrong"
              ? "Luyện câu sai (TOEIC Writing)"
              : `TOEIC Writing — Block ${blockIndex + 1}`
          }
          subtitleText={progressText}
          progressPercent={progressPercent}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      </div>

      {/* Stepper / Active Stage indicators */}
      <div className="relative z-10 w-full max-w-7xl mx-auto shrink-0 mb-4 px-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-md">
          {/* Visual Stepper */}
          <div className="flex items-center gap-2 md:gap-4 text-xs font-bold w-full sm:w-auto">
            {/* Step 1 */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                currentState === 1
                  ? "bg-violet-500/10 border-violet-500 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)] animate-pulse"
                  : "bg-slate-950/20 border-white/5 text-slate-400"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-md bg-white/5">1</span>
              <span>Học cụm từ</span>
            </div>

            <div className="text-slate-700">&rarr;</div>

            {/* Step 2 */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                currentState === 2
                  ? "bg-violet-500/10 border-violet-500 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)] animate-pulse"
                  : "bg-slate-950/20 border-white/5 text-slate-400"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-md bg-white/5">2</span>
              <span>Trắc nghiệm câu</span>
            </div>

            <div className="text-slate-700">&rarr;</div>

            {/* Step 3 */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                currentState === 3
                  ? "bg-violet-500/10 border-violet-500 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)] animate-pulse"
                  : "bg-slate-950/20 border-white/5 text-slate-400"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-md bg-white/5">3</span>
              <span>Tự viết câu</span>
            </div>
          </div>

          {/* Action buttons (Skip State) */}
          <button
            onClick={handleSkipState}
            disabled={isBlockSettingsOpen || showTransition}
            className={`w-full sm:w-auto px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-bold rounded-lg transition-colors items-center justify-center gap-1 cursor-pointer ${
              isBlockSettingsOpen || showTransition ? "hidden" : "flex"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            Skip
          </button>
        </div>
      </div>

      {/* Centered Question Card container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center items-center py-2 min-h-0 lg:h-full lg:overflow-hidden">
        <div className="w-full max-w-7xl p-5 md:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex flex-col justify-between min-h-0 lg:h-full lg:overflow-hidden">
          {isBlockSettingsOpen ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6 animate-in zoom-in-98 duration-200 py-8">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Block {blockIndex + 1}</p>
                <h3 className="text-xl font-bold text-white">Chọn state muốn làm</h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  Tắt state nào thì toàn bộ state đó trong block này sẽ được ghi là skip trong tổng kết.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3">
                {([1, 2, 3] as const).map((state) => {
                  const labels = {
                    1: "State 1",
                    2: "State 2",
                    3: "State 3",
                  };
                  const descriptions = {
                    1: "Từ vựng",
                    2: "Trắc nghiệm câu hoàn chỉnh",
                    3: "Tự viết câu",
                  };
                  const isEnabled = draftEnabledStates[state];
                  const enabledCount = ([1, 2, 3] as const).filter((item) => draftEnabledStates[item]).length;

                  return (
                    <button
                      key={state}
                      type="button"
                      onClick={() => {
                        if (isEnabled && enabledCount === 1) return;
                        setDraftEnabledStates((current) => ({ ...current, [state]: !current[state] }));
                      }}
                      className={`rounded-xl border px-4 py-4 text-left transition-all ${
                        isEnabled
                          ? "border-violet-400/45 bg-violet-500/10 text-white"
                          : "border-white/10 bg-slate-950/35 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold">{labels[state]}</span>
                        <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${isEnabled ? "bg-violet-500" : "bg-slate-700"}`}>
                          <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${isEnabled ? "translate-x-4" : ""}`} />
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-medium opacity-80">{descriptions[state]}</p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleStartBlock}
                className="w-full py-3 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Bắt đầu block
              </button>
            </div>
          ) : showTransition ? (
            /* Transition Screen Layout when a state/block is finished */
            <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6 animate-in zoom-in-98 duration-200 py-8">
              {currentState === 1 ? (
                <>
                  <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center text-violet-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Hoàn thành phần Học cụm từ!</h3>
                  <p className="text-slate-350 text-sm leading-relaxed">
                    Bạn đã xong toàn bộ phần làm quen cụm từ của Block này. Tiếp theo hãy làm phần trắc nghiệm câu.
                  </p>
                  <button
                    onClick={handleContinueAfterCompletedState}
                    className="w-full py-3 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Sang Trắc nghiệm câu (State 2)
                  </button>
                </>
              ) : currentState === 2 ? (
                <>
                  <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center text-violet-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Hoàn thành phần Trắc nghiệm!</h3>
                  <p className="text-slate-350 text-sm leading-relaxed">
                    Tuyệt vời! Bạn đã xong toàn bộ phần trắc nghiệm của Block này. Giờ hãy chuyển sang phần tự viết câu.
                  </p>
                  <button
                    onClick={handleContinueAfterCompletedState}
                    className="w-full py-3 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Sang Tự viết câu (State 3)
                  </button>
                </>
              ) : (
                /* State 3 Completed: Check wrong ones to redo or proceed */
                blockMistakeAbsoluteIndices.length > 0 ? (
                  <>
                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Kết quả Block {blockIndex + 1}</h3>
                    <p className="text-slate-350 text-sm leading-relaxed">
                      Bạn đã hoàn thành viết câu. Tuy nhiên, có{" "}
                      <strong className="text-rose-400 font-bold">{blockMistakeAbsoluteIndices.length} câu</strong> viết chưa chính xác hoặc chưa chấp nhận. Bạn cần viết lại đúng các câu này để qua Block.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                      <button
                        onClick={handleRedoMistakes}
                        className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors shadow-md cursor-pointer"
                      >
                        Luyện lại câu sai
                      </button>
                      {false && (
                        <button
                          onClick={undefined}
                          className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Quay lại state đã skip
                        </button>
                      )}
                      <button
                        onClick={moveToNextBlockOrFinish}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Bỏ qua &amp; Đi tiếp
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                      <svg className="w-8 h-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">🏆 Hoàn thành Block {blockIndex + 1}!</h3>
                    <p className="text-slate-350 text-sm leading-relaxed">
                      Chúc mừng! Bạn đã vượt qua tất cả thử thách viết câu của Block này mà không còn sai sót nào.
                    </p>
                    <div className="flex w-full flex-col gap-3 pt-2">
                      {false && (
                        <button
                          onClick={undefined}
                          className="w-full py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Quay lại state đã skip
                        </button>
                      )}
                      <button
                        onClick={moveToNextBlockOrFinish}
                        className="w-full py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                      >
                        {blockIndex < numBlocks - 1 ? "Sang Block tiếp theo" : "Xem tổng kết kết quả"}
                      </button>
                    </div>
                  </>
                )
              )}
            </div>
          ) : (
            currentQuestion && (
              <WritingQuestionCard
                key={`${currentQuestion.id}-${currentState}`}
                question={currentQuestion}
                mode={currentState}
                isAnswered={isAnswered}
                selectedOptionIndex={selectedOptionIndex}
                onAnswer={handleAnswer}
                onAnswerTyped={handleAnswerTyped}
                savedTypedAnswer={typedAnswers[currentAbsoluteIndex]}
                onNext={handleNext}
                onPrev={currentIndex > 0 ? handlePrev : undefined}
                showHint={showHint}
                onToggleHint={handleToggleHint}
                restartCount={restartCount}
                isMuted={isMuted}
              />
            )
          )}

          {/* Keyboard shortcut guide */}
          {!showTransition && (
            <div className="hidden md:flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-white/5 w-full text-[11px] font-bold text-slate-500 tracking-wider uppercase shrink-0">
              <span>Phím tắt:</span>
              {currentState !== 3 ? (
                <>
                  <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">
                    1
                  </kbd>
                  <span className="text-slate-600">-</span>
                  <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">
                    4
                  </kbd>
                  <span className="text-slate-400 font-medium normal-case">chọn đáp án</span>
                </>
              ) : (
                <>
                  <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">
                    Enter
                  </kbd>
                  <span className="text-slate-400 font-medium normal-case">nộp bài viết</span>
                </>
              )}
              <span className="mx-1 text-slate-700">•</span>
              <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">
                Space
              </kbd>
              <span className="text-slate-400 font-medium normal-case">câu tiếp</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
