# Game "Đánh Vần" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm trò chơi "Đánh Vần" dạy bé ghép âm đầu → vần → dấu, với tiếng được sinh tự động từ khối ngữ âm rồi lọc theo danh sách tiếng tiếng Việt có thật.

**Architecture:** Một file dữ liệu tiếng thật (`viSyllables.ts`, bundle sẵn, sắp theo tần suất) + một module logic thuần (`spelling.ts`: đặt dấu, chọn chính tả, quét sinh corpus, sinh đề) + một component tự quản 3 bước (`SpellingGame.tsx`) gắn vào `App.tsx` như một game mode mới. Vì tiếng được ghép từ khối nên cách tách đã biết sẵn; bộ lọc theo danh sách thật vừa mở rộng độ phủ vừa chặn lỗi chính tả/đặt dấu.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 + motion + canvas-confetti; test bằng Vitest; font Tinos (Google Fonts).

**Spec:** `docs/superpowers/specs/2026-08-10-danh-van-game-design.md`

---

## File Structure

- Create `scripts/build-syllables.mjs` — tải danh sách tiếng thật, ghi ra module TS.
- Create `src/lib/viSyllables.ts` — (sinh tự động) `VI_SYLLABLES: string[]`.
- Create `src/lib/spelling.ts` — hằng số khối, `applyTone`, `chooseOnsetSpelling`, `buildCorpus`, `generateSpellingRound`, các kiểu.
- Create `src/lib/spelling.test.ts` — test Vitest cho logic thuần.
- Create `src/components/games/SpellingGame.tsx` — UI 3 bước.
- Modify `src/types.ts` — thêm `'spelling'` vào `GameMode`.
- Modify `src/App.tsx` — state + handlers + render cho mode mới.
- Modify `src/components/StartScreen.tsx` — ô game "Đánh Vần".
- Modify `index.html` — nhúng font Tinos.
- Modify `src/index.css` — class `.font-spell`.
- Modify `package.json` — devDep vitest + script `test`.

**Phạm vi:** Chỉ sinh tiếng **có âm đầu** (bỏ tiếng không âm đầu như "an", "em" vì bước 1 cần một âm đầu để chọn). Không đụng `syllables.ts`/`WORDS`/game "Chữ đầu tiên".

---

## Task 1: Cài Vitest

**Files:**
- Modify: `package.json`
- Create: `src/lib/smoke.test.ts` (tạm, xoá ở cuối task)

- [ ] **Step 1: Cài vitest**

Run:
```bash
npm install -D vitest
```
Expected: `vitest` xuất hiện trong `devDependencies`.

- [ ] **Step 2: Thêm script test vào `package.json`**

Trong khối `"scripts"`, thêm dòng `"test"` (giữ nguyên các script khác):
```json
    "lint": "tsc --noEmit",
    "test": "vitest run"
```

- [ ] **Step 3: Viết smoke test**

Create `src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 5: Xoá smoke test và commit**

Run:
```bash
rm src/lib/smoke.test.ts
git add package.json package-lock.json
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Sinh dữ liệu tiếng thật `viSyllables.ts`

**Files:**
- Create: `scripts/build-syllables.mjs`
- Create (sinh tự động): `src/lib/viSyllables.ts`
- Test: `src/lib/viSyllables.test.ts`

- [ ] **Step 1: Viết script tải + chuyển đổi**

Create `scripts/build-syllables.mjs`:
```js
// Tải danh sách âm tiết tiếng Việt (sắp theo tần suất) và ghi ra module TS.
// Nguồn: hieuthi — 7184 common Vietnamese syllables
// https://gist.github.com/hieuthi/1f5d80fca871f3642f61f7e3de883f3a
// Dự phòng: https://raw.githubusercontent.com/vietnameselanguage/syllable/master/syllables.txt
import { writeFileSync } from 'node:fs';

const URL =
  'https://gist.githubusercontent.com/hieuthi/1f5d80fca871f3642f61f7e3de883f3a/raw';

const res = await fetch(URL);
if (!res.ok) throw new Error(`Tải thất bại: ${res.status}`);
const text = await res.text();

const seen = new Set();
const syllables = [];
for (const raw of text.split(/\r?\n/)) {
  const s = raw.trim().toLowerCase().normalize('NFC');
  // chỉ giữ 1 tiếng thuần chữ (có dấu), bỏ dòng rỗng/khoảng trắng/số
  if (!s || /[^a-zàáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/.test(s)) {
    continue;
  }
  if (seen.has(s)) continue;
  seen.add(s);
  syllables.push(s);
}

const header =
  '// TỰ ĐỘNG SINH bởi scripts/build-syllables.mjs — đừng sửa tay.\n' +
  '// Nguồn: hieuthi "7184 common Vietnamese syllables" (sắp theo tần suất giảm dần).\n' +
  '// https://gist.github.com/hieuthi/1f5d80fca871f3642f61f7e3de883f3a\n\n';
const body =
  'export const VI_SYLLABLES: string[] = ' +
  JSON.stringify(syllables) +
  ';\n';

writeFileSync('src/lib/viSyllables.ts', header + body, 'utf8');
console.log(`Đã ghi ${syllables.length} tiếng vào src/lib/viSyllables.ts`);
```

