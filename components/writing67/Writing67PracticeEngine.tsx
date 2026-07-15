"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Eye, FilePenLine, Flag, Languages, RotateCcw, Timer, Trophy, Wand2 } from "lucide-react";
import { AnswerButtonList } from "@/components/common/AnswerButtonList";
import { QuizHeader } from "@/components/common/QuizHeader";
import { useAudioStore } from "@/store/audioStore";
import type { Writing67Prompt, Writing67Set, Writing67TaskType, Writing67VocabularyItem } from "@/lib/types";
import {
  getWriting67DraftStorageKey,
  getWriting67ProgressStorageKey,
  type Writing67SavedProgress,
} from "@/lib/writing67Progress";

interface Writing67PracticeEngineProps {
  data: Writing67Set;
}

interface ChoiceOption {
  id: string;
  text: string;
  detail?: string;
}

const STEPS = [
  { id: 0, label: "Vocab recall", icon: Languages },
  { id: 1, label: "Email scan", icon: Eye },
  { id: 2, label: "Task map", icon: ClipboardList },
  { id: 3, label: "Patterns", icon: Wand2 },
  { id: 4, label: "Blanks", icon: Check },
  { id: 5, label: "Write", icon: FilePenLine },
  { id: 6, label: "Review", icon: Check },
] as const;

const TASK_LABELS: Record<Writing67TaskType, string> = {
  information: "Thông tin",
  suggestion: "Đề xuất",
  reason: "Lý do",
  question: "Câu hỏi",
  instruction: "Hướng dẫn",
  complaint: "Phàn nàn",
  request: "Yêu cầu",
};

const TASK_STYLES: Record<Writing67TaskType, string> = {
  information: "border-cyan-300/35 bg-cyan-400/10 text-cyan-100",
  suggestion: "border-emerald-300/35 bg-emerald-400/10 text-emerald-100",
  reason: "border-amber-300/35 bg-amber-400/10 text-amber-100",
  question: "border-violet-300/35 bg-violet-400/10 text-violet-100",
  instruction: "border-sky-300/35 bg-sky-400/10 text-sky-100",
  complaint: "border-rose-300/35 bg-rose-400/10 text-rose-100",
  request: "border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100",
};

