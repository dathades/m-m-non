import {
  add, sub, mul, divide, compareFrac, fracEquals, gcd,
  type Fraction,
} from './fractions.ts';

export type FractionSkill = 'recognize' | 'simplify' | 'compare' | 'addsub' | 'muldiv' | 'fracof';
export type AnswerType = 'choice' | 'choice3' | 'fraction' | 'integer';

export interface FractionProblem {
  skill: FractionSkill;
  prompt: string;
  operands: Fraction[];
  op?: '+' | '−' | '×' | '÷';
  ofNum?: number;
  shaded?: number;
  total?: number;
  answerType: AnswerType;
  answer: Fraction | number | string;
  options?: string[];
  strict?: boolean;
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const shuffle = <T>(a: T[]): T[] =>
  a.map((x) => [Math.random(), x] as [number, T]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

const ALL: FractionSkill[] = ['recognize', 'simplify', 'compare', 'addsub', 'muldiv', 'fracof'];

export function generateFractionProblem(skill: FractionSkill | 'mix'): FractionProblem {
  const sk = skill === 'mix' ? ALL[rint(0, ALL.length - 1)] : skill;

  if (sk === 'recognize') {
    const total = rint(2, 8), shaded = rint(1, total);
    const answer = `${shaded}/${total}`;
    const opts = new Set<string>([answer]);
    while (opts.size < 4) opts.add(`${rint(1, 9)}/${rint(2, 9)}`);
    return { skill: 'recognize', prompt: 'Hình đã tô mấy phần?', operands: [], shaded, total, answerType: 'choice', answer, options: shuffle([...opts]) };
  }
  if (sk === 'simplify') {
    let b = rint(2, 9), a = rint(1, b - 1);
    while (gcd(a, b) !== 1) { b = rint(2, 9); a = rint(1, b - 1); }
    const k = rint(2, 4);
    return { skill: 'simplify', prompt: 'Rút gọn phân số về tối giản', operands: [{ num: a * k, den: b * k }], answerType: 'fraction', answer: { num: a, den: b }, strict: true };
  }
  if (sk === 'compare') {
    const f1 = { num: rint(1, 7), den: rint(2, 8) }, f2 = { num: rint(1, 7), den: rint(2, 8) };
    const c = compareFrac(f1, f2);
    return { skill: 'compare', prompt: 'Điền dấu thích hợp', operands: [f1, f2], answerType: 'choice3', answer: c < 0 ? '<' : c > 0 ? '>' : '=' };
  }
  if (sk === 'addsub') {
    const plus = Math.random() < 0.5;
    let f1 = { num: rint(1, 6), den: rint(2, 8) }, f2 = { num: rint(1, 6), den: rint(2, 8) };
    if (!plus && compareFrac(f1, f2) < 0) { const t = f1; f1 = f2; f2 = t; }
    return { skill: 'addsub', prompt: 'Tính kết quả', operands: [f1, f2], op: plus ? '+' : '−', answerType: 'fraction', answer: plus ? add(f1, f2) : sub(f1, f2) };
  }
  if (sk === 'muldiv') {
    const times = Math.random() < 0.5;
    const f1 = { num: rint(1, 6), den: rint(2, 7) }, f2 = { num: rint(1, 6), den: rint(2, 7) };
    return { skill: 'muldiv', prompt: 'Tính kết quả', operands: [f1, f2], op: times ? '×' : '÷', answerType: 'fraction', answer: times ? mul(f1, f2) : divide(f1, f2) };
  }
  const b = rint(2, 6), a = rint(1, b - 1), m = rint(2, 6), n = b * m;
  return { skill: 'fracof', prompt: 'Tìm phân số của một số', operands: [{ num: a, den: b }], ofNum: n, answerType: 'integer', answer: (a * n) / b };
}

export function checkFractionAnswer(p: FractionProblem, input: Fraction | number | string): boolean {
  if (p.answerType === 'choice' || p.answerType === 'choice3') return input === p.answer;
  if (p.answerType === 'integer') return input === p.answer;
  const f = input as Fraction;
  if (!f || !f.den || Number.isNaN(f.num) || Number.isNaN(f.den)) return false;
  const ans = p.answer as Fraction;
  if (p.strict) return f.num === ans.num && f.den === ans.den;
  return fracEquals(f, ans);
}
