export type GameMode =
  | 'math'
  | 'numbers'
  | 'letters'
  | 'pattern'
  | 'sequence'
  | 'comparison'
  | 'missing_number'
  | 'letter_recognition';

export type MathOperator = '+' | '-';

export interface Question {
  text: string;
  visual?: string[];
  answer: string;
  options: string[];
}

export interface GameSettings {
  mathRange: number;
  mathOperator: MathOperator;
  sequenceRange: number;
  comparisonRange: number;
  missingNumberRange: number;
}