- [ ] **Step 2: Chạy script sinh file dữ liệu**

Run:
```bash
node scripts/build-syllables.mjs
```
Expected: in ra "Đã ghi 71xx tiếng…" và tạo `src/lib/viSyllables.ts`.

> Nếu máy chặn mạng khi build: tải thủ công nội dung raw ở URL trên vào một file text rồi đọc bằng `readFileSync` thay cho `fetch`. Bản dự phòng: repo `vietnameselanguage/syllable`.

- [ ] **Step 3: Viết test dữ liệu**

Create `src/lib/viSyllables.test.ts`:
```ts
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
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npm test`
Expected: các test VI_SYLLABLES pass.

- [ ] **Step 5: Commit**

Run:
```bash
git add scripts/build-syllables.mjs src/lib/viSyllables.ts src/lib/viSyllables.test.ts
git commit -m "feat: bundle real Vietnamese syllable list for spelling game"
```

---

## Task 3: `spelling.ts` — hằng số khối + `applyTone` + `chooseOnsetSpelling`

**Files:**
- Create: `src/lib/spelling.ts`
- Test: `src/lib/spelling.test.ts`

- [ ] **Step 1: Viết test cho đặt dấu & chính tả âm đầu**

Create `src/lib/spelling.test.ts`:
```ts
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
```

> Ghi chú: bỏ mảng `cases` thừa trong `describe('toneVowelIndex')` nếu không dùng — chỉ giữ 2 `it` cụ thể. (Dòng `cases` trên chỉ để tham khảo; có thể xoá.)

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npm test`
Expected: FAIL — không tìm thấy module `./spelling.ts`.

- [ ] **Step 3: Viết `spelling.ts` (phần 1)**

Create `src/lib/spelling.ts`:
```ts
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
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npm test`
Expected: các test `toneVowelIndex`, `applyTone`, `chooseOnsetSpelling` pass. (Nếu một ca đặt dấu sai, sửa `toneVowelIndex` cho tới khi xanh.)

- [ ] **Step 5: Commit**

Run:
```bash
git add src/lib/spelling.ts src/lib/spelling.test.ts
git commit -m "feat: tone placement and onset spelling helpers"
```

---

## Task 4: `spelling.ts` — khối âm đầu/vần + `buildCorpus`

**Files:**
- Modify: `src/lib/spelling.ts`
- Modify: `src/lib/spelling.test.ts`

- [ ] **Step 1: Viết test cho `buildCorpus`**

Thêm vào cuối `src/lib/spelling.test.ts`:
```ts
import { buildCorpus, ONSET_READING } from './spelling.ts';
import { VI_SYLLABLES } from './viSyllables.ts';

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
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npm test`
Expected: FAIL — chưa export `buildCorpus`/`ONSET_READING`.

- [ ] **Step 3: Bổ sung khối + `buildCorpus` vào `spelling.ts`**

Thêm vào `src/lib/spelling.ts` (dưới các hàm đã có):
```ts
import { VI_SYLLABLES } from './viSyllables.ts';

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
        const syllable = applyTone(blend, tone);
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
```

> Lưu ý: `import { VI_SYLLABLES }` đặt ở đầu file cùng các import khác cho gọn (di chuyển lên nếu muốn). Chức năng không đổi.

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npm test`
Expected: các test `buildCorpus` pass. Nếu "đủ lớn" (>1500) fail, thêm vần phổ biến vào `RHYMES` rồi chạy lại.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/lib/spelling.ts src/lib/spelling.test.ts
git commit -m "feat: build spelling corpus by composing then filtering real syllables"
```

---

## Task 5: `spelling.ts` — `generateSpellingRound`

**Files:**
- Modify: `src/lib/spelling.ts`
- Modify: `src/lib/spelling.test.ts`

- [ ] **Step 1: Viết test cho `generateSpellingRound`**

Thêm vào cuối `src/lib/spelling.test.ts`:
```ts
import { generateSpellingRound } from './spelling.ts';

