export interface AnswerOption {
  text: string;
  isCorrect: boolean;
  rationale: string;
}

export interface Question {
  id?: number;
  question: string;
  answerOptions: AnswerOption[];
  hint?: string;
  translation?: string;
  category?: string;
}

export interface QuizData {
  title: string;
  questions: Question[];
}

// Scenario-based vocabulary types
export interface ScenarioOption {
  text: string;
  phonetic: string;
  meaning: string;
}

export interface ScenarioBlank {
  hint: string;
  answer: string;
  options: ScenarioOption[];
}

export interface ScenarioPassage {
  text: string;
  blanks: ScenarioBlank[];
}

export interface Scenario {
  id: number;
  title: string;
  theme: string;
  passages: ScenarioPassage[];
}

export interface ScenarioData {
  title: string;
  scenarios: Scenario[];
}

// Part 6 — Text Completion & Double Passage types
export interface Part6AnswerOption {
  text: string;
  isCorrect: boolean;
  rationale: string;
}

export interface Part6Question {
  id: number;
  blankLabel: string | null;
  questionType: "vocabulary" | "grammar" | "conjunction" | "preposition" | "word-form" | "sentence-insertion" | "reading-comprehension";
  question?: string;
  answerOptions: Part6AnswerOption[];
  hint: string;
  translation: string;
}

export interface Part6Passage {
  id: string;
  passageNumber: number;
  questionRange: string;
  passageType: string;
  passageTitle: string;
  // Single passage
  passage?: string;
  // Double passage
  passageA?: string;
  passageB?: string;
  questions: Part6Question[];
}

export interface Part6Data {
  title: string;
  passages: Part6Passage[];
}

// Writing Practice types (TOEIC Writing Q1-5)
export interface WritingSkillType {
  key: string;
  label: string;
  description: string;
}

export interface PhraseOption {
  text: string;
  meaning: string;
  isCorrect: boolean;
}

export interface WritingQuestion {
  id: string;
  skillType: "verbTense" | "preposition" | "connector" | "intensifier" | "sentenceCombining" | "scoringRubric";
  skillLabel: string;
  topic: string;
  keywords: string[];
  scene: string;
  question: string;
  answerOptions: AnswerOption[];
  hint: string;
  vocabHint?: string;
  image?: string; // ImageKit URL for the scene picture
  phraseOptions?: PhraseOption[];
}

export interface WritingQuestionSet {
  setId: string;
  title: string;
  description: string;
  sourceMaterial: string;
  skillTypes: WritingSkillType[];
  totalQuestions: number;
  questions: WritingQuestion[];
}

// Writing Practice types (TOEIC Writing Q6-7)
export type Writing67TaskType =
  | "information"
  | "suggestion"
  | "reason"
  | "question"
  | "instruction"
  | "complaint"
  | "request";

export interface Writing67VocabularyItem {
  phrase: string;
  meaningVi: string;
  category: Writing67TaskType | "general";
  example: string;
}

export interface Writing67Task {
  type: Writing67TaskType;
  label: string;
  requirement: string;
  example: string;
}

export interface Writing67Email {
  from: string;
  to: string;
  subject: string;
  sent: string;
  body: string[];
  translationVi: string[];
}

export interface Writing67Prompt {
  id: string;
  title: string;
  topic: string;
  level: "foundation" | "guided" | "exam";
  email: Writing67Email;
  directions: string;
  roleVi: string;
  tasks: Writing67Task[];
  vocabulary: Writing67VocabularyItem[];
  patterns: string[];
  sampleAnswer: string[];
  sampleBlanks: {
    sentence: string;
    answer: string;
    meaningVi: string;
  }[];
  guidedOutline: {
    greeting: string;
    opening: string;
    bodySlots: string[];
    closing: string;
  };
}

export interface Writing67Set {
  setId: string;
  title: string;
  description: string;
  sourceMaterial: string;
  prompts: Writing67Prompt[];
}
