import { describe, it, expect } from 'vitest';
import { applyTone, chooseOnsetSpelling, toneVowelIndex } from './spelling.ts';
import { buildCorpus, ONSET_READING } from './spelling.ts';
import { VI_SYLLABLES } from './viSyllables.ts';

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

describe('buildCorpus', () => {
  const corpus = buildCorpus();
  const set = new Set(VI_SYLLABLES);

  it('không rỗng và đủ lớn', () => {
    expect(corpus.length).toBeGreaterThan(1500);
  });

  it('mọi tiếng đều có thật', () => {
    for (const w of corpus) expect(set.has(w.syllable)).toBe(true);
  });

  it('tách đúng: onset + đặt dấu(rhyme) = syllable; blend = onset + rhyme', () => {
    for (const w of corpus) {
      expect(w.blend).toBe(w.onset + w.rhyme);
      expect(w.onset + applyTone(w.rhyme, w.tone)).toBe(w.syllable);
    }
  });

  it('mỗi onset có cách đọc', () => {
    for (const w of corpus) expect(ONSET_READING[w.onset]).toBeTruthy();
  });

  it('không trùng syllable', () => {
    const seen = new Set<string>();
    for (const w of corpus) {
      expect(seen.has(w.syllable)).toBe(false);
      seen.add(w.syllable);
    }
  });
});
