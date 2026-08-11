export type GameMode =
  | 'math'
  | 'numbers'
  | 'letters'
  | 'pattern'
  | 'sequence'
  | 'comparison'
  | 'missing_number'
  | 'letter_recognition'
  | 'first_letter'
  | 'spelling'
  | 'fractions'
  | 'measurement';

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

export type ClassLevel = 'mam_non' | 'lop_4';
