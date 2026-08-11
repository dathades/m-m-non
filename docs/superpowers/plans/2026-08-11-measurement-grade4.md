# Game Đo Lường (lớp 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm game luyện Đo lường & đơn vị (Toán lớp 4) — đổi đơn vị / so sánh / đổi ghép cho khối lượng, diện tích, thời gian, độ dài — hiển thị khi lớp = Lớp 4.

**Architecture:** Dữ liệu đơn vị thuần (`units.ts`) + sinh/chấm đề (`measurementProblems.ts`) test bằng Vitest. UI `MeasurementGame` là mini-game tự quản (đồng hồ 30s/câu + tính điểm), tái dùng `NumberPad` + `GameHUD`, mirror `FractionGame`. `StartScreen` (nhánh Lớp 4) thêm ô "Đo Lường"; `App` render tách như fractions. Guard chống thoát đã có sẵn.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 + lucide-react + canvas-confetti + Vitest.

**Spec:** `docs/superpowers/specs/2026-08-11-measurement-grade4-design.md`
**Nhánh:** tạo `feat/measurement-grade4` từ `main`.

---

## File Structure
- Create `src/lib/units.ts` (+ `.test.ts`) — dữ liệu đơn vị (4 đại lượng, các chuỗi).
- Create `src/lib/measurementProblems.ts` (+ `.test.ts`) — sinh đề + chấm.
- Create `src/components/games/MeasurementGame.tsx` — mini-game.
- Modify `src/types.ts` — thêm `'measurement'` vào `GameMode`.
- Modify `src/App.tsx` — render + effect exclusions cho `'measurement'`.
- Modify `src/components/StartScreen.tsx` — ô "Đo Lường" trong lưới Lớp 4.

Cổng kiểm: logic thuần `npm test`; UI/App `npm run lint` + `npm run build` + chơi thử.

---

## Task 1: `units.ts`

**Files:** Create `src/lib/units.ts`, `src/lib/units.test.ts`

- [ ] **Step 1: Test**

Create `src/lib/units.test.ts`:
```ts
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
```

- [ ] **Step 2: Chạy — FAIL**

Run: `npm test` — Expected: FAIL (no `./units.ts`).

- [ ] **Step 3: Viết `units.ts`**

Create `src/lib/units.ts`:
```ts
export interface Unit { label: string; base: number }
export type Chain = Unit[];
export interface Measure { name: string; chains: Chain[] }

export const MEASURES: Measure[] = [
  { name: 'Khối lượng', chains: [[
    { label: 'g', base: 1 }, { label: 'kg', base: 1000 }, { label: 'yến', base: 10000 },
    { label: 'tạ', base: 100000 }, { label: 'tấn', base: 1000000 },
  ]] },
  { name: 'Diện tích', chains: [[
    { label: 'mm²', base: 1 }, { label: 'cm²', base: 100 }, { label: 'dm²', base: 10000 },
    { label: 'm²', base: 1000000 },
  ]] },
  { name: 'Độ dài', chains: [[
    { label: 'mm', base: 1 }, { label: 'cm', base: 10 }, { label: 'dm', base: 100 },
    { label: 'm', base: 1000 }, { label: 'km', base: 1000000 },
  ]] },
  { name: 'Thời gian', chains: [
    [{ label: 'giây', base: 1 }, { label: 'phút', base: 60 }, { label: 'giờ', base: 3600 }, { label: 'ngày', base: 86400 }],
    [{ label: 'năm', base: 1 }, { label: 'thế kỉ', base: 100 }],
  ] },
];
```

- [ ] **Step 4: Chạy — PASS**

Run: `npm test` — Expected: units tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/units.ts src/lib/units.test.ts
git commit -m "feat: measurement units data"
```

---

## Task 2: `measurementProblems.ts`

**Files:** Create `src/lib/measurementProblems.ts`, `src/lib/measurementProblems.test.ts`

- [ ] **Step 1: Test**

Create `src/lib/measurementProblems.test.ts`:
```ts
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
```

- [ ] **Step 2: Chạy — FAIL**

Run: `npm test` — Expected: FAIL (no `./measurementProblems.ts`).

- [ ] **Step 3: Viết `measurementProblems.ts`**

Create `src/lib/measurementProblems.ts`:
```ts
import { MEASURES, type Chain, type Unit } from './units.ts';

