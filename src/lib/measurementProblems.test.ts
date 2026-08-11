import { describe, it, expect } from 'vitest';
import { generateMeasurementProblem, checkMeasurementAnswer, type MeasureSkill } from './measurementProblems.ts';
import { MEASURES } from './units.ts';

const baseOf = (measure: string, label: string) => {
  const m = MEASURES.find((x) => x.name === measure)!;
  for (const c of m.chains) for (const u of c) if (u.label === label) return u.base;
  throw new Error('unit not found: ' + label);
};
// "5 yến" -> {q:5,label:'yến'}
const parse1 = (s: string) => { const m = s.match(/^(\d+)\s+(.+)$/)!; return { q: +m[1], label: m[2] }; };

const SKILLS: MeasureSkill[] = ['convert', 'compare', 'compound'];

describe('generateMeasurementProblem', () => {
  it('sinh đề hợp lệ (nhiều lần)', () => {
    for (const sk of SKILLS) {
      for (let i = 0; i < 40; i++) {
        const p = generateMeasurementProblem(sk);
        if (sk === 'compare') {
          expect(['<', '=', '>']).toContain(p.answer);
          const l = parse1(p.left!), r = parse1(p.right!);
          const a = l.q * baseOf(p.measure, l.label), b = r.q * baseOf(p.measure, r.label);
          expect(p.answer).toBe(a < b ? '<' : a > b ? '>' : '=');
        } else {
          expect(typeof p.answer).toBe('number');
          expect(Number.isInteger(p.answer)).toBe(true);
          expect(p.answer as number).toBeGreaterThan(0);
          expect(p.answerType).toBe('number');
        }
      }
    }
  });

  it('convert: đáp án đúng theo quy đổi base', () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMeasurementProblem('convert');
      const src = parse1(p.parts!);
      const expected = (src.q * baseOf(p.measure, src.label)) / baseOf(p.measure, p.toUnit!);
      expect(p.answer).toBe(expected);
    }
  });

  it('compound không dùng chuỗi < 3 đơn vị (năm/thế kỉ)', () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMeasurementProblem('compound');
      // parts có 2 số + 2 đơn vị
      expect(p.parts!.match(/\d+/g)!).toHaveLength(2);
    }
  });
});

describe('checkMeasurementAnswer', () => {
  it('khớp số / dấu', () => {
    expect(checkMeasurementAnswer({ answer: 50 } as any, 50)).toBe(true);
    expect(checkMeasurementAnswer({ answer: 50 } as any, 51)).toBe(false);
    expect(checkMeasurementAnswer({ answer: '<' } as any, '<')).toBe(true);
    expect(checkMeasurementAnswer({ answer: '<' } as any, '>')).toBe(false);
  });
});
