import { MEASURES, UNIT_SPEECH, type Chain, type Unit } from './units.ts';

export type MeasureSkill = 'convert' | 'compare' | 'compound';
export interface MeasurementProblem {
  skill: MeasureSkill;
  measure: string;
  prompt: string;
  answerType: 'number' | 'choice3';
  parts?: string;
  toUnit?: string;
  left?: string;
  right?: string;
  answer: number | string;
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const rand = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const ALL: MeasureSkill[] = ['convert', 'compare', 'compound'];

function pickPair(chain: Chain): [Unit, Unit] {
  const i = rint(0, chain.length - 1);
  let j = i;
  while (j === i) j = Math.max(0, Math.min(chain.length - 1, i + rand([-2, -1, 1, 2])));
  return [chain[i], chain[j]];
}

export function generateMeasurementProblem(skill: MeasureSkill | 'mix'): MeasurementProblem {
  const sk = skill === 'mix' ? rand(ALL) : skill;
  const measure = rand(MEASURES);

  if (sk === 'compare') {
    const chain = rand(measure.chains);
    const [u1, u2] = pickPair(chain);
    const q1 = rint(1, 12), q2 = rint(1, 12);
    const a = q1 * u1.base, b = q2 * u2.base;
    return {
      skill: 'compare', measure: measure.name, prompt: 'Điền dấu thích hợp', answerType: 'choice3',
      left: `${q1} ${u1.label}`, right: `${q2} ${u2.label}`, answer: a < b ? '<' : a > b ? '>' : '=',
    };
  }

  if (sk === 'compound') {
    const chain = measure.chains.find((c) => c.length >= 3);
    if (!chain) return generateMeasurementProblem('convert');
    const t = rint(0, chain.length - 3);
    const target = chain[t], small = chain[t + 1], big = chain[t + 2];
    const q1 = rint(1, 9), q2 = rint(1, 9);
    const answer = q1 * (big.base / target.base) + q2 * (small.base / target.base);
    return {
      skill: 'compound', measure: measure.name, prompt: 'Đổi ra đơn vị trong ô', answerType: 'number',
      parts: `${q1} ${big.label} ${q2} ${small.label}`, toUnit: target.label, answer,
    };
  }

  // convert
  const chain = rand(measure.chains);
  const [x, y] = pickPair(chain);
  const from = x.base >= y.base ? x : y;
  const to = x.base >= y.base ? y : x;
  if (Math.random() < 0.7) {
    const q = rint(2, 9);
    return {
      skill: 'convert', measure: measure.name, prompt: 'Đổi đơn vị', answerType: 'number',
      parts: `${q} ${from.label}`, toUnit: to.label, answer: q * (from.base / to.base),
    };
  }
  const k = rint(2, 9);
  const q = k * (from.base / to.base);
  return {
    skill: 'convert', measure: measure.name, prompt: 'Đổi đơn vị', answerType: 'number',
    parts: `${q} ${to.label}`, toUnit: from.label, answer: k,
  };
}

export function checkMeasurementAnswer(p: MeasurementProblem, input: number | string): boolean {
  return input === p.answer;
}

const sayQty = (s: string) => s.replace(/(\d+)\s+(\S+)/g, (_, n, unit) => `${n} ${UNIT_SPEECH[unit] ?? unit}`);

export function verbalizeMeasurementProblem(p: MeasurementProblem): string {
  if (p.answerType === 'choice3') return `So sánh ${sayQty(p.left ?? '')} và ${sayQty(p.right ?? '')}`;
  return `${sayQty(p.parts ?? '')} bằng bao nhiêu ${UNIT_SPEECH[p.toUnit ?? ''] ?? p.toUnit}`;
}