export type MeasureSkill = 'convert' | 'compare' | 'compound';
export interface MeasurementProblem {
  skill: MeasureSkill;
  measure: string;
  prompt: string;
  answerType: 'number' | 'choice3';
  parts?: string;
  toUnit?: string;
  left?: string;
  right?: string;
  answer: number | string;
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const rand = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const ALL: MeasureSkill[] = ['convert', 'compare', 'compound'];

function pickPair(chain: Chain): [Unit, Unit] {
  const i = rint(0, chain.length - 1);
  let j = i;
  while (j === i) j = Math.max(0, Math.min(chain.length - 1, i + rand([-2, -1, 1, 2])));
  return [chain[i], chain[j]];
}

export function generateMeasurementProblem(skill: MeasureSkill | 'mix'): MeasurementProblem {
  const sk = skill === 'mix' ? rand(ALL) : skill;
  const measure = rand(MEASURES);

  if (sk === 'compare') {
    const chain = rand(measure.chains);
    const [u1, u2] = pickPair(chain);
    const q1 = rint(1, 12), q2 = rint(1, 12);
    const a = q1 * u1.base, b = q2 * u2.base;
    return {
      skill: 'compare', measure: measure.name, prompt: 'Điền dấu thích hợp', answerType: 'choice3',
      left: `${q1} ${u1.label}`, right: `${q2} ${u2.label}`, answer: a < b ? '<' : a > b ? '>' : '=',
    };
  }

  if (sk === 'compound') {
    const chain = measure.chains.find((c) => c.length >= 3);
    if (!chain) return generateMeasurementProblem('convert');
    const t = rint(0, chain.length - 3);
    const target = chain[t], small = chain[t + 1], big = chain[t + 2];
    const q1 = rint(1, 9), q2 = rint(1, 9);
    const answer = q1 * (big.base / target.base) + q2 * (small.base / target.base);
    return {
      skill: 'compound', measure: measure.name, prompt: 'Đổi ra đơn vị trong ô', answerType: 'number',
      parts: `${q1} ${big.label} ${q2} ${small.label}`, toUnit: target.label, answer,
    };
  }

  // convert
  const chain = rand(measure.chains);
  const [x, y] = pickPair(chain);
  const from = x.base >= y.base ? x : y;
  const to = x.base >= y.base ? y : x;
  if (Math.random() < 0.7) {
    const q = rint(2, 9);
    return {
      skill: 'convert', measure: measure.name, prompt: 'Đổi đơn vị', answerType: 'number',
      parts: `${q} ${from.label}`, toUnit: to.label, answer: q * (from.base / to.base),
    };
  }
  const k = rint(2, 9);
  const q = k * (from.base / to.base);
  return {
    skill: 'convert', measure: measure.name, prompt: 'Đổi đơn vị', answerType: 'number',
    parts: `${q} ${to.label}`, toUnit: from.label, answer: k,
  };
}

export function checkMeasurementAnswer(p: MeasurementProblem, input: number | string): boolean {
  return input === p.answer;
}
```

- [ ] **Step 4: Chạy — PASS**

Run: `npm test` — Expected: measurement problem tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/measurementProblems.ts src/lib/measurementProblems.test.ts
git commit -m "feat: measurement problem generator and checker"
```

---

## Task 3: `MeasurementGame.tsx`

**Files:** Create `src/components/games/MeasurementGame.tsx`

Mirror `src/components/games/FractionGame.tsx` (đồng hồ 30s/câu, `locked`, `advanceRef`,
tạm dừng khi ẩn tab) nhưng đơn giản hơn (chỉ `number` + `choice3`).

- [ ] **Step 1: Viết component**

Create `src/components/games/MeasurementGame.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import GameHUD from '../GameHUD.tsx';
import NumberPad from '../NumberPad.tsx';
import { playSound } from '../../lib/audio.ts';
import {
  generateMeasurementProblem, checkMeasurementAnswer,
  type MeasurementProblem, type MeasureSkill,
} from '../../lib/measurementProblems.ts';

const QTIME = 30;
const SKILLS: { key: MeasureSkill | 'mix'; label: string }[] = [
  { key: 'mix', label: 'Tổng hợp' },
  { key: 'convert', label: 'Đổi đơn vị' },
  { key: 'compare', label: 'So sánh' },
  { key: 'compound', label: 'Đổi ghép' },
];

interface MeasurementGameProps { onExit: () => void }

export default function MeasurementGame({ onExit }: MeasurementGameProps) {
  const [skill, setSkill] = useState<MeasureSkill | 'mix'>('mix');
  const [problem, setProblem] = useState<MeasurementProblem>(() => generateMeasurementProblem('mix'));
  const [val, setVal] = useState('');
  const [cmpChoice, setCmpChoice] = useState('');
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QTIME);
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [shake, setShake] = useState(false);

  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const advanceRef = useRef<number | null>(null);

  const startProblem = (sk: MeasureSkill | 'mix') => {
    if (advanceRef.current !== null) { clearTimeout(advanceRef.current); advanceRef.current = null; }
    setProblem(generateMeasurementProblem(sk));
    setVal(''); setCmpChoice(''); setMsg(null); setTimeLeft(QTIME); setLocked(false);
  };

  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [locked, problem]);

  useEffect(() => {
    if (timeLeft === 0 && !lockedRef.current) {
      setLocked(true);
      setWrong((w) => w + 1);
      setTotal((n) => n + 1);
      setMsg({ text: 'Hết giờ! ⏰ (tính là sai)', ok: false });
      playSound('wrong');
      advanceRef.current = window.setTimeout(() => startProblem(skill), 1200);
      return () => { if (advanceRef.current !== null) { clearTimeout(advanceRef.current); advanceRef.current = null; } };
    }
  }, [timeLeft, skill]);

  const finishCorrect = () => {
    setLocked(true);
    setRight((r) => r + 1);
    setTotal((n) => n + 1);
    setMsg({ text: 'Đúng rồi! 🎉', ok: true });
    playSound('correct');
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.7 } });
    advanceRef.current = window.setTimeout(() => startProblem(skill), 850);
  };

  const wrongTry = () => {
    setMsg({ text: 'Chưa đúng, thử lại nhé', ok: false });
    playSound('wrong');
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  };

  const submit = (input: number | string) => {
    if (locked) return;
    if (checkMeasurementAnswer(problem, input)) finishCorrect();
    else wrongTry();
  };

  const onPad = (k: string) => {
    if (locked) return;
    if (k === 'ok') { if (val !== '') submit(parseInt(val, 10)); return; }
    if (k === 'del') { setVal((v) => v.slice(0, -1)); return; }
    setVal((v) => (v.length < 7 ? (v + k).replace(/^0(?=\d)/, '') : v));
  };

  const chooseSkill = (k: MeasureSkill | 'mix') => { setSkill(k); startProblem(k); };

  const p = problem;

  return (
    <div className="w-full max-w-2xl">
      <GameHUD totalCount={total} wrongCount={wrong} score={right} timeLeft={timeLeft} onExit={onExit} />

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {SKILLS.map((s) => (
          <button
            key={s.key}
            onClick={() => chooseSkill(s.key)}
            className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${skill === s.key ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-500'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-teal-200 min-h-[420px] flex flex-col items-center justify-center">
        <div className="text-sm font-bold text-slate-400 mb-1">{p.measure}</div>
        <h3 className="text-xl font-bold text-gray-500 mb-6">{p.prompt}</h3>

        <div className={`flex items-center justify-center gap-3 flex-wrap min-h-[90px] text-3xl font-extrabold text-slate-700 ${shake ? 'animate-[wiggle_0.4s]' : ''}`}>
          {p.answerType === 'choice3' ? (
            <>
              <span>{p.left}</span>
              <span className="min-w-[56px] min-h-[56px] border-[3px] border-dashed border-teal-200 rounded-xl inline-flex items-center justify-center text-teal-700">{cmpChoice}</span>
              <span>{p.right}</span>
            </>
          ) : (
            <>
              <span>{p.parts}</span>
              <span>=</span>
              <span className="min-w-[78px] min-h-[52px] px-3 inline-flex items-center justify-center border-[3px] border-teal-200 rounded-xl bg-white text-teal-700">
                {val || <span className="text-teal-200">?</span>}
              </span>
              <span className="text-teal-600 text-2xl">{p.toUnit}</span>
            </>
          )}
        </div>

        <div className="min-h-[28px] mt-3 font-extrabold text-lg" style={{ color: msg?.ok ? '#16a34a' : '#ef4444' }}>{msg?.text ?? ''}</div>

        <div className="mt-4">
          {p.answerType === 'choice3' ? (
            <div className="flex gap-3">
              {['<', '=', '>'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setCmpChoice(s); submit(s); }}
                  className="w-16 h-16 rounded-2xl border-[3px] border-teal-200 bg-white text-3xl font-extrabold text-teal-700 hover:bg-teal-50"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <NumberPad onKey={onPad} />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint` — Expected: no errors. (`@keyframes wiggle` đã có sẵn trong `src/index.css`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/games/MeasurementGame.tsx
git commit -m "feat: MeasurementGame self-contained mini-game"
```

---

## Task 4: Tích hợp (`types`, `App`, `StartScreen`)

**Files:** Modify `src/types.ts`, `src/App.tsx`, `src/components/StartScreen.tsx`

- [ ] **Step 1: Thêm mode**

Trong `src/types.ts`, đổi dòng cuối union:
```ts
  | 'fractions';
```
thành:
```ts
  | 'fractions'
  | 'measurement';
```

- [ ] **Step 2: Import MeasurementGame trong App**

Sau `import FractionGame from './components/games/FractionGame.tsx';` thêm:
```ts
import MeasurementGame from './components/games/MeasurementGame.tsx';
```

- [ ] **Step 3: startGame — nhánh measurement không sinh Question**

Thay khối:
```ts
    } else if (selectedMode === 'fractions') {
      // FractionGame tự quản đề/đồng hồ/điểm — không sinh Question ở đây
    } else {
```
bằng:
```ts
    } else if (selectedMode === 'fractions' || selectedMode === 'measurement') {
      // FractionGame/MeasurementGame tự quản đề/đồng hồ/điểm — không sinh Question ở đây
    } else {
```

- [ ] **Step 4: Loại measurement khỏi 2 effect dùng chung**

Effect auto-next: thêm `&& mode !== 'measurement'`:
```ts
    if (gameState === 'playing' && !question && mode !== 'letters' && mode !== 'spelling' && mode !== 'fractions' && mode !== 'measurement') {
```
Effect đồng hồ chung — cả hai nhánh, thêm `&& mode !== 'measurement'`:
```ts
    if (gameState === 'playing' && timeLeft > 0 && !feedback && mode !== 'letters' && mode !== 'fractions' && mode !== 'measurement') {
```
```ts
    } else if (timeLeft === 0 && gameState === 'playing' && mode !== 'letters' && mode !== 'fractions' && mode !== 'measurement') {
```

- [ ] **Step 5: Render branch cho measurement**

Thay khối:
```tsx
            {gameState === 'playing' && (mode === 'fractions'
              ? <FractionGame onExit={resetToHome} />
              : renderPlaying())}
```
bằng:
```tsx
            {gameState === 'playing' && (mode === 'fractions'
              ? <FractionGame onExit={resetToHome} />
              : mode === 'measurement'
              ? <MeasurementGame onExit={resetToHome} />
              : renderPlaying())}
```

- [ ] **Step 6: StartScreen — thêm ô "Đo Lường" + icon**

(a) Thêm `Ruler` vào danh sách import từ `lucide-react` (vị trí bất kỳ trong khối
import đó — thứ tự không quan trọng). Ví dụ chèn ngay sau dòng `Divide,`:
```ts
  Divide,
  Ruler,
```
(b) Trong lưới Lớp 4 (`{level === 'lop_4' && (<div className="grid ...">`), thêm ô "Đo Lường"
ngay sau nút "Phân Số" (sau `</button>` của Phân Số, trước `</div>` đóng lưới):
```tsx
          <button
            onClick={() => onStart('measurement')}
            className="group flex flex-col items-center p-6 bg-teal-100 hover:bg-teal-200 rounded-2xl transition-all border-b-8 border-teal-300 active:border-b-0 active:translate-y-2"
          >
            <div className="bg-teal-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
              <Ruler size={48} />
            </div>
            <span className="text-2xl font-bold text-teal-700">Đo Lường</span>
            <span className="text-sm text-teal-600 mt-2">Toán lớp 4</span>
          </button>
```

- [ ] **Step 7: Lint + build**

Run: `npm run lint && npm run build` — Expected: no TS errors; build thành công.

- [ ] **Step 8: Commit**

```bash
git add src/types.ts src/App.tsx src/components/StartScreen.tsx
git commit -m "feat: wire MeasurementGame into App and Lớp 4 start screen"
```

---

## Task 5: Kiểm thử toàn diện

- [ ] **Step 1: Test + lint + build**

Run: `npm test && npm run lint && npm run build`
Expected: tất cả test pass (units + measurementProblems + các test cũ); tsc sạch; build ok.

- [ ] **Step 2: Chơi thử thủ công**

`npm run dev`, đặt lớp = **Lớp 4**:
- `StartScreen` hiện 2 ô: **Phân Số** và **Đo Lường**.
- Vào Đo Lường: chọn dạng (chip); dòng nhỏ trên câu hỏi cho biết loại đại lượng.
  - Đổi đơn vị: `5 yến = [ô] kg` → bàn phím số → ✓.
  - So sánh: `5 tạ ▢ 6 yến` → bấm `< = >`.
  - Đổi ghép: `2 tấn 5 tạ = [ô] kg` → nhập số.
  - Thử đủ 4 đại lượng (khối lượng/diện tích/thời gian/độ dài); kiểm số ra nguyên, hợp lý.
- HUD Đúng/Sai/Tổng; đồng hồ 30s/câu; hết giờ → Sai + câu mới; sai chủ động → thử lại.
- Đổi tab → đồng hồ dừng; Back → modal thoát; ✕ Thoát → về màn chính; refresh → cảnh báo.
- Game Phân Số + game mầm non vẫn chạy bình thường.

- [ ] **Step 3: Commit (nếu chỉnh nhỏ)**

```bash
git add -A
git commit -m "test: manual verification for measurement game"
```

---

## Ghi chú
- Logic vòng chơi/đồng hồ lặp từ `FractionGame` (nợ kỹ thuật) — tách hook chung ở game lớp 4 thứ 3.
- Guard chống thoát nhầm đã có ở App, tự áp cho measurement.