describe('generateSpellingRound', () => {
  it('sinh đề hợp lệ 50 lần', () => {
    for (let n = 0; n < 50; n++) {
      const r = generateSpellingRound();

      // đáp án đúng khớp
      expect(r.blend).toBe(r.onset + r.rhyme);
      expect(r.onsetReading).toBe(ONSET_READING[r.onset]);
      expect(r.hasTone).toBe(r.tone !== 'không');
      expect(r.toneLabel).toBe(r.tone === 'không' ? '' : TONE_LABELS[r.tone]);

      const groups = [r.onsetOptions, r.rhymeOptions, r.toneOptions];
      const correct = [r.onset, r.rhyme, r.tone];
      groups.forEach((opts, gi) => {
        expect(opts).toHaveLength(4);
        // chứa đáp án đúng
        expect(opts.some((o) => o.value === correct[gi])).toBe(true);
        // value không trùng
        const values = opts.map((o) => o.value);
        expect(new Set(values).size).toBe(4);
      });
    }
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npm test`
Expected: FAIL — chưa export `generateSpellingRound`.

- [ ] **Step 3: Bổ sung `generateSpellingRound` + kiểu vào `spelling.ts`**

Thêm vào cuối `src/lib/spelling.ts`:
```ts
export interface SpellStepOption {
  display: string; // chữ hiển thị lớn
  reading: string; // nhãn cách đọc nhỏ
  value: string;   // giá trị so khớp
}

export interface SpellingRound {
  syllable: string;
  blend: string;
  onset: string;
  rhyme: string;
  tone: Tone;
  onsetReading: string;
  toneLabel: string; // '' nếu không dấu
  hasTone: boolean;
  onsetOptions: SpellStepOption[];
  rhymeOptions: SpellStepOption[];
  toneOptions: SpellStepOption[];
}

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const pickDistinct = (pool: string[], exclude: string, n: number): string[] =>
  shuffle(pool.filter((p) => p !== exclude)).slice(0, n);

const toneReading = (t: Tone): string => (t === 'không' ? '' : 'dấu ' + TONE_LABELS[t]);

export function generateSpellingRound(maxRank = 2000): SpellingRound {
  const corpus = buildCorpus();
  let pool = corpus.filter((w) => w.freqRank < maxRank);
  if (pool.length < 10) pool = corpus;
  const w = pool[Math.floor(Math.random() * pool.length)];

  const onsetOptions = shuffle([w.onset, ...pickDistinct(ONSET_POOL, w.onset, 3)]).map((v) => ({
    display: v,
    reading: ONSET_READING[v] ?? v,
    value: v,
  }));

  const rhymeOptions = shuffle([w.rhyme, ...pickDistinct(RHYMES, w.rhyme, 3)]).map((v) => ({
    display: v,
    reading: v,
    value: v,
  }));

  const toneOptions = shuffle([w.tone, ...(pickDistinct(TONES, w.tone, 3) as Tone[])]).map((t) => ({
    display: TONE_MARKS[t],
    reading: toneReading(t),
    value: t,
  }));

  return {
    syllable: w.syllable,
    blend: w.blend,
    onset: w.onset,
    rhyme: w.rhyme,
    tone: w.tone,
    onsetReading: w.onsetReading,
    toneLabel: w.tone === 'không' ? '' : TONE_LABELS[w.tone],
    hasTone: w.tone !== 'không',
    onsetOptions,
    rhymeOptions,
    toneOptions,
  };
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npm test`
Expected: tất cả test `spelling.test.ts` pass.

- [ ] **Step 5: Lint + commit**

Run:
```bash
npm run lint
git add src/lib/spelling.ts src/lib/spelling.test.ts
git commit -m "feat: generateSpellingRound with distractor options"
```
Expected: `tsc` không lỗi.

---

## Task 6: Thêm mode `'spelling'` vào types

**Files:**
- Modify: `src/types.ts:1-10`

- [ ] **Step 1: Thêm `'spelling'` vào `GameMode`**

Trong `src/types.ts`, sửa union `GameMode` (thêm dòng cuối):
```ts
export type GameMode =
  | 'math'
  | 'numbers'
  | 'letters'
  | 'pattern'
  | 'sequence'
  | 'comparison'
  | 'missing_number'
  | 'letter_recognition'
  | 'first_letter'
  | 'spelling';
```

- [ ] **Step 2: Lint + commit**

Run:
```bash
npm run lint
git add src/types.ts
git commit -m "feat: add 'spelling' game mode"
```

---

## Task 7: Component `SpellingGame.tsx`

**Files:**
- Create: `src/components/games/SpellingGame.tsx`

- [ ] **Step 1: Viết component**

Create `src/components/games/SpellingGame.tsx`:
```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { SpellingRound, SpellStepOption } from '../../lib/spelling.ts';

interface SpellingGameProps {
  round: SpellingRound;
  disabled: boolean;
  onComplete: () => void;
  onWrong: () => void;
}

export default function SpellingGame({ round, disabled, onComplete, onWrong }: SpellingGameProps) {
  const [step, setStep] = useState(0); // 0=âm đầu, 1=vần, 2=dấu, 3=xong
  const [wrongValue, setWrongValue] = useState<string | null>(null);

  // reset khi đổi tiếng
  useEffect(() => {
    setStep(0);
    setWrongValue(null);
  }, [round.syllable]);

  const steps = [
    { title: 'Tiếng này bắt đầu bằng âm nào?', options: round.onsetOptions, answer: round.onset, spoken: round.onsetReading },
    { title: 'Vần của tiếng này là gì?', options: round.rhymeOptions, answer: round.rhyme, spoken: round.rhyme },
    { title: 'Tiếng này có dấu gì?', options: round.toneOptions, answer: round.tone, spoken: round.syllable },
  ];

  const handlePick = (opt: SpellStepOption) => {
    if (disabled || step > 2) return;
    const current = steps[step];
    if (opt.value === current.answer) {
      speakText(current.spoken);
      const next = step + 1;
      setStep(next);
      if (next > 2) finish();
    } else {
      setWrongValue(opt.value);
      onWrong();
      setTimeout(() => setWrongValue(null), 500);
    }
  };

  const spokeChain = useRef(false);
  const finish = () => {
    spokeChain.current = false;
    // đọc cả chuỗi rồi báo hoàn thành
    const seq = round.hasTone
      ? [round.onsetReading, round.rhyme, round.blend, round.toneLabel, round.syllable]
      : [round.onsetReading, round.rhyme, round.blend];
    let i = 0;
    const speakNext = () => {
      if (i >= seq.length) {
        onComplete();
        return;
      }
      speakText(seq[i]);
      i += 1;
      setTimeout(speakNext, 850);
    };
    speakNext();
  };

  const done = step > 2;

  return (
    <div className="w-full">
      {/* chuỗi đánh vần: chỉ hiện khi xong */}
      {done && (
        <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
          <ChainTile big={round.onset} read={round.onsetReading} />
          <Op>+</Op>
          <ChainTile big={round.rhyme} read={round.rhyme} />
          <Op>→</Op>
          <ChainTile big={round.blend} read={round.blend} />
          {round.hasTone && (
            <>
              <Op>+</Op>
              <ChainTile big="dấu" read={round.toneLabel} />
              <Op>→</Op>
              <ChainTile big={round.syllable} read={round.syllable} highlight />
            </>
          )}
        </div>
      )}

      {/* tiếng cần đánh vần */}
      <div className="flex flex-col items-center mb-6">
        <div className="font-spell text-7xl font-bold text-purple-700 mb-3">{round.syllable}</div>
        <button
          onClick={() => speakText(round.syllable)}
          className="flex items-center gap-2 px-5 py-2 bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-700 rounded-full font-bold transition-colors"
        >
          <Volume2 size={20} />
          Nghe lại
        </button>
      </div>

      {!done && (
        <>
          <h3 className="text-2xl font-bold text-gray-500 mb-6">{steps[step].title}</h3>
          <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
            {steps[step].options.map((opt, i) => (
              <button
                key={`${step}-${opt.value}-${i}`}
                onClick={() => handlePick(opt)}
                disabled={disabled}
                className={`flex flex-col items-center justify-center rounded-2xl border-4 p-3 min-h-[92px] transition-all
                  ${wrongValue === opt.value ? 'border-red-400 bg-red-50 animate-[wiggle_0.4s]' : 'border-gray-200 bg-white hover:border-indigo-300 hover:-translate-y-1'}`}
              >
                <span className="font-spell text-4xl font-bold text-indigo-700 leading-none min-h-[40px]">{opt.display}</span>
                <span className="text-sm text-gray-400 mt-1 min-h-[16px]">{opt.reading}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChainTile({ big, read, highlight }: { big: string; read: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border-4 px-3 py-2 text-center ${highlight ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'}`}>
      <div className="font-spell text-3xl font-bold leading-none">{big}</div>
      <div className="text-xs text-gray-400 mt-1">{read}</div>
    </div>
  );
}

function Op({ children }: { children: ReactNode }) {
  return <div className="text-2xl text-purple-300 font-extrabold">{children}</div>;
}
```

- [ ] **Step 2: Thêm keyframes `wiggle` vào `src/index.css`**

Thêm vào cuối `src/index.css`:
```css
@keyframes wiggle {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: không lỗi TypeScript.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/components/games/SpellingGame.tsx src/index.css
git commit -m "feat: SpellingGame component with 3-step flow"
```

---

## Task 8: Tích hợp vào `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Thêm import**

Sau dòng `import { generateFirstLetter } from './lib/syllables.ts';` (khoảng dòng 20), thêm:
```ts
import { generateSpellingRound, type SpellingRound } from './lib/spelling.ts';
```
Và sau `import FirstLetterGame ...` (khoảng dòng 34), thêm:
```ts
import SpellingGame from './components/games/SpellingGame.tsx';
```

- [ ] **Step 2: Thêm state `spellingRound`**

Sau dòng `const [question, setQuestion] = useState<Question | null>(null);` (khoảng dòng 65), thêm:
```ts
  const [spellingRound, setSpellingRound] = useState<SpellingRound | null>(null);
```

- [ ] **Step 3: Xoá `spellingRound` khi về trang chủ**

Trong `resetToHome`, thêm dòng (cạnh `setQuestion(null);`):
```ts
    setSpellingRound(null);
```

- [ ] **Step 4: Sửa `nextQuestion` để nhánh spelling**

Thay toàn bộ hàm `nextQuestion` bằng:
```ts
  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setTimeLeft(30);

    if (mode === 'spelling') {
      const round = generateSpellingRound();
      setSpellingRound(round);
      speakText(round.syllable);
      return;
    }

    const newQuestion = generateQuestionForMode(mode);
    if (newQuestion) {
      setQuestion(newQuestion);
      speakText(newQuestion.text);
    }
  }, [mode, generateQuestionForMode]);
```

- [ ] **Step 5: Sửa `startGame` để khởi tạo vòng spelling**

Trong `startGame`, thay khối `if (selectedMode === 'letters') { ... } else { ... }` bằng:
```ts
    if (selectedMode === 'letters') {
      setCurrentLetter('A');
      setShowLetterPicker(true);
      speakText(`${childName} muốn tập viết chữ nào`);
    } else if (selectedMode === 'spelling') {
      const round = generateSpellingRound();
      setSpellingRound(round);
      speakText(round.syllable);
    } else {
      const firstQuestion = generateQuestionForMode(selectedMode);
      if (firstQuestion) {
        setQuestion(firstQuestion);
        speakText(firstQuestion.text);
      }
    }
```

- [ ] **Step 6: Loại `spelling` khỏi effect auto-next theo `question`**

Sửa effect (khoảng dòng 141-145):
```ts
  useEffect(() => {
    if (gameState === 'playing' && !question && mode !== 'letters' && mode !== 'spelling') {
      nextQuestion();
    }
  }, [gameState, question, mode, nextQuestion]);
```

- [ ] **Step 7: Thêm handlers hoàn thành/sai cho spelling**

Sau hàm `handleSelectLetter`/`handleRequestPicker` (khoảng dòng 210), thêm:
```ts
  const handleSpellingComplete = () => {
    setTotalCount((prev) => prev + 1);
    setScore((prev) => prev + 1);
    setFeedback('correct');
    playSound('correct');
    speakText(`${childName} giỏi quá!`);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setTimeout(nextQuestion, 2500);
  };

  const handleSpellingWrong = () => {
    setWrongCount((prev) => prev + 1);
    playSound('wrong');
  };
```

- [ ] **Step 8: Sửa guard trong `renderGameBody` + thêm case**

Sửa dòng đầu `renderGameBody` (khoảng dòng 213):
```ts
    if (!question && mode !== 'letters' && mode !== 'spelling') return null;
```
Thêm case trước `default:` trong `switch (mode)`:
```ts
      case 'spelling':
        return spellingRound ? (
          <SpellingGame
            round={spellingRound}
            disabled={feedback === 'correct'}
            onComplete={handleSpellingComplete}
            onWrong={handleSpellingWrong}
          />
        ) : null;
```

- [ ] **Step 9: Sửa `AnimatePresence` key cho spelling**

Trong `renderPlaying`, sửa prop `key` của `motion.div` (khoảng dòng 262):
```tsx
          key={
            mode === 'letters'
              ? (showLetterPicker ? 'picker' : currentLetter)
              : mode === 'spelling'
              ? (spellingRound?.syllable ?? '')
              : (question?.text ?? '') + (question?.visual?.length || '')
          }
```

- [ ] **Step 10: Lint**

Run: `npm run lint`
Expected: không lỗi.

- [ ] **Step 11: Commit**

Run:
```bash
git add src/App.tsx
git commit -m "feat: wire spelling game into App"
```

---

## Task 9: Ô game trong `StartScreen.tsx`

**Files:**
- Modify: `src/components/StartScreen.tsx`

- [ ] **Step 1: Thêm icon vào import lucide**

Trong khối import từ `lucide-react` (dòng 2-13), thêm `SpellCheck`:
```ts
  RotateCcw,
  Settings2,
  SpellCheck,
  Trophy,
```

- [ ] **Step 2: Thêm nút "Đánh Vần"**

Ngay trước nút `onStart('first_letter')` (khoảng dòng 234), thêm:
```tsx
        <button
          onClick={() => onStart('spelling')}
          className="group flex flex-col items-center p-6 bg-fuchsia-100 hover:bg-fuchsia-200 rounded-2xl transition-all border-b-8 border-fuchsia-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-fuchsia-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <SpellCheck size={48} />
          </div>
          <span className="text-2xl font-bold text-fuchsia-700">Đánh Vần</span>
          <span className="text-sm text-fuchsia-600 mt-2">Ghép âm thành tiếng</span>
        </button>
```

- [ ] **Step 3: Lint + commit**

Run:
```bash
npm run lint
git add src/components/StartScreen.tsx
git commit -m "feat: add Đánh Vần tile to start screen"
```

---

## Task 10: Font Tinos

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Nhúng font trong `index.html`**

Trong `<head>` (sau thẻ `<title>`), thêm:
```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Thêm class `.font-spell` vào `src/index.css`**

Thêm vào cuối `src/index.css`:
```css
.font-spell {
  font-family: 'Tinos', 'Times New Roman', serif;
}
```

- [ ] **Step 3: Commit**

Run:
```bash
git add index.html src/index.css
git commit -m "feat: load Tinos font for spelling game"
```

---

## Task 11: Kiểm thử toàn diện

**Files:** (không sửa code — chỉ kiểm chứng)

- [ ] **Step 1: Chạy toàn bộ test**

Run: `npm test`
Expected: tất cả pass.

- [ ] **Step 2: Lint + build**

Run:
```bash
npm run lint && npm run build
```
Expected: không lỗi TypeScript, build thành công.

- [ ] **Step 3: Chơi thử thủ công**

Run: `npm run dev`, mở http://localhost:3000
Kiểm:
- Vào ô **Đánh Vần**; thấy tiếng (font Tinos, có dấu đúng) + nút Nghe lại đọc tiếng.
- Bước 1/2/3 hỏi âm đầu → vần → dấu; đáp án có nhãn cách đọc; chọn sai thì thẻ rung + có tiếng "sai".
- Tiếng **không dấu** (vd bốc trúng "voi"): ô dấu đúng để **trống**, không có chữ "ngang".
- Đúng cả 3 bước: hiện chuỗi đánh vần, app đọc lại cả chuỗi, confetti, +1 điểm, sang tiếng mới.
- Đồng hồ 30s chạy; hết giờ ra màn kết thúc.
- Chữ dài (bốc trúng "chuối"/"bướm"/"ngựa") không vỡ layout.

- [ ] **Step 4: Commit (nếu có chỉnh nhỏ khi kiểm)**

Run:
```bash
git add -A
git commit -m "test: manual verification pass for spelling game"
```

---

## Ghi chú
- Nếu `applyTone` sai ca nào (test đỏ), sửa `toneVowelIndex` và thêm ca vào test.
- `maxRank` (mặc định 2000) điều chỉnh độ khó: nhỏ hơn = tiếng quen hơn.
- Giá trị `ONSET_READING`/`gi→dờ` có thể chỉnh theo sách giáo khoa; gom một chỗ trong `spelling.ts`.
