import { describe, it, expect } from 'vitest';
import { MEASURES } from './units.ts';

const byName = (n: string) => MEASURES.find((m) => m.name === n)!;
const chainOf = (n: string, label: string) =>
  byName(n).chains.find((c) => c.some((u) => u.label === label))!;
const base = (n: string, label: string) =>
  chainOf(n, label).find((u) => u.label === label)!.base;

describe('MEASURES', () => {
  it('đủ 4 loại đại lượng', () => {
    expect(MEASURES.map((m) => m.name).sort()).toEqual(['Diện tích', 'Khối lượng', 'Thời gian', 'Độ dài'].sort());
  });
  it('base tăng dần trong mỗi chuỗi', () => {
    for (const m of MEASURES) for (const c of m.chains)
      for (let i = 1; i < c.length; i++) expect(c[i].base).toBeGreaterThan(c[i - 1].base);
  });
  it('tỉ lệ chuẩn', () => {
    expect(base('Khối lượng', 'kg') / base('Khối lượng', 'g')).toBe(1000);
    expect(base('Khối lượng', 'yến') / base('Khối lượng', 'kg')).toBe(10);
    expect(base('Khối lượng', 'tấn') / base('Khối lượng', 'tạ')).toBe(10);
    expect(base('Diện tích', 'dm²') / base('Diện tích', 'cm²')).toBe(100);
    expect(base('Diện tích', 'm²') / base('Diện tích', 'dm²')).toBe(100);
    expect(base('Độ dài', 'km') / base('Độ dài', 'm')).toBe(1000);
    expect(base('Thời gian', 'phút') / base('Thời gian', 'giây')).toBe(60);
    expect(base('Thời gian', 'giờ') / base('Thời gian', 'phút')).toBe(60);
    expect(base('Thời gian', 'thế kỉ') / base('Thời gian', 'năm')).toBe(100);
  });
  it('thời gian có 2 chuỗi tách biệt (giây..ngày) và (năm, thế kỉ)', () => {
    expect(byName('Thời gian').chains).toHaveLength(2);
  });
});

import { UNIT_SPEECH } from './units.ts';
describe('UNIT_SPEECH', () => {
  it('phủ mọi đơn vị trong MEASURES', () => {
    for (const m of MEASURES) for (const c of m.chains) for (const u of c) {
      expect(UNIT_SPEECH[u.label]).toBeTruthy();
    }
  });
});
