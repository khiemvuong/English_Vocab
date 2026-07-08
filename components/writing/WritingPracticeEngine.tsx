"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { getDeterministicShuffle } from "@/utils/shuffle";
import type { WritingQuestionSet } from "@/lib/types";
import { WritingQuestionCard } from "./WritingQuestionCard";
import { WritingResultSummary } from "./WritingResultSummary";
import { QuizHeader } from "@/components/common/QuizHeader";
import { playSound } from "@/utils/audio";

interface WritingPracticeEngineProps {
  data: WritingQuestionSet;
}

export function WritingPracticeEngine({ data }: WritingPracticeEngineProps) {
  const router = useRouter();
  const { writingProgress, isMuted, toggleMute, initWriting, answerWritingQuestion, toggleWritingHint, goToNextWriting, goToPrevWriting, restartWriting } = useQuizStore();

  const [mounted, setMounted] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Stable session ID state to isolate mistake review session from main practice session
  const [sessionId, setSessionId] = useState("writing-practice-main");

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

  const shuffledQuestions = useMemo(() =>
    getDeterministicShuffle(activeQuestions, restartCount, sessionId),
    [activeQuestions, restartCount, sessionId]
  );

  const currentIndex = session?.currentIndex ?? 0;
  const answers = useMemo(() => session?.answers ?? {}, [session?.answers]);
  const isFinished = session?.isFinished ?? false;
  const score = session?.score ?? 0;
  const viewedHints = useMemo(() => session?.viewedHints ?? {}, [session?.viewedHints]);
  const skillAccuracy = useMemo(() => session?.skillAccuracy ?? {}, [session?.skillAccuracy]);

  const currentQuestion = shuffledQuestions[currentIndex];
  const selectedOptionIndex = answers[currentIndex] ?? null;
  const isAnswered = selectedOptionIndex !== null;
  const showHint = viewedHints[currentIndex] || false;

  useEffect(() => {
    // Only auto-initialize on mount for the main practice session
    if (questionIds.length > 0 && sessionId === "writing-practice-main") {
      initWriting(sessionId, questionIds);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, [sessionId, questionIds, initWriting]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isFinished && mounted) setShowResultModal(true);
  }, [isFinished, mounted]);

  const handleAnswer = useCallback((optionIndex: number, isCorrect: boolean) => {
    if (!currentQuestion) return;
    answerWritingQuestion(sessionId, currentIndex, optionIndex, isCorrect, currentQuestion.skillType);
    if (!isMuted) {
      playSound(isCorrect ? "correct" : "incorrect");
    }
  }, [sessionId, currentIndex, currentQuestion, answerWritingQuestion, isMuted]);

  const handleNext = useCallback(() => goToNextWriting(sessionId), [sessionId, goToNextWriting]);
  const handlePrev = useCallback(() => goToPrevWriting(sessionId), [sessionId, goToPrevWriting]);

  const handleToggleHint = useCallback(() => toggleWritingHint(sessionId, currentIndex), [sessionId, currentIndex, toggleWritingHint]);

  const handleRestart = useCallback(() => {
    if (sessionId === "writing-practice-wrong" && session?.filteredQuestionIds) {
      restartWriting(sessionId, session.filteredQuestionIds);
    } else {
      restartWriting("writing-practice-main", questionIds);
      setSessionId("writing-practice-main");
    }
    setShowResultModal(false);
  }, [sessionId, session, questionIds, restartWriting]);

  const handleRestartWrongOnly = useCallback(() => {
    const wrongIds = Object.keys(answers)
      .filter((idxStr) => {
        const idx = parseInt(idxStr);
        const q = shuffledQuestions[idx];
        return q && !q.answerOptions[answers[idx]]?.isCorrect;
      })
      .map((idxStr) => shuffledQuestions[parseInt(idxStr)].id);

    if (wrongIds.length === 0) return;

    const nextSessionId = "writing-practice-wrong";
    // Prepare and shuffle the list of wrong questions for the review session
    const shuffledWrongQuestions = getDeterministicShuffle(
      wrongIds.map((id) => allQuestions.find((q) => q.id === id)!),
      restartCount + 1,
      nextSessionId
    );

    restartWriting(nextSessionId, shuffledWrongQuestions.map((q) => q.id));
    setSessionId(nextSessionId);
    setShowResultModal(false);
  }, [answers, shuffledQuestions, allQuestions, restartCount, restartWriting]);

  const handleReviewQuestion = useCallback(() => {
    setShowResultModal(false);
  }, []);

  const handleExit = useCallback(() => router.push("/?tab=writing"), [router]);

  // Hotkey mapping
  const displayOptions = useMemo(() => {
    if (!currentQuestion?.answerOptions) return [];
    return getDeterministicShuffle(currentQuestion.answerOptions, restartCount, currentQuestion.id);
  }, [currentQuestion, restartCount]);

  useEffect(() => {
    if (!mounted || isFinished || showResultModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore input elements
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if (!isAnswered) {
        const key = parseInt(e.key);
        if (key >= 1 && key <= displayOptions.length) {
          e.preventDefault();
          const selectedText = displayOptions[key - 1].text;
          const originalIdx = currentQuestion.answerOptions.findIndex(o => o.text === selectedText);
          if (originalIdx !== -1) {
            handleAnswer(originalIdx, currentQuestion.answerOptions[originalIdx].isCorrect);
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
  }, [mounted, isFinished, showResultModal, isAnswered, displayOptions, currentQuestion, handleAnswer, handleNext, handlePrev]);

  if (!mounted) {
    return <div className="min-h-dvh flex items-center justify-center bg-slate-950"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (shuffledQuestions.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Không tìm thấy câu hỏi</h2>
          <p className="text-slate-400">Vui lòng kiểm tra lại file data.json.</p>
          <button onClick={handleExit} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors">Quay lại trang chủ</button>
        </div>
      </div>
    );
  }

  if (showResultModal && isFinished) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-slate-950">
        <WritingResultSummary
          score={score}
          total={shuffledQuestions.length}
          allQuestions={shuffledQuestions}
          answers={answers}
          skillAccuracy={skillAccuracy}
          onRestart={handleRestart}
          onRestartWrongOnly={handleRestartWrongOnly}
          onExit={handleExit}
          onReviewQuestion={handleReviewQuestion}
        />
      </div>
    );
  }

  const progressPercent = shuffledQuestions.length > 0 ? Math.round((currentIndex / shuffledQuestions.length) * 100) : 0;
  const progressText = `${currentIndex + 1} / ${shuffledQuestions.length}`;

  return (
    <div className="min-h-dvh lg:h-dvh w-screen bg-slate-950 text-white relative overflow-y-auto lg:overflow-hidden flex flex-col p-4 md:p-6">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-500/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-500/8 blur-[120px] pointer-events-none" />

      {/* Header Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto shrink-0 mb-4">
        <QuizHeader
          titleText={sessionId === "writing-practice-wrong" ? "Luyện câu sai (TOEIC Writing)" : "TOEIC Writing Q1-5"}
          subtitleText={progressText}
          progressPercent={progressPercent}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      </div>

      {/* Centered Question Card container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center items-center py-2 lg:h-full lg:overflow-hidden min-h-0">
        <div className="w-full max-w-7xl p-5 md:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex-1 flex flex-col justify-between lg:h-full lg:overflow-hidden">
          {currentQuestion && (
            <WritingQuestionCard
              question={currentQuestion}
              isAnswered={isAnswered}
              selectedOptionIndex={selectedOptionIndex}
              onAnswer={handleAnswer}
              onNext={handleNext}
              showHint={showHint}
              onToggleHint={handleToggleHint}
              restartCount={restartCount}
              isMuted={isMuted}
            />
          )}

          {/* Keyboard shortcut guide */}
          <div className="hidden md:flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-white/5 w-full text-[11px] font-bold text-slate-500 tracking-wider uppercase shrink-0">
             <span>Phím tắt:</span>
             <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">1</kbd>
             <span className="text-slate-600">-</span>
             <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">4</kbd>
             <span className="text-slate-400 font-medium normal-case">chọn đáp án</span>
             <span className="mx-1 text-slate-700">•</span>
             <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">←</kbd>
             <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">→</kbd>
             <span className="text-slate-400 font-medium normal-case">chuyển câu</span>
             <span className="mx-1 text-slate-700">•</span>
             <kbd className="bg-slate-800/80 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono text-[10px]">Space</kbd>
             <span className="text-slate-400 font-medium normal-case">câu tiếp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
