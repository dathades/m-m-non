import { describe, it, expect } from 'vitest';
import { generateFractionProblem, checkFractionAnswer, type FractionSkill } from './fractionProblems.ts';
import { fracEquals } from './fractions.ts';

const SKILLS: FractionSkill[] = ['recognize','simplify','compare','addsub','muldiv','fracof'];

describe('generateFractionProblem', () => {
  it('sinh đề hợp lệ cho từng kỹ năng (nhiều lần)', () => {
    for (const sk of SKILLS) {
      for (let i = 0; i < 30; i++) {
        const p = generateFractionProblem(sk);
        expect(p.skill).toBe(sk);
        if (sk === 'recognize') {
          expect(p.options).toHaveLength(4);
          expect(p.options).toContain(p.answer);
          expect(p.answer).toBe(`${p.shaded}/${p.total}`);
        }
        if (sk === 'compare') expect(['<','=','>']).toContain(p.answer);
        if (sk === 'simplify') { expect(p.strict).toBe(true); expect(p.answerType).toBe('fraction'); }
        if (sk === 'fracof') { expect(Number.isInteger(p.answer)).toBe(true); expect(p.ofNum! % p.operands[0].den).toBe(0); }
      }
    }
  });
});

describe('checkFractionAnswer', () => {
  it('simplify: chỉ chấp nhận đúng tối giản', () => {
    const p = { skill:'simplify', prompt:'', operands:[{num:2,den:4}], answerType:'fraction', answer:{num:1,den:2}, strict:true } as any;
    expect(checkFractionAnswer(p, {num:1,den:2})).toBe(true);
    expect(checkFractionAnswer(p, {num:2,den:4})).toBe(false);
  });
  it('addsub/muldiv: chấp nhận phân số tương đương', () => {
    const p = { skill:'addsub', prompt:'', operands:[], op:'+', answerType:'fraction', answer:{num:1,den:2} } as any;
    expect(checkFractionAnswer(p, {num:1,den:2})).toBe(true);
    expect(checkFractionAnswer(p, {num:2,den:4})).toBe(true);
    expect(checkFractionAnswer(p, {num:1,den:3})).toBe(false);
  });
  it('integer & choice khớp chính xác', () => {
    expect(checkFractionAnswer({answerType:'integer',answer:8} as any, 8)).toBe(true);
    expect(checkFractionAnswer({answerType:'integer',answer:8} as any, 7)).toBe(false);
    expect(checkFractionAnswer({answerType:'choice3',answer:'<'} as any, '<')).toBe(true);
    expect(checkFractionAnswer({answerType:'choice',answer:'3/4'} as any, '3/4')).toBe(true);
  });
  it('phân số mẫu 0 → sai', () => {
    const p = { answerType:'fraction', answer:{num:1,den:2} } as any;
    expect(checkFractionAnswer(p, {num:1,den:0})).toBe(false);
  });
});

// dùng fracEquals để chắc kết quả addsub thực sự đúng giá trị
describe('đáp án addsub đúng giá trị', () => {
  it('answer tương đương tổng/hiệu operands', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateFractionProblem('addsub');
      const [a, b] = p.operands;
      const expected = p.op === '+'
        ? { num: a.num*b.den + b.num*a.den, den: a.den*b.den }
        : { num: a.num*b.den - b.num*a.den, den: a.den*b.den };
      expect(fracEquals(p.answer as any, expected)).toBe(true);
    }
  });
});
