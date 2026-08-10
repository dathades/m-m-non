export type Tone = 'không' | 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng';

export const TONES: Tone[] = ['không', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng'];

export const TONE_LABELS: Record<Tone, string> = {
  không: 'ngang',
  sắc: 'sắc',
  huyền: 'huyền',
  hỏi: 'hỏi',
  ngã: 'ngã',
  nặng: 'nặng',
};

// Ký hiệu dấu hiển thị trên vòng tròn chấm (◌). Không dấu = rỗng.
export const TONE_MARKS: Record<Tone, string> = {
  không: '',
  sắc: '◌́',
  huyền: '◌̀',
  hỏi: '◌̉',
  ngã: '◌̃',
  nặng: '◌̣',
};

const COMBINING: Record<Tone, string> = {
  không: '',
  sắc: '́',
  huyền: '̀',
  hỏi: '̉',
  ngã: '̃',
  nặng: '̣',
};

const VOWELS = 'aăâeêioôơuưy';
const OFFGLIDE = 'iouy'; // nguyên âm có thể làm âm cuối (bán nguyên âm)
const FRONT = 'eêiy';    // nguyên âm "trước" → dùng k/gh/ngh

// Vị trí nguyên âm mang dấu trong chuỗi KHÔNG dấu (onset+rhyme hoặc rhyme).
export function toneVowelIndex(s: string): number {
  const idx: number[] = [];
  for (let i = 0; i < s.length; i++) if (VOWELS.includes(s[i])) idx.push(i);
  if (idx.length === 0) return -1;
  if (idx.length === 1) return idx[0];

  const endsWithConsonant = !VOWELS.includes(s[s.length - 1]);
  if (endsWithConsonant) return idx[idx.length - 1]; // nguyên âm cuối của cụm

  // cụm mở (không âm cuối)
  const cluster = idx.map((i) => s[i]).join('');
  if (['ia', 'ua', 'ưa'].includes(cluster)) return idx[0]; // nguyên âm đôi khép: dấu ở trước
  if (cluster === 'uy') return idx[idx.length - 1]; // uy: dấu ở y
  const last = s[idx[idx.length - 1]];
  if (OFFGLIDE.includes(last)) return idx[idx.length - 2]; // có âm cuối bán nguyên âm → nguyên âm chính đứng trước
  return idx[idx.length - 1]; // oa/oe/uê/uơ: dấu ở nguyên âm sau
}

export function applyTone(toneless: string, tone: Tone): string {
  if (tone === 'không') return toneless;
  const i = toneVowelIndex(toneless);
  if (i < 0) return toneless;
  return (toneless.slice(0, i + 1) + COMBINING[tone] + toneless.slice(i + 1)).normalize('NFC');
}

// Chọn chính tả cho các âm đầu biến thể theo nguyên âm đầu của vần.
export function chooseOnsetSpelling(phoneme: 'k' | 'g' | 'ng', rhyme: string): string {
  const front = FRONT.includes(rhyme[0]);
  if (phoneme === 'k') return front ? 'k' : 'c';
  if (phoneme === 'g') return front ? 'gh' : 'g';
  return front ? 'ngh' : 'ng';
}