const VOCAB_DECOYS = [
  "đưa ra một câu hỏi lịch sự",
  "nêu lý do cho một quyết định",
  "yêu cầu thêm thông tin",
  "đưa ra hướng dẫn cần làm",
  "mô tả một vấn đề của khách hàng",
  "đề xuất một cách cải thiện",
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesAnswer(value: string, answer: string) {
  const normalizedValue = normalizeText(value);
  const normalizedAnswer = normalizeText(answer);
  if (!normalizedValue || !normalizedAnswer) return false;
  return normalizedValue.includes(normalizedAnswer);
}

function stepKey(promptId: string, step: number) {
  return `${promptId}:${step}`;
}

function buildOutlineDraft(prompt: Writing67Prompt) {
  return [
    prompt.guidedOutline.greeting,
    prompt.guidedOutline.opening,
    ...prompt.guidedOutline.bodySlots.map((slot) => `${slot} `),
    prompt.guidedOutline.closing,
  ].join("\n");
}

function stripStudyLabels(text: string) {
  return text.replace(/^(Information|Suggestion\s*\d*|Question|Instruction|Request|Reason|Complaint)\s*:\s*/gim, "");
}

function makeChoice(id: string, text: string, detail?: string): ChoiceOption {
  return { id, text, detail };
}

function buildVocabOptions(item: Writing67VocabularyItem, promptId: string, index: number) {
  const decoys = VOCAB_DECOYS
    .filter((meaning) => meaning !== item.meaningVi)
    .slice(index % 2, index % 2 + 3)
    .map((meaning, decoyIndex) => makeChoice(`decoy-${promptId}-${index}-${decoyIndex}`, meaning));

  return [
    makeChoice(item.meaningVi, item.meaningVi, item.example),
    ...decoys,
  ];
}

function buildPatternOptions(prompt: Writing67Prompt) {
  const correctPatterns = prompt.tasks.map((task, index) => {
    const pattern = prompt.patterns[index] || prompt.patterns[0];
    return makeChoice(pattern, pattern, `${task.label}: ${task.requirement}`);
  });

  const distractors = prompt.patterns
    .filter((pattern) => !correctPatterns.some((option) => option.id === pattern))
    .map((pattern) => makeChoice(pattern, pattern, "Mẫu câu hữu ích, nhưng không phải ưu tiên cho task đang chọn."));

  return [...correctPatterns, ...distractors].slice(0, Math.max(4, correctPatterns.length));
}

function getExpectedTaskTypes(prompt: Writing67Prompt) {
  return Array.from(new Set(prompt.tasks.map((task) => task.type)));
}

function getRequiredPatterns(prompt: Writing67Prompt) {
  return prompt.tasks
    .map((_, index) => prompt.patterns[index] || prompt.patterns[0])
    .filter(Boolean);
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isStepReady({
  prompt,
  step,
  selectedVocabAnswers,
  contextAnswers,
  selectedTaskTypes,
  selectedPatternIds,
  blankAnswers,
  draft,
}: {
  prompt: Writing67Prompt;
  step: number;
  selectedVocabAnswers: Record<string, string>;
  contextAnswers: Record<string, string>;
  selectedTaskTypes: Writing67TaskType[];
  selectedPatternIds: string[];
  blankAnswers: Record<string, string>;
  draft: string;
}) {
  if (step === 0) {
    return prompt.vocabulary.every((_, index) => Boolean(selectedVocabAnswers[`${prompt.id}-vocab-${index}`]));
  }

  if (step === 1) {
    return contextAnswers[prompt.id] === "role";
  }

  if (step === 2) {
    const expectedTypes = getExpectedTaskTypes(prompt);
    return expectedTypes.every((type) => selectedTaskTypes.includes(type)) && selectedTaskTypes.every((type) => expectedTypes.includes(type));
  }

  if (step === 3) {
    const requiredPatterns = getRequiredPatterns(prompt);
    return requiredPatterns.every((pattern) => selectedPatternIds.includes(pattern));
  }

  if (step === 4) {
    return prompt.sampleBlanks.every((_, index) => Boolean(blankAnswers[`${prompt.id}-${index}`]?.trim()));
  }

  if (step === 5) {
    return countWords(draft) >= 20;
  }

  return true;
}

function getStepMissingText({
  prompt,
  step,
  selectedVocabAnswers,
  contextAnswers,
  selectedTaskTypes,
  selectedPatternIds,
  blankAnswers,
  draft,
}: {
  prompt: Writing67Prompt;
  step: number;
  selectedVocabAnswers: Record<string, string>;
  contextAnswers: Record<string, string>;
  selectedTaskTypes: Writing67TaskType[];
  selectedPatternIds: string[];
  blankAnswers: Record<string, string>;
  draft: string;
}) {
  if (step === 0) {
    const missing = prompt.vocabulary.filter((_, index) => !selectedVocabAnswers[`${prompt.id}-vocab-${index}`]).length;
    return missing ? `Còn ${missing} cụm từ chưa chọn.` : "Đã chọn đủ từ vựng.";
  }

  if (step === 1) {
    return contextAnswers[prompt.id] === "role" ? "Đã xác định đúng vai viết." : "Cần chọn đúng vai người viết email trả lời.";
  }

  if (step === 2) {
    const expectedTypes = getExpectedTaskTypes(prompt);
    const missing = expectedTypes.filter((type) => !selectedTaskTypes.includes(type)).length;
    const extra = selectedTaskTypes.filter((type) => !expectedTypes.includes(type)).length;
    if (missing || extra) return `Còn thiếu ${missing} nhóm task, chọn dư ${extra} nhóm.`;
    return "Đã map đúng nhóm task.";
  }

  if (step === 3) {
    const requiredPatterns = getRequiredPatterns(prompt);
    const missing = requiredPatterns.filter((pattern) => !selectedPatternIds.includes(pattern)).length;
    return missing ? `Còn ${missing} mẫu câu ưu tiên chưa chọn.` : "Đã chọn đủ mẫu câu ưu tiên.";
  }

  if (step === 4) {
    const missing = prompt.sampleBlanks.filter((_, index) => !blankAnswers[`${prompt.id}-${index}`]?.trim()).length;
    return missing ? `Còn ${missing} blank chưa điền.` : "Đã điền đủ blanks.";
  }

  if (step === 5) {
    const words = countWords(draft);
    return words >= 20 ? `Đã có ${words} từ.` : `Bài viết mới có ${words}/20 từ tối thiểu để review.`;
  }

  return "Sẵn sàng chuyển tiếp.";
}

export function Writing67PracticeEngine({ data }: Writing67PracticeEngineProps) {
  const router = useRouter();
  const { isMuted, toggleMute } = useAudioStore();
  const savedProgress = useMemo<Partial<Writing67SavedProgress>>(() => {
    if (typeof window === "undefined") return {};

    try {
      return JSON.parse(window.localStorage.getItem(getWriting67ProgressStorageKey(data.setId)) || "{}") as Partial<Writing67SavedProgress>;
    } catch {
      return {};
    }
  }, [data.setId]);

  const [promptIndex, setPromptIndex] = useState(() => {
    const savedIndex = savedProgress.promptIndex ?? 0;
    return Math.min(Math.max(savedIndex, 0), data.prompts.length - 1);
  });
  const [step, setStep] = useState(() => {
    const savedStep = savedProgress.step ?? 0;
    return Math.min(Math.max(savedStep, 0), STEPS.length - 1);
  });
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedVocabAnswers, setSelectedVocabAnswers] = useState<Record<string, string>>(() => savedProgress.selectedVocabAnswers ?? {});
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>(() => savedProgress.contextAnswers ?? {});
  const [selectedTaskTypesByPrompt, setSelectedTaskTypesByPrompt] = useState<Record<string, Writing67TaskType[]>>(() => savedProgress.selectedTaskTypesByPrompt ?? {});
  const [selectedPatternIdsByPrompt, setSelectedPatternIdsByPrompt] = useState<Record<string, string[]>>(() => savedProgress.selectedPatternIdsByPrompt ?? {});
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>(() => savedProgress.blankAnswers ?? {});
  const [showBlankResults, setShowBlankResults] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, true>>(() => savedProgress.completedSteps ?? {});
  const [completedPrompts, setCompletedPrompts] = useState<Record<string, true>>(() => savedProgress.completedPrompts ?? {});
  const [checkpointPromptId, setCheckpointPromptId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(() => savedProgress.isFinished ?? false);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    if (savedProgress.drafts) return savedProgress.drafts;
    if (typeof window === "undefined") return {};

    try {
      return JSON.parse(window.localStorage.getItem(getWriting67DraftStorageKey(data.setId)) || "{}") as Record<string, string>;
    } catch {
      return {};
    }
  });

  const prompt = data.prompts[promptIndex];
  const draft = drafts[prompt.id] ?? "";
  const selectedTaskTypes = selectedTaskTypesByPrompt[prompt.id] ?? [];
  const selectedPatternIds = selectedPatternIdsByPrompt[prompt.id] ?? [];
  const totalUnits = data.prompts.length * STEPS.length;
  const completedUnitCount = data.prompts.reduce((total, item) => {
    return total + STEPS.filter((stepItem) => {
      return Boolean(completedSteps[stepKey(item.id, stepItem.id)]) && isStepReady({
        prompt: item,
        step: stepItem.id,
        selectedVocabAnswers,
        contextAnswers,
        selectedTaskTypes: selectedTaskTypesByPrompt[item.id] ?? [],
        selectedPatternIds: selectedPatternIdsByPrompt[item.id] ?? [],
        blankAnswers,
        draft: drafts[item.id] ?? "",
      });
    }).length;
  }, 0);
  const progressPercent = isFinished ? 100 : Math.round((completedUnitCount / totalUnits) * 100);
  const currentStepReady = isStepReady({
    prompt,
    step,
    selectedVocabAnswers,
    contextAnswers,
    selectedTaskTypes,
    selectedPatternIds,
    blankAnswers,
    draft,
  });
  const missingText = getStepMissingText({
    prompt,
    step,
    selectedVocabAnswers,
    contextAnswers,
    selectedTaskTypes,
    selectedPatternIds,
    blankAnswers,
    draft,
  });
  const nextLabel = step < STEPS.length - 1 ? `Tiếp: ${STEPS[step + 1].label}` : promptIndex < data.prompts.length - 1 ? "Xong câu này" : "Hoàn tất bộ";
  const selectedContextAnswer = contextAnswers[prompt.id] || null;

  const contextOptions = useMemo(() => {
    return [
      makeChoice("role", prompt.roleVi, "Đúng vì directions nói rõ bạn phải viết email trả lời trong vai này."),
      makeChoice("recipient", `Bạn là người nhận email gốc: ${prompt.email.to}.`, "Đây chỉ là trường To trong email gốc. Đôi khi trùng vai, nhưng vẫn phải đọc directions để xác định vai viết."),
      makeChoice("sender", `Bạn là người gửi email gốc: ${prompt.email.from}.`, "Đây là người gửi email ban đầu, không phải người đang viết email trả lời."),
      makeChoice("topic", `Bạn chỉ cần tóm tắt chủ đề: ${prompt.email.subject}.`, "Sai hướng: Q6-7 yêu cầu trả lời đúng vai và đủ task, không chỉ tóm tắt subject."),
    ];
  }, [prompt]);

  useEffect(() => {
    const payload: Writing67SavedProgress = {
      promptIndex,
      step,
      selectedVocabAnswers,
      contextAnswers,
      selectedTaskTypesByPrompt,
      selectedPatternIdsByPrompt,
      blankAnswers,
      drafts,
      completedSteps,
      completedPrompts,
      isFinished,
    };

    window.localStorage.setItem(getWriting67ProgressStorageKey(data.setId), JSON.stringify(payload));
  }, [
    blankAnswers,
    completedPrompts,
    completedSteps,
    contextAnswers,
    data.setId,
    drafts,
    isFinished,
    promptIndex,
    selectedPatternIdsByPrompt,
    selectedTaskTypesByPrompt,
    selectedVocabAnswers,
    step,
  ]);

  const saveDraft = (value: string) => {
    const nextDrafts = { ...drafts, [prompt.id]: stripStudyLabels(value) };
    setDrafts(nextDrafts);
  };

  const resetPrompt = () => {
    setDrafts((current) => {
      const next = { ...current };
      delete next[prompt.id];
      return next;
    });
    setSelectedTaskTypesByPrompt((current) => {
      const next = { ...current };
      delete next[prompt.id];
      return next;
    });
    setSelectedPatternIdsByPrompt((current) => {
      const next = { ...current };
      delete next[prompt.id];
      return next;
    });
    setContextAnswers((current) => {
      const next = { ...current };
      delete next[prompt.id];
      return next;
    });
    setSelectedVocabAnswers((current) => {
      const next = { ...current };
      prompt.vocabulary.forEach((_, index) => delete next[`${prompt.id}-vocab-${index}`]);
      return next;
    });
    setShowBlankResults(false);
    setBlankAnswers((current) => {
      const next = { ...current };
      prompt.sampleBlanks.forEach((_, index) => delete next[`${prompt.id}-${index}`]);
      return next;
    });
    setCompletedSteps((current) => {
      const next = { ...current };
      STEPS.forEach((item) => delete next[stepKey(prompt.id, item.id)]);
      return next;
    });
    setCompletedPrompts((current) => {
      const next = { ...current };
      delete next[prompt.id];
      return next;
    });
    setCheckpointPromptId(null);
    setIsFinished(false);
    setStep(0);
  };

  const restartAll = () => {
    setPromptIndex(0);
    setStep(0);
    setSelectedVocabAnswers({});
    setContextAnswers({});
    setSelectedTaskTypesByPrompt({});
    setSelectedPatternIdsByPrompt({});
    setBlankAnswers({});
    setShowBlankResults(false);
    setCompletedSteps({});
    setCompletedPrompts({});
    setCheckpointPromptId(null);
    setIsFinished(false);
    setDrafts({});
    window.localStorage.removeItem(getWriting67DraftStorageKey(data.setId));
    window.localStorage.removeItem(getWriting67ProgressStorageKey(data.setId));
  };

  const goNext = () => {
    if (!currentStepReady) return;

    setShowBlankResults(false);
    setCompletedSteps((current) => ({ ...current, [stepKey(prompt.id, step)]: true }));

    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    setCompletedPrompts((current) => ({ ...current, [prompt.id]: true }));

    if (promptIndex < data.prompts.length - 1) {
      setCheckpointPromptId(prompt.id);
      return;
    }

    setIsFinished(true);
    setStep(STEPS.length - 1);
  };

  const continueToNextPrompt = () => {
    if (promptIndex >= data.prompts.length - 1) return;
    setPromptIndex(promptIndex + 1);
    setStep(0);
    setShowBlankResults(false);
    setCheckpointPromptId(null);
  };

  const goBack = () => {
    setShowBlankResults(false);
    if (checkpointPromptId) {
      setCheckpointPromptId(null);
      return;
    }
    if (step > 0) {
      setStep(step - 1);
      return;
    }

    if (promptIndex > 0) {
      setPromptIndex(promptIndex - 1);
      setStep(STEPS.length - 1);
    }
  };

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-3 py-3 md:px-5">
        <QuizHeader
          titleText="TOEIC Writing Q6-7"
          subtitleText={`Bài ${promptIndex + 1}/${data.prompts.length} - ${STEPS[step].label}`}
          progressPercent={progressPercent}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onRestart={restartAll}
          onExit={() => router.push("/?tab=writing")}
        />

        <StepBar
          prompt={prompt}
          currentStep={step}
          completedSteps={completedSteps}
          selectedVocabAnswers={selectedVocabAnswers}
          contextAnswers={contextAnswers}
          selectedTaskTypes={selectedTaskTypes}
          selectedPatternIds={selectedPatternIds}
          blankAnswers={blankAnswers}
          draft={draft}
          onSelect={setStep}
        />

        <div className="mt-3 grid flex-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section className="min-w-0">
            <ExamEmailCard
              prompt={prompt}
              showTranslation={showTranslation}
              onToggleTranslation={() => setShowTranslation((current) => !current)}
            />
          </section>

          <ActivityPanel
            title={STEPS[step].label}
            topic={prompt.topic}
            level={prompt.level}
            onReset={resetPrompt}
          >
            {isFinished && (
              <SetFinishedStep
                totalPrompts={data.prompts.length}
                onRestart={restartAll}
                onExit={() => router.push("/?tab=writing")}
              />
            )}
            {!isFinished && checkpointPromptId && (
              <PromptCheckpoint
                promptNumber={promptIndex + 1}
                totalPrompts={data.prompts.length}
                promptTitle={prompt.title}
                onContinue={continueToNextPrompt}
                onReview={() => setCheckpointPromptId(null)}
              />
            )}
            {!isFinished && !checkpointPromptId && step === 0 && (
              <VocabRecallStep
                prompt={prompt}
                selectedAnswers={selectedVocabAnswers}
                onSelect={(key, value) => setSelectedVocabAnswers((current) => ({ ...current, [key]: value }))}
              />
            )}
            {!isFinished && !checkpointPromptId && step === 1 && (
              <EmailScanStep
                prompt={prompt}
                options={contextOptions}
                selectedOptionId={selectedContextAnswer}
                onSelect={(value) => setContextAnswers((current) => ({ ...current, [prompt.id]: value }))}
              />
            )}
            {!isFinished && !checkpointPromptId && step === 2 && (
              <TaskMapStep
                prompt={prompt}
                selectedTaskTypes={selectedTaskTypes}
                onChange={(value) => setSelectedTaskTypesByPrompt((current) => ({ ...current, [prompt.id]: value }))}
              />
            )}
            {!isFinished && !checkpointPromptId && step === 3 && (
              <PatternDecisionStep
                prompt={prompt}
                selectedPatternIds={selectedPatternIds}
                onToggle={(patternId) => {
                  setSelectedPatternIdsByPrompt((current) => {
                    const currentPromptPatterns = current[prompt.id] ?? [];
                    return {
                      ...current,
                      [prompt.id]: currentPromptPatterns.includes(patternId)
                        ? currentPromptPatterns.filter((item) => item !== patternId)
                        : [...currentPromptPatterns, patternId],
                    };
                  });
                }}
              />
            )}
            {!isFinished && !checkpointPromptId && step === 4 && (
              <BlankStep
                prompt={prompt}
                answers={blankAnswers}
                setAnswers={setBlankAnswers}
                showResults={showBlankResults}
                setShowResults={setShowBlankResults}
              />
            )}
            {!isFinished && !checkpointPromptId && step === 5 && (
              <WriteStep
                prompt={prompt}
                draft={draft}
                saveDraft={saveDraft}
                insertOutline={() => saveDraft(buildOutlineDraft(prompt))}
              />
            )}
            {!isFinished && !checkpointPromptId && step === 6 && (
              <ReviewStep
                prompt={prompt}
                draft={draft}
              />
            )}

            {!isFinished && !checkpointPromptId && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
              <button
                onClick={goBack}
                disabled={promptIndex === 0 && step === 0}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Trước
              </button>
              <div className={`flex flex-1 items-center justify-center gap-2 text-center text-xs font-semibold ${currentStepReady ? "text-emerald-200" : "text-amber-200"}`}>
                {currentStepReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span>{missingText}</span>
              </div>
              <button
                onClick={goNext}
                disabled={!currentStepReady}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {nextLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            )}
          </ActivityPanel>
        </div>
      </div>
    </main>
  );
}

