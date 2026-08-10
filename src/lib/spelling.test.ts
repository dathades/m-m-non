import { describe, it, expect } from 'vitest';
import { applyTone, chooseOnsetSpelling, toneVowelIndex } from './spelling.ts';

describe('toneVowelIndex', () => {
  // Test chi tiết đặt dấu nằm ở applyTone (dùng vần thật có ô/ê/ơ).
  it('một nguyên âm', () => {
    expect(toneVowelIndex('ca')).toBe(1);
  });
  it('vần đóng lấy nguyên âm cuối của cụm', () => {
    expect(toneVowelIndex('cuon')).toBe(2); // u,o -> o (index 2) trước n
  });
  it('nguyên âm đôi khép ua/ưa lấy nguyên âm trước', () => {
    expect(toneVowelIndex('cua')).toBe(1); // u
  });
});

describe('applyTone', () => {
  const cases: [string, string, string][] = [
    ['ca', 'sắc', 'cá'],
    ['ca', 'huyền', 'cà'],
    ['ca', 'hỏi', 'cả'],
    ['ca', 'nặng', 'cạ'],
    ['ga', 'huyền', 'gà'],
    ['gâu', 'sắc', 'gấu'],
    ['sưa', 'ngã', 'sữa'],
    ['ngưa', 'nặng', 'ngựa'],
    ['bươm', 'sắc', 'bướm'],
    ['chuôi', 'sắc', 'chuối'],
    ['cua', 'hỏi', 'của'],
    ['hoa', 'huyền', 'hoà'],
    ['khoe', 'hỏi', 'khoẻ'],
    ['thuy', 'sắc', 'thuý'],
    ['tiên', 'sắc', 'tiến'],
    ['muôn', 'sắc', 'muốn'],
    ['đương', 'huyền', 'đường'],
  ];
  for (const [toneless, tone, expected] of cases) {
    it(`${toneless} + ${tone} = ${expected}`, () => {
      expect(applyTone(toneless, tone as any)).toBe(expected);
    });
  }
  it('không dấu trả về nguyên chuỗi', () => {
    expect(applyTone('voi', 'không')).toBe('voi');
  });
});

describe('chooseOnsetSpelling', () => {
  it('/k/: c trước a/o/u, k trước e/ê/i', () => {
    expect(chooseOnsetSpelling('k', 'a')).toBe('c');
    expect(chooseOnsetSpelling('k', 'ê')).toBe('k');
    expect(chooseOnsetSpelling('k', 'i')).toBe('k');
  });
  it('/g/: g vs gh', () => {
    expect(chooseOnsetSpelling('g', 'a')).toBe('g');
    expect(chooseOnsetSpelling('g', 'e')).toBe('gh');
  });
  it('/ng/: ng vs ngh', () => {
    expect(chooseOnsetSpelling('ng', 'a')).toBe('ng');
    expect(chooseOnsetSpelling('ng', 'i')).toBe('ngh');
  });
});
