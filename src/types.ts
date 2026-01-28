export interface Question {
  id: string;
  question: string;
  answer: boolean;
  explain?: string;
  section: number;
}

export type QuizMode = 'provisional' | 'full';

export const QUIZ_CONFIG = {
  provisional: {
    name: '仮免許効果測定',
    questionCount: 50,
    passRate: 90,
  },
  full: {
    name: '本免許効果測定',
    questionCount: 90,
    passRate: 90,
  },
} as const;
