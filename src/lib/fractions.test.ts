import { describe, it, expect } from 'vitest';
import { gcd, simplify, add, sub, mul, divide, compareFrac, fracEquals, fractionOfNumber } from './fractions.ts';

describe('gcd', () => {
  it('ước chung lớn nhất', () => { expect(gcd(6, 8)).toBe(2); expect(gcd(5, 10)).toBe(5); expect(gcd(7, 3)).toBe(1); });
});
describe('simplify', () => {
  it('rút gọn về tối giản, mẫu dương', () => {
    expect(simplify({ num: 6, den: 8 })).toEqual({ num: 3, den: 4 });
    expect(simplify({ num: 5, den: 10 })).toEqual({ num: 1, den: 2 });
    expect(simplify({ num: 2, den: -4 })).toEqual({ num: -1, den: 2 });
  });
});
describe('phép tính (kết quả tối giản)', () => {
  it('cộng', () => { expect(add({num:1,den:2},{num:1,den:3})).toEqual({num:5,den:6}); });
  it('trừ', () => { expect(sub({num:2,den:3},{num:1,den:6})).toEqual({num:1,den:2}); });
  it('nhân', () => { expect(mul({num:2,den:3},{num:3,den:4})).toEqual({num:1,den:2}); });
  it('chia', () => { expect(divide({num:1,den:2},{num:1,den:4})).toEqual({num:2,den:1}); });
});
describe('compareFrac & fracEquals', () => {
  it('so sánh', () => { expect(compareFrac({num:1,den:2},{num:1,den:3})).toBe(1); expect(compareFrac({num:1,den:3},{num:1,den:2})).toBe(-1); expect(compareFrac({num:1,den:2},{num:2,den:4})).toBe(0); });
  it('bằng nhau (nhân chéo)', () => { expect(fracEquals({num:1,den:2},{num:2,den:4})).toBe(true); expect(fracEquals({num:1,den:2},{num:1,den:3})).toBe(false); });
});
describe('fractionOfNumber', () => {
  it('phân số của một số', () => { expect(fractionOfNumber({num:2,den:3}, 12)).toBe(8); });
});
