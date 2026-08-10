import { VI_SYLLABLES } from './viSyllables.ts';

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

// Âm đầu cố định: chính tả → cách đọc.
const FIXED_ONSETS: Record<string, string> = {
  b: 'bờ', ch: 'chờ', d: 'dờ', đ: 'đờ', gi: 'dờ', h: 'hờ', kh: 'khờ',
  l: 'lờ', m: 'mờ', n: 'nờ', nh: 'nhờ', ph: 'phờ', qu: 'quờ', r: 'rờ',
  s: 'sờ', t: 'tờ', th: 'thờ', tr: 'trờ', v: 'vờ', x: 'xờ',
};

// Âm đầu biến thể chính tả: phoneme → cách đọc.
const VAR_ONSETS: { phoneme: 'k' | 'g' | 'ng'; reading: string }[] = [
  { phoneme: 'k', reading: 'cờ' },
  { phoneme: 'g', reading: 'gờ' },
  { phoneme: 'ng', reading: 'ngờ' },
];

// Bản đồ chính tả âm đầu → cách đọc (mọi biến thể).
export const ONSET_READING: Record<string, string> = {
  ...FIXED_ONSETS,
  c: 'cờ', k: 'cờ', g: 'gờ', gh: 'gờ', ng: 'ngờ', ngh: 'ngờ',
};

// Mọi chính tả âm đầu (dùng làm nguồn nhiễu cho đáp án).
export const ONSET_POOL: string[] = Object.keys(ONSET_READING);

// Vần không dấu để ghép (không cần đầy đủ — sẽ lọc theo tiếng thật).
export const RHYMES: string[] = [
  // mở, một nguyên âm
  'a', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư',
  // mở, nguyên âm đôi/ba
  'ai', 'ao', 'au', 'ay', 'âu', 'ây', 'eo', 'êu', 'ia', 'iu',
  'oa', 'oe', 'oi', 'ôi', 'ơi', 'ua', 'ui', 'ưa', 'ưi', 'ưu',
  'uy', 'uê', 'uơ', 'uôi', 'ươi', 'oai', 'oay',
  // âm cuối mũi
  'am', 'ăm', 'âm', 'em', 'êm', 'im', 'om', 'ôm', 'ơm', 'um',
  'an', 'ăn', 'ân', 'en', 'ên', 'in', 'on', 'ôn', 'ơn', 'un', 'ưn',
  'ang', 'ăng', 'âng', 'ong', 'ông', 'ung', 'ưng',
  'anh', 'inh', 'ênh', 'iên', 'iêng', 'uôn', 'uông', 'ương', 'oan', 'oang', 'uân', 'uyên',
  // âm cuối tắc
  'ac', 'ăc', 'âc', 'oc', 'ôc', 'uc', 'ưc', 'uôc', 'ươc',
  'at', 'ăt', 'ât', 'et', 'êt', 'it', 'ot', 'ôt', 'ơt', 'ut', 'ưt', 'uôt', 'ươt',
  'ap', 'ăp', 'âp', 'ep', 'êp', 'ip', 'op', 'ôp', 'up',
  'ach', 'êch', 'ich', 'iêc', 'iêt', 'iêp', 'iêm',
];

export interface SpellingWord {
  syllable: string;     // "cá"
  onset: string;        // "c"
  rhyme: string;        // "a"
  tone: Tone;           // "sắc"
  onsetReading: string; // "cờ"
  blend: string;        // "ca" = onset + rhyme
  freqRank: number;     // vị trí trong VI_SYLLABLES (nhỏ = phổ biến hơn)
}

let _corpus: SpellingWord[] | null = null;

export function buildCorpus(): SpellingWord[] {
  if (_corpus) return _corpus;
  const rank = new Map<string, number>();
  VI_SYLLABLES.forEach((s, i) => rank.set(s, i));

  const bySyllable = new Map<string, SpellingWord>();
  const defs: { onset: string; reading: string; variable?: 'k' | 'g' | 'ng' }[] = [
    ...Object.entries(FIXED_ONSETS).map(([onset, reading]) => ({ onset, reading })),
    ...VAR_ONSETS.map((v) => ({ onset: v.phoneme, reading: v.reading, variable: v.phoneme })),
  ];

  for (const def of defs) {
    for (const rhyme of RHYMES) {
      const onset = def.variable ? chooseOnsetSpelling(def.variable, rhyme) : def.onset;
      const blend = onset + rhyme;
      for (const tone of TONES) {
        const syllable = tone === 'không' ? blend : onset + applyTone(rhyme, tone);
        const freqRank = rank.get(syllable);
        if (freqRank === undefined) continue;
        if (bySyllable.has(syllable)) continue; // giữ cách tách đầu tiên
        bySyllable.set(syllable, {
          syllable, onset, rhyme, tone, onsetReading: def.reading, blend, freqRank,
        });
      }
    }
  }
  _corpus = [...bySyllable.values()];
  return _corpus;
}
