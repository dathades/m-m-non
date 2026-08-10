import { describe, it, expect } from 'vitest';
import { VI_SYLLABLES } from './viSyllables.ts';

describe('VI_SYLLABLES', () => {
  it('có đủ nhiều tiếng', () => {
    expect(VI_SYLLABLES.length).toBeGreaterThan(5000);
  });

  it('chứa các tiếng quen thuộc', () => {
    const set = new Set(VI_SYLLABLES);
    for (const s of ['cá', 'gà', 'bò', 'voi', 'sữa', 'ngựa']) {
      expect(set.has(s)).toBe(true);
    }
  });

  it('đã chuẩn hoá NFC và không có khoảng trắng', () => {
    for (const s of VI_SYLLABLES.slice(0, 200)) {
      expect(s).toBe(s.normalize('NFC'));
      expect(s).not.toMatch(/\s/);
    }
  });
});
