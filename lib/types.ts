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