function StepBar({
  prompt,
  currentStep,
  completedSteps,
  selectedVocabAnswers,
  contextAnswers,
  selectedTaskTypes,
  selectedPatternIds,
  blankAnswers,
  draft,
  onSelect,
}: {
  prompt: Writing67Prompt;
  currentStep: number;
  completedSteps: Record<string, true>;
  selectedVocabAnswers: Record<string, string>;
  contextAnswers: Record<string, string>;
  selectedTaskTypes: Writing67TaskType[];
  selectedPatternIds: string[];
  blankAnswers: Record<string, string>;
  draft: string;
  onSelect: (step: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-white/10 p-1.5 md:grid-cols-7">
      {STEPS.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === currentStep;
        const isDone = Boolean(completedSteps[stepKey(prompt.id, item.id)]);
        const isReady = isStepReady({
          prompt,
          step: item.id,
          selectedVocabAnswers,
          contextAnswers,
          selectedTaskTypes,
          selectedPatternIds,
          blankAnswers,
          draft,
        });
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition ${
              isActive
                ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50"
                : isDone
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                  : isReady
                    ? "border-blue-300/20 bg-blue-300/8 text-blue-100 hover:bg-blue-300/12"
                  : "border-white/8 bg-slate-950/30 text-slate-400 hover:bg-white/8"
            }`}
            title={getStepMissingText({
              prompt,
              step: item.id,
              selectedVocabAnswers,
              contextAnswers,
              selectedTaskTypes,
              selectedPatternIds,
              blankAnswers,
              draft,
            })}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{item.label}</span>
            {isDone && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            {!isDone && !isReady && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-200" />}
          </button>
        );
      })}
    </div>
  );
}

function PromptCheckpoint({
  promptNumber,
  totalPrompts,
  promptTitle,
  onContinue,
  onReview,
}: {
  promptNumber: number;
  totalPrompts: number;
  promptTitle: string;
  onContinue: () => void;
  onReview: () => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-100">
          <Flag className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200/80">Bạn đã xong câu này</p>
          <h3 className="mt-1 text-xl font-black text-white">
            Câu {promptNumber}/{totalPrompts}: {promptTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-emerald-50/80">
            7 state của câu này đã được ghi nhận. Đây là khoảng dừng để bạn biết mình sắp chuyển sang email tiếp theo.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-7">
        {STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="rounded-lg border border-emerald-300/20 bg-slate-950/25 p-2 text-center">
              <Icon className="mx-auto h-4 w-4 text-emerald-200" />
              <p className="mt-1 text-[10px] font-bold text-emerald-50">{item.label}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={onReview}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          Xem lại câu này
        </button>
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
        >
          Sang câu tiếp theo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SetFinishedStep({
  totalPrompts,
  onRestart,
  onExit,
}: {
  totalPrompts: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-300/20 text-cyan-100">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80">Hoàn thành bộ câu hỏi</p>
          <h3 className="mt-1 text-2xl font-black text-white">Bạn đã làm xong {totalPrompts} email prompts.</h3>
          <p className="mt-2 text-sm leading-6 text-cyan-50/80">
            Tiến trình, đáp án và draft đã được lưu trong trình duyệt. Bấm làm lại nếu muốn xóa toàn bộ và bắt đầu từ đầu.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={onExit}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          Về trang Writing
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
        >
          <RotateCcw className="h-4 w-4" />
          Làm lại cả bộ
        </button>
      </div>
    </div>
  );
}

function ExamEmailCard({
  prompt,
  showTranslation,
  onToggleTranslation,
}: {
  prompt: Writing67Prompt;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2 shadow-2xl">
      <div className="rounded-none border-2 border-blue-600 bg-white font-serif text-[16px] leading-[1.3] text-black md:text-[17px]">
        <div className="space-y-0 px-2.5 py-2">
          <p>
            <strong>From:</strong> <span className="break-all">{prompt.email.from}</span>
          </p>
          <p>
            <strong>To:</strong> <span className="break-all">{prompt.email.to}</span>
          </p>
          <p>
            <strong>Subject:</strong> {prompt.email.subject}
          </p>
          <p>
            <strong>Sent:</strong> {prompt.email.sent}
          </p>
          <div className="pt-1">
            {prompt.email.body.map((line, index) => (
              <div key={`${line}-${index}`} className="mb-0.5">
                <p>{line}</p>
                {showTranslation && (
                  <p className="mt-0.5 rounded-sm bg-blue-50 px-2 py-1 font-sans text-[13px] leading-relaxed text-slate-700">
                    {prompt.email.translationVi[index]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-blue-600 px-2.5 py-1">
          <span className="font-bold text-blue-700">Directions:</span>{" "}
          <span>{prompt.directions}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{prompt.topic}</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{prompt.roleVi}</p>
        </div>
        <button
          onClick={onToggleTranslation}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"
        >
          {showTranslation ? "Ẩn dịch nghĩa" : "Hiện dịch nghĩa"}
        </button>
      </div>
    </div>
  );
}

function ActivityPanel({
  title,
  topic,
  level,
  onReset,
  children,
}: {
  title: string;
  topic: string;
  level: string;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-xl md:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200/70">{topic}</p>
          <h2 className="mt-0.5 text-xl font-black tracking-tight text-white md:text-2xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase text-slate-300">
            {level}
          </span>
          <button
            onClick={onReset}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
            title="Làm lại bài này"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

function VocabRecallStep({
  prompt,
  selectedAnswers,
  onSelect,
}: {
  prompt: Writing67Prompt;
  selectedAnswers: Record<string, string>;
  onSelect: (key: string, value: string) => void;
}) {
  const correctCount = prompt.vocabulary.filter((item, index) => selectedAnswers[`${prompt.id}-vocab-${index}`] === item.meaningVi).length;

  return (
    <div>
      <StepTitle
        title="Nhớ nghĩa cụm trước khi đọc sâu"
      />
      <div className="mt-4 space-y-5">
        {prompt.vocabulary.map((item, index) => {
          const key = `${prompt.id}-vocab-${index}`;
          const options = buildVocabOptions(item, prompt.id, index);
          return (
            <div key={item.phrase} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-black text-white">{item.phrase}</h3>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${TASK_STYLES[item.category === "general" ? "information" : item.category]}`}>
                  {item.category === "general" ? "general" : TASK_LABELS[item.category]}
                </span>
              </div>
              <AnswerButtonList<ChoiceOption>
                options={options}
                selectedOptionId={selectedAnswers[key] || null}
                correctOptionId={item.meaningVi}
                isAnswered={selectedAnswers[key] !== undefined}
                onSelect={(optionId) => onSelect(key, optionId)}
                stableKey={key}
                size="sm"
                getOptionId={(option) => option.id}
                renderContent={(option, _isSelected, isCorrect, showResult) => (
                  <div>
                    <p className="text-sm font-bold text-white">{option.text}</p>
                    {showResult && isCorrect && option.detail && (
                      <p className="mt-1 text-xs leading-relaxed text-emerald-200">{option.detail}</p>
                    )}
                  </div>
                )}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-300">
        Đã nhớ đúng {correctCount}/{prompt.vocabulary.length} cụm.
      </p>
    </div>
  );
}

function EmailScanStep({
  prompt,
  options,
  selectedOptionId,
  onSelect,
}: {
  prompt: Writing67Prompt;
  options: ChoiceOption[];
  selectedOptionId: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <StepTitle
        title="Đọc đề như lúc thi thật"
      />
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
        <p className="mb-3 text-sm font-bold text-white">Trong email trả lời, bạn là ai?</p>
        <AnswerButtonList<ChoiceOption>
          options={options}
          selectedOptionId={selectedOptionId}
          correctOptionId="role"
          isAnswered={selectedOptionId !== null}
          onSelect={onSelect}
          stableKey={`${prompt.id}-email-scan`}
          size="sm"
          getOptionId={(option) => option.id}
          renderContent={(option, _isSelected, _isCorrect, showResult) => (
            <div>
              <p className="wrap-break-word text-sm font-bold text-white">{option.text}</p>
              {showResult && option.detail && (
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{option.detail}</p>
              )}
            </div>
          )}
        />
        {selectedOptionId && selectedOptionId !== "role" && (
          <button
            onClick={() => onSelect("")}
            className="mt-3 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-300/15"
          >
            Chọn lại vai viết
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MiniFact label="Người gửi" value={prompt.email.from} />
        <MiniFact label="Người nhận" value={prompt.email.to} />
        <MiniFact label="Chủ đề" value={prompt.email.subject} />
      </div>
    </div>
  );
}

function TaskMapStep({
  prompt,
  selectedTaskTypes,
  onChange,
}: {
  prompt: Writing67Prompt;
  selectedTaskTypes: Writing67TaskType[];
  onChange: (value: Writing67TaskType[]) => void;
}) {
  const taskTypes = Object.keys(TASK_LABELS) as Writing67TaskType[];
  const expectedTypes = Array.from(new Set(prompt.tasks.map((task) => task.type)));
  const correctCount = selectedTaskTypes.filter((type) => expectedTypes.includes(type)).length;

  return (
    <div>
      <StepTitle
        title="Khoanh vùng yêu cầu bắt buộc"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {taskTypes.map((type) => {
          const selected = selectedTaskTypes.includes(type);
          const expected = expectedTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => onChange(selected ? selectedTaskTypes.filter((item) => item !== type) : [...selectedTaskTypes, type])}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition ${
                selected && expected
                  ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/20"
                  : selected && !expected
                    ? "border-rose-400/60 bg-rose-400/15 text-rose-100 ring-1 ring-rose-300/20"
                    : expected
                      ? "border-cyan-300/25 bg-cyan-300/5 text-cyan-100 hover:bg-cyan-300/10"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {selected && expected ? "✓" : selected && !expected ? "×" : expected ? "?" : null}
              {TASK_LABELS[type]}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 p-3">
          <p className="text-xs font-bold uppercase text-emerald-200/80">Đúng</p>
          <p className="mt-1 text-lg font-black text-emerald-100">{correctCount}/{expectedTypes.length}</p>
        </div>
        <div className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-3">
          <p className="text-xs font-bold uppercase text-rose-200/80">Chọn dư</p>
          <p className="mt-1 text-lg font-black text-rose-100">{selectedTaskTypes.filter((type) => !expectedTypes.includes(type)).length}</p>
        </div>
        <div className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 p-3">
          <p className="text-xs font-bold uppercase text-cyan-200/80">Còn thiếu</p>
          <p className="mt-1 text-lg font-black text-cyan-100">{expectedTypes.filter((type) => !selectedTaskTypes.includes(type)).length}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {prompt.tasks.map((task) => (
          <div
            key={`${task.label}-${task.requirement}`}
            className={`rounded-xl border p-4 ${
              selectedTaskTypes.includes(task.type)
                ? "border-emerald-300/45 bg-emerald-400/10 text-emerald-100"
                : "border-cyan-300/25 bg-cyan-400/8 text-cyan-100"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase opacity-70">{task.label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedTaskTypes.includes(task.type) ? "bg-emerald-300/15 text-emerald-100" : "bg-cyan-300/15 text-cyan-100"}`}>
                {selectedTaskTypes.includes(task.type) ? "Đúng" : "Cần chọn"}
              </span>
            </div>
            <h3 className="mt-1 font-bold">{task.requirement}</h3>
            <p className="mt-2 rounded-md bg-black/20 p-2 text-sm">{task.example}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatternDecisionStep({
  prompt,
  selectedPatternIds,
  onToggle,
}: {
  prompt: Writing67Prompt;
  selectedPatternIds: string[];
  onToggle: (patternId: string) => void;
}) {
  const options = buildPatternOptions(prompt);
  const requiredPatterns = prompt.tasks
    .map((_, index) => prompt.patterns[index] || prompt.patterns[0])
    .filter(Boolean);
  const correctCount = selectedPatternIds.filter((pattern) => requiredPatterns.includes(pattern)).length;

  return (
    <div>
      <StepTitle
        title="Chọn mẫu câu nên dùng"
      />
      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const selected = selectedPatternIds.includes(option.id);
          const expected = requiredPatterns.includes(option.id);
          const showResult = selectedPatternIds.length > 0;
          return (
            <button
              key={option.id}
              onClick={() => onToggle(option.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selected
                  ? expected
                    ? "border-emerald-400/50 bg-emerald-400/10"
                    : "border-amber-400/50 bg-amber-400/10"
                  : "border-white/10 bg-slate-950/35 hover:bg-white/8"
              }`}
            >
              <p className="text-sm font-black text-white">{option.text}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{option.detail}</p>
              {showResult && selected && (
                <p className={`mt-2 text-xs font-bold ${expected ? "text-emerald-300" : "text-amber-300"}`}>
                  {expected ? "Nên dùng cho bài này" : "Có thể hữu ích, nhưng chưa phải mẫu ưu tiên"}
                </p>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-300">
        Đã chọn {correctCount}/{requiredPatterns.length} mẫu ưu tiên.
      </p>
    </div>
  );
}

function BlankStep({
  prompt,
  answers,
  setAnswers,
  showResults,
  setShowResults,
}: {
  prompt: Writing67Prompt;
  answers: Record<string, string>;
  setAnswers: (answers: Record<string, string>) => void;
  showResults: boolean;
  setShowResults: (show: boolean) => void;
}) {
  return (
    <div>
      <StepTitle
        title="Điền vào sample answer"
      />
      <div className="mt-4 space-y-4">
        {prompt.sampleBlanks.map((blank, index) => {
          const key = `${prompt.id}-${index}`;
          const value = answers[key] || "";
          const isCorrect = includesAnswer(value, blank.answer);
          return (
            <div key={blank.sentence} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-bold text-slate-100">{blank.sentence}</p>
              <p className="mt-1 text-xs text-cyan-100/70">{blank.meaningVi}</p>
              <input
                value={value}
                onChange={(event) => setAnswers({ ...answers, [key]: event.target.value })}
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition focus:border-cyan-300/50"
                placeholder="Nhập cụm từ..."
              />
              {showResults && (
                <div className={`mt-3 rounded-md p-2 text-sm ${isCorrect ? "bg-emerald-400/10 text-emerald-100" : "bg-rose-400/10 text-rose-100"}`}>
                  {isCorrect ? "Đúng" : `Gợi ý đáp án: ${blank.answer}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => setShowResults(true)}
        className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-100"
      >
        Kiểm tra blanks
      </button>
    </div>
  );
}

function WriteStep({
  prompt,
  draft,
  saveDraft,
  insertOutline,
}: {
  prompt: Writing67Prompt;
  draft: string;
  saveDraft: (value: string) => void;
  insertOutline: () => void;
}) {
  return (
    <div>
      <StepTitle
        title="Viết email đầy đủ từ số 0"
      />
      <div className="mt-3 grid gap-3 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-2">
          {prompt.tasks.map((task) => (
            <div key={task.requirement} className={`rounded-xl border p-3 ${TASK_STYLES[task.type]}`}>
              <p className="text-xs font-bold uppercase opacity-70">{task.label}</p>
              <p className="mt-1 text-sm font-semibold">{task.requirement}</p>
              <p className="mt-2 rounded-md bg-black/20 p-2 text-xs">{task.example}</p>
            </div>
          ))}
          <button
            onClick={insertOutline}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-bold text-slate-200 transition hover:bg-white/10"
          >
            Chèn outline gợi ý vào khung viết
          </button>
        </div>
        <div>
          <textarea
            value={draft}
            onChange={(event) => saveDraft(event.target.value)}
            className="min-h-[430px] w-full resize-y rounded-lg border border-white/10 bg-white px-4 py-3 font-serif text-lg leading-8 text-black outline-none transition focus:border-blue-500"
            spellCheck={true}
            lang="en"
            placeholder="Dear ...&#10;&#10;Write your full response here..."
          />
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>{draft.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/3 p-3 text-sm text-slate-300">
        <Timer className="h-4 w-4 text-cyan-200" />
        Khi làm exam mode thật, hãy đặt mục tiêu hoàn thành email trong 10 phút.
      </div>
    </div>
  );
}

function ReviewStep({
  prompt,
  draft,
}: {
  prompt: Writing67Prompt;
  draft: string;
}) {
  const hasDraft = draft.trim().length > 0;

  return (
    <div>
      <StepTitle
        title="Review thủ công sau khi viết"
      />
      {!hasDraft && (
        <div className="mt-2 rounded-lg border border-amber-300/30 bg-amber-300/10 p-2.5 text-xs font-semibold text-amber-100">
          Bạn chưa viết email ở state Write. Hãy quay lại Write nếu muốn review bài của mình.
        </div>
      )}

      <div className="mt-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Task bắt buộc</p>
        <div className="flex flex-wrap gap-2">
          {prompt.tasks.map((task) => (
            <div key={task.requirement} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${TASK_STYLES[task.type]}`}>
              {task.label}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr]">
        <div className="min-h-[380px] rounded-lg border border-white/10 bg-white p-3 font-serif text-base leading-7 text-black">
          <p className="mb-2 font-sans text-xs font-bold uppercase tracking-wider text-slate-500">Bài của bạn</p>
          <pre className="whitespace-pre-wrap font-serif">{draft || "Chưa có nội dung."}</pre>
        </div>
        <div className="min-h-[380px] rounded-lg border border-cyan-300/20 bg-cyan-300/8 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-100/80">Sample answer</p>
          <div className="mt-2 space-y-1 text-sm leading-6 text-slate-100">
            {prompt.sampleAnswer.map((line) => <p key={line}>{line}</p>)}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Tự đối chiếu: đủ task trong directions, tone phù hợp, câu nối rõ ràng, ít lỗi ngữ pháp làm mờ nghĩa.
      </p>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/3 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 wrap-break-word text-xs font-bold leading-snug text-slate-200" title={value}>{value}</p>
    </div>
  );
}

function StepTitle({ title }: { title: string }) {
  return (
    <div>
      <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
    </div>
  );
}
