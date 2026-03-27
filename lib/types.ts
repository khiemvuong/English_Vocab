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
