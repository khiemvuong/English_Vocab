"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

export type GuidedTourStep = {
  targetId: string;
  title: string;
  description: string;
  actionLabel?: string;
  placement?: "top" | "bottom" | "auto";
  targetClickAction?: "complete" | "next" | "none";
};

type GuidedTourProps = {
  storageKey: string;
  steps: GuidedTourStep[];
  enabled: boolean;
  onComplete?: () => void;
};

type RectLike = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

const VIEWPORT_GAP = 16;
const SPOTLIGHT_PADDING = 8;
const TOUR_CARD_WIDTH = 320;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getTargetRect = (targetId: string): RectLike | null => {
  const target = document.getElementById(targetId);
  if (!target) return null;

  const rect = target.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  if (rect.bottom <= 0 || rect.right <= 0) return null;
  if (rect.top >= window.innerHeight || rect.left >= window.innerWidth) return null;

  return rect;
};

const getCardPosition = (rect: RectLike, placement: GuidedTourStep["placement"] = "auto") => {
  const preferredTop = rect.bottom + 18;
  const fallbackTop = rect.top - 150;
  const shouldUseTop = placement === "top" || (placement === "auto" && preferredTop + 140 > window.innerHeight - VIEWPORT_GAP);
  const top = shouldUseTop ? Math.max(VIEWPORT_GAP, fallbackTop) : preferredTop;
  const left = clamp(rect.left + rect.width / 2 - TOUR_CARD_WIDTH / 2, VIEWPORT_GAP, window.innerWidth - TOUR_CARD_WIDTH - VIEWPORT_GAP);

  return { top, left };
};

console.assert(clamp(12, 0, 10) === 10, "GuidedTour clamp upper bound failed");

export function GuidedTour({ storageKey, steps, enabled, onComplete }: GuidedTourProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(storageKey) === "true";
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<RectLike | null>(null);

  const currentStep = steps[currentStepIndex];
  const isOpen = enabled && !isDismissed && !!currentStep && !!targetRect;

  useEffect(() => {
    if (isDismissed || !enabled || !currentStep) return;

    let frameId = 0;
    let isCancelled = false;

    const syncRect = () => {
      if (isCancelled) return;

      const nextRect = getTargetRect(currentStep.targetId);
      if (nextRect) {
        setTargetRect(nextRect);
        return;
      }

      frameId = window.requestAnimationFrame(syncRect);
    };

    syncRect();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [currentStep, enabled, isDismissed]);

  const completeTour = useCallback(() => {
    window.localStorage.setItem(storageKey, "true");
    setIsDismissed(true);
    setTargetRect(null);
    onComplete?.();
  }, [storageKey, onComplete]);

  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const syncRect = () => setTargetRect(getTargetRect(currentStep.targetId));
    const handlePointerDown = (event: PointerEvent) => {
      const target = document.getElementById(currentStep.targetId);
      if (!target || !target.contains(event.target as Node)) return;

      if (currentStep.targetClickAction === "none") return;
      if (currentStep.targetClickAction === "next" && currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((value) => value + 1);
        setTargetRect(null);
        return;
      }

      completeTour();
    };

    window.addEventListener("resize", syncRect);
    window.addEventListener("scroll", syncRect, true);
    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      window.removeEventListener("resize", syncRect);
      window.removeEventListener("scroll", syncRect, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [currentStep, currentStepIndex, isOpen, steps.length, completeTour]);

  const goToNextStep = () => {
    if (currentStepIndex >= steps.length - 1) {
      completeTour();
      return;
    }

    setCurrentStepIndex((value) => value + 1);
    setTargetRect(null);
  };

  const cardStyle = useMemo(() => {
    if (!targetRect || !currentStep) return undefined;
    return getCardPosition(targetRect, currentStep.placement);
  }, [currentStep, targetRect]);

  if (!isOpen || !targetRect || !cardStyle) return null;

  const spotlightTop = Math.max(0, targetRect.top - SPOTLIGHT_PADDING);
  const spotlightLeft = Math.max(0, targetRect.left - SPOTLIGHT_PADDING);
  const spotlightRight = Math.min(window.innerWidth, targetRect.right + SPOTLIGHT_PADDING);
  const spotlightBottom = Math.min(window.innerHeight, targetRect.bottom + SPOTLIGHT_PADDING);
  const stepNumber = currentStepIndex + 1;

  return (
    <>
      <button aria-label="Đóng hướng dẫn" className="fixed inset-x-0 top-0 z-80 bg-slate-950/72" onClick={completeTour} style={{ height: spotlightTop }} type="button" />
      <button aria-label="Đóng hướng dẫn" className="fixed bottom-0 left-0 z-80 bg-slate-950/72" onClick={completeTour} style={{ top: spotlightBottom, right: 0 }} type="button" />
      <button aria-label="Đóng hướng dẫn" className="fixed left-0 z-80 bg-slate-950/72" onClick={completeTour} style={{ top: spotlightTop, width: spotlightLeft, height: spotlightBottom - spotlightTop }} type="button" />
      <button aria-label="Đóng hướng dẫn" className="fixed right-0 z-80 bg-slate-950/72" onClick={completeTour} style={{ top: spotlightTop, left: spotlightRight, height: spotlightBottom - spotlightTop }} type="button" />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-81 rounded-3xl border border-cyan-300/70 shadow-[0_0_0_1px_rgba(103,232,249,0.55),0_0_36px_rgba(34,211,238,0.35)] transition-all duration-300"
        style={{ top: spotlightTop, left: spotlightLeft, width: spotlightRight - spotlightLeft, height: spotlightBottom - spotlightTop }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-81 rounded-3xl border border-white/15"
        style={{ top: spotlightTop - 10, left: spotlightLeft - 10, width: spotlightRight - spotlightLeft + 20, height: spotlightBottom - spotlightTop + 20 }}
      />

      <section
        aria-label="Hướng dẫn nhanh"
        className="fixed z-82 w-[min(320px,calc(100vw-32px))] rounded-3xl border border-cyan-300/20 bg-slate-950/95 p-4 text-left text-white shadow-[0_24px_80px_rgba(2,6,23,0.65)] backdrop-blur-xl"
        role="dialog"
        style={cardStyle}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">
            Bước {stepNumber}/{steps.length}
          </span>
          <button className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white" onClick={completeTour} type="button">
            Bỏ qua
          </button>
        </div>

        <h2 className="text-base font-black tracking-tight text-white">{currentStep.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">{currentStep.description}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-400">Chạm vào vùng tối hoặc nút đang được highlight để đóng hướng dẫn.</p>
          <button className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200" onClick={goToNextStep} type="button">
            {currentStep.actionLabel ?? (currentStepIndex >= steps.length - 1 ? "Ok" : "Next")}
          </button>
        </div>
      </section>
    </>
  );
}
