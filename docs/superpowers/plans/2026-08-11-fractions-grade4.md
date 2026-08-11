# Game Phân Số (lớp 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm game luyện Phân số (Toán lớp 4) hiển thị khi lớp = Lớp 4, kèm lọc game theo lớp và cơ chế chống thoát nhầm cho mọi game.

**Architecture:** Logic phân số thuần (`fractions.ts`) + sinh/chấm đề (`fractionProblems.ts`) đều test bằng Vitest. UI: `Fraction`, `NumberPad`, và `FractionGame` (mini-game tự quản đồng hồ 30s/câu + tính điểm, dùng lại `GameHUD`). `StartScreen` lọc ô game theo `ClassLevel`. `App` render `FractionGame` tách khỏi pipeline chung và thêm guard chống thoát nhầm (chặn back/vuốt, beforeunload, tạm dừng khi ẩn tab).

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 + lucide-react + Vitest.

**Spec:** `docs/superpowers/specs/2026-08-11-fractions-grade4-design.md`
**Nhánh:** xây tiếp trên `feat/entry-class-selection` (có `ClassLevel` + `childClass`).

---

## File Structure

- Create `src/lib/fractions.ts` (+ `.test.ts`) — số học phân số thuần.
- Create `src/lib/fractionProblems.ts` (+ `.test.ts`) — sinh đề + chấm.
- Create `src/components/Fraction.tsx` — hiển thị 1 phân số.
- Create `src/components/NumberPad.tsx` — bàn phím số dùng chung.
- Create `src/components/games/FractionGame.tsx` — mini-game phân số.
- Create `src/components/ExitConfirm.tsx` — modal xác nhận thoát (cho back/vuốt).
- Modify `src/types.ts` — thêm `'fractions'` vào `GameMode`.
- Modify `src/components/StartScreen.tsx` — lọc ô game theo lớp.
- Modify `src/App.tsx` — render FractionGame + guard chống thoát nhầm.

Cổng kiểm: logic thuần dùng `npm test` (Vitest); UI/App dùng `npm run lint` + `npm run build` + chơi thử.

---

## Task 1: Thư viện phân số `fractions.ts`

**Files:**
- Create: `src/lib/fractions.ts`
- Test: `src/lib/fractions.test.ts`

- [ ] **Step 1: Viết test**

Create `src/lib/fractions.test.ts`:
```ts
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
```

- [ ] **Step 2: Chạy test — FAIL**

Run: `npm test`
Expected: FAIL — không tìm thấy `./fractions.ts`.

- [ ] **Step 3: Viết `fractions.ts`**

Create `src/lib/fractions.ts`:
```ts
export interface Fraction { num: number; den: number }

export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}

export function simplify(f: Fraction): Fraction {
  const s = f.den < 0 ? -1 : 1;
  const num = f.num * s, den = f.den * s;
  const k = gcd(num, den);
  return { num: num / k, den: den / k };
}

export function add(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
}
export function sub(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
}
export function mul(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.num, den: a.den * b.den });
}
export function divide(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den, den: a.den * b.num });
}

export function compareFrac(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const d = a.num * b.den - b.num * a.den;
  return d < 0 ? -1 : d > 0 ? 1 : 0;
}
export function fracEquals(a: Fraction, b: Fraction): boolean {
  return a.num * b.den === b.num * a.den;
}
export function fractionOfNumber(f: Fraction, n: number): number {
  return (f.num * n) / f.den;
}
```

- [ ] **Step 4: Chạy test — PASS**

Run: `npm test`
Expected: các test fractions pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fractions.ts src/lib/fractions.test.ts
git commit -m "feat: fraction arithmetic library"
```

---

## Task 2: Sinh đề + chấm `fractionProblems.ts`

**Files:**
- Create: `src/lib/fractionProblems.ts`
- Test: `src/lib/fractionProblems.test.ts`

- [ ] **Step 1: Viết test**

Create `src/lib/fractionProblems.test.ts`:
```ts
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
```

- [ ] **Step 2: Chạy test — FAIL**

Run: `npm test`
Expected: FAIL — không tìm thấy `./fractionProblems.ts`.

- [ ] **Step 3: Viết `fractionProblems.ts`**

Create `src/lib/fractionProblems.ts`:
```ts
import {
  add, sub, mul, divide, compareFrac, fracEquals, gcd,
  type Fraction,
} from './fractions.ts';

export type FractionSkill = 'recognize' | 'simplify' | 'compare' | 'addsub' | 'muldiv' | 'fracof';
export type AnswerType = 'choice' | 'choice3' | 'fraction' | 'integer';

export interface FractionProblem {
  skill: FractionSkill;
  prompt: string;
  operands: Fraction[];
  op?: '+' | '−' | '×' | '÷';
  ofNum?: number;
  shaded?: number;
  total?: number;
  answerType: AnswerType;
  answer: Fraction | number | string;
  options?: string[];
  strict?: boolean;
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const shuffle = <T>(a: T[]): T[] =>
  a.map((x) => [Math.random(), x] as [number, T]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

const ALL: FractionSkill[] = ['recognize', 'simplify', 'compare', 'addsub', 'muldiv', 'fracof'];

export function generateFractionProblem(skill: FractionSkill | 'mix'): FractionProblem {
  const sk = skill === 'mix' ? ALL[rint(0, ALL.length - 1)] : skill;

  if (sk === 'recognize') {
    const total = rint(2, 8), shaded = rint(1, total);
    const answer = `${shaded}/${total}`;
    const opts = new Set<string>([answer]);
    while (opts.size < 4) opts.add(`${rint(1, 9)}/${rint(2, 9)}`);
    return { skill: 'recognize', prompt: 'Hình đã tô mấy phần?', operands: [], shaded, total, answerType: 'choice', answer, options: shuffle([...opts]) };
  }
  if (sk === 'simplify') {
    let b = rint(2, 9), a = rint(1, b - 1);
    while (gcd(a, b) !== 1) { b = rint(2, 9); a = rint(1, b - 1); }
    const k = rint(2, 4);
    return { skill: 'simplify', prompt: 'Rút gọn phân số về tối giản', operands: [{ num: a * k, den: b * k }], answerType: 'fraction', answer: { num: a, den: b }, strict: true };
  }
  if (sk === 'compare') {
    const f1 = { num: rint(1, 7), den: rint(2, 8) }, f2 = { num: rint(1, 7), den: rint(2, 8) };
    const c = compareFrac(f1, f2);
    return { skill: 'compare', prompt: 'Điền dấu thích hợp', operands: [f1, f2], answerType: 'choice3', answer: c < 0 ? '<' : c > 0 ? '>' : '=' };
  }
  if (sk === 'addsub') {
    const plus = Math.random() < 0.5;
    let f1 = { num: rint(1, 6), den: rint(2, 8) }, f2 = { num: rint(1, 6), den: rint(2, 8) };
    if (!plus && compareFrac(f1, f2) < 0) { const t = f1; f1 = f2; f2 = t; }
    return { skill: 'addsub', prompt: 'Tính kết quả', operands: [f1, f2], op: plus ? '+' : '−', answerType: 'fraction', answer: plus ? add(f1, f2) : sub(f1, f2) };
  }
  if (sk === 'muldiv') {
    const times = Math.random() < 0.5;
    const f1 = { num: rint(1, 6), den: rint(2, 7) }, f2 = { num: rint(1, 6), den: rint(2, 7) };
    return { skill: 'muldiv', prompt: 'Tính kết quả', operands: [f1, f2], op: times ? '×' : '÷', answerType: 'fraction', answer: times ? mul(f1, f2) : divide(f1, f2) };
  }
  const b = rint(2, 6), a = rint(1, b - 1), m = rint(2, 6), n = b * m;
  return { skill: 'fracof', prompt: 'Tìm phân số của một số', operands: [{ num: a, den: b }], ofNum: n, answerType: 'integer', answer: (a * n) / b };
}

export function checkFractionAnswer(p: FractionProblem, input: Fraction | number | string): boolean {
  if (p.answerType === 'choice' || p.answerType === 'choice3') return input === p.answer;
  if (p.answerType === 'integer') return input === p.answer;
  const f = input as Fraction;
  if (!f || !f.den || Number.isNaN(f.num) || Number.isNaN(f.den)) return false;
  const ans = p.answer as Fraction;
  if (p.strict) return f.num === ans.num && f.den === ans.den;
  return fracEquals(f, ans);
}
```

- [ ] **Step 4: Chạy test — PASS**

Run: `npm test`
Expected: các test fractionProblems pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fractionProblems.ts src/lib/fractionProblems.test.ts
git commit -m "feat: fraction problem generator and answer checker"
```

---

## Task 3: Component `Fraction` + `NumberPad`

**Files:**
- Create: `src/components/Fraction.tsx`
- Create: `src/components/NumberPad.tsx`

- [ ] **Step 1: Viết `Fraction.tsx`**

Create `src/components/Fraction.tsx`:
```tsx
interface FractionProps {
  num: number | string;
  den: number | string;
  size?: 'sm' | 'lg';
}

export default function Fraction({ num, den, size = 'lg' }: FractionProps) {
  const t = size === 'lg' ? 'text-4xl' : 'text-2xl';
  return (
    <span className="inline-flex flex-col items-center font-serif font-bold leading-none align-middle">
      <span className={`px-2 ${t}`}>{num}</span>
      <span className="h-[3px] bg-current w-full min-w-[34px] my-1" />
      <span className={`px-2 ${t}`}>{den}</span>
    </span>
  );
}
```

- [ ] **Step 2: Viết `NumberPad.tsx`**

Create `src/components/NumberPad.tsx`:
```tsx
interface NumberPadProps {
  onKey: (k: string) => void; // '0'..'9' | 'del' | 'ok'
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];

export default function NumberPad({ onKey }: NumberPadProps) {
  const label = (k: string) => (k === 'del' ? '⌫' : k === 'ok' ? '✓' : k);
  return (
    <div className="grid grid-cols-3 gap-2 w-[220px]">
      {KEYS.map((k) => (
        <button
          key={k}
          onClick={() => onKey(k)}
          className={`h-14 rounded-xl border-2 text-2xl font-extrabold transition-colors ${
            k === 'ok'
              ? 'bg-green-500 text-white border-green-600'
              : k === 'del'
              ? 'bg-red-50 text-red-500 border-red-200'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          {label(k)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Fraction.tsx src/components/NumberPad.tsx
git commit -m "feat: Fraction display and NumberPad components"
```

---

## Task 4: `FractionGame.tsx`

**Files:**
- Create: `src/components/games/FractionGame.tsx`

- [ ] **Step 1: Viết component**

Create `src/components/games/FractionGame.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import GameHUD from '../GameHUD.tsx';
import NumberPad from '../NumberPad.tsx';
import Fraction from '../Fraction.tsx';
import { playSound } from '../../lib/audio.ts';
import {
  generateFractionProblem, checkFractionAnswer,
  type FractionProblem, type FractionSkill,
} from '../../lib/fractionProblems.ts';

const QTIME = 30;
const SKILLS: { key: FractionSkill | 'mix'; label: string }[] = [
  { key: 'mix', label: 'Tổng hợp' },
  { key: 'recognize', label: 'Nhận biết' },
  { key: 'simplify', label: 'Rút gọn' },
  { key: 'compare', label: 'So sánh' },
  { key: 'addsub', label: 'Cộng/Trừ' },
  { key: 'muldiv', label: 'Nhân/Chia' },
  { key: 'fracof', label: 'PS của số' },
];

interface FractionGameProps { onExit: () => void }

export default function FractionGame({ onExit }: FractionGameProps) {
  const [skill, setSkill] = useState<FractionSkill | 'mix'>('mix');
  const [problem, setProblem] = useState<FractionProblem>(() => generateFractionProblem('mix'));
  const [num, setNum] = useState('');
  const [den, setDen] = useState('');
  const [val, setVal] = useState('');
  const [active, setActive] = useState<'num' | 'den'>('num');
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QTIME);
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [shake, setShake] = useState(false);
  const [cmpChoice, setCmpChoice] = useState('');

  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const startProblem = (sk: FractionSkill | 'mix') => {
    setProblem(generateFractionProblem(sk));
    setNum(''); setDen(''); setVal(''); setActive('num');
    setMsg(null); setTimeLeft(QTIME); setLocked(false); setCmpChoice('');
  };

  // đồng hồ: giảm mỗi giây khi không khoá; TẠM DỪNG khi ẩn tab (document.hidden)
  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [locked, problem]);

  // hết giờ → tính Sai + sang câu mới
  useEffect(() => {
    if (timeLeft === 0 && !lockedRef.current) {
      setLocked(true);
      setWrong((w) => w + 1);
      setTotal((n) => n + 1);
      setMsg({ text: 'Hết giờ! ⏰ (tính là sai)', ok: false });
      playSound('wrong');
      const id = window.setTimeout(() => startProblem(skill), 1200);
      return () => clearTimeout(id);
    }
  }, [timeLeft, skill]);

  const finishCorrect = () => {
    setLocked(true);
    setRight((r) => r + 1);
    setTotal((n) => n + 1);
    setMsg({ text: 'Đúng rồi! 🎉', ok: true });
    playSound('correct');
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.7 } });
    window.setTimeout(() => startProblem(skill), 850);
  };

  const wrongTry = () => {
    setMsg({ text: 'Chưa đúng, thử lại nhé', ok: false });
    playSound('wrong');
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  };

  const submitAnswer = (input: any) => {
    if (locked) return;
    if (checkFractionAnswer(problem, input)) finishCorrect();
    else wrongTry();
  };

  const onPad = (k: string) => {
    if (locked) return;
    if (k === 'ok') {
      if (problem.answerType === 'integer') { if (val !== '') submitAnswer(parseInt(val, 10)); }
      else if (num !== '' && den !== '') submitAnswer({ num: parseInt(num, 10), den: parseInt(den, 10) });
      return;
    }
    const set = (v: string, s: (x: string) => void) => {
      if (k === 'del') s(v.slice(0, -1));
      else if (v.length < 3) s((v + k).replace(/^0(?=\d)/, ''));
    };
    if (problem.answerType === 'integer') set(val, setVal);
    else if (active === 'num') { set(num, setNum); if (k !== 'del' && num === '') setActive('den'); }
    else set(den, setDen);
  };

  const chooseSkill = (k: FractionSkill | 'mix') => { setSkill(k); startProblem(k); };

  const p = problem;
  const opDisplay = p.op ?? '';
  const cellBase = 'inline-flex flex-col items-center align-middle';
  const cell = (v: string, on: boolean, onClick?: () => void) => (
    <span onClick={onClick} className={`min-w-[60px] min-h-[46px] px-2 flex items-center justify-center border-[3px] rounded-lg text-3xl font-extrabold text-indigo-700 cursor-pointer ${on ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_0_3px_#c7d2fe]' : 'border-indigo-200 bg-white'}`}>
      {v || <span className="text-indigo-200">?</span>}
    </span>
  );

  const fractionInput = (
    <span className={cellBase}>
      {cell(num, active === 'num', () => setActive('num'))}
      <span className="h-[3px] bg-indigo-700 w-[66px] my-1" />
      {cell(den, active === 'den', () => setActive('den'))}
    </span>
  );

  return (
    <div className="w-full max-w-2xl">
      <GameHUD totalCount={total} wrongCount={wrong} score={right} timeLeft={timeLeft} onExit={onExit} />

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {SKILLS.map((s) => (
          <button
            key={s.key}
            onClick={() => chooseSkill(s.key)}
            className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${skill === s.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-500'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200 min-h-[420px] flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-gray-500 mb-6">{p.prompt}</h3>

        <div className={`flex items-center justify-center gap-3 flex-wrap min-h-[120px] ${shake ? 'animate-[wiggle_0.4s]' : ''}`}>
          {p.skill === 'recognize' && (
            <div className="flex gap-1">
              {Array.from({ length: p.total ?? 0 }).map((_, i) => (
                <span key={i} className={`w-7 h-7 rounded border-2 border-indigo-500 ${i < (p.shaded ?? 0) ? 'bg-indigo-500' : ''}`} />
              ))}
            </div>
          )}
          {p.skill === 'compare' && (
            <>
              <Fraction num={p.operands[0].num} den={p.operands[0].den} />
              <span className="min-w-[56px] min-h-[56px] border-[3px] border-dashed border-indigo-200 rounded-xl inline-flex items-center justify-center text-4xl font-extrabold text-indigo-700">{cmpChoice}</span>
              <Fraction num={p.operands[1].num} den={p.operands[1].den} />
            </>
          )}
          {p.skill === 'fracof' && (
            <>
              <Fraction num={p.operands[0].num} den={p.operands[0].den} />
              <span className="text-3xl font-extrabold text-indigo-700">của {p.ofNum}</span>
              <span className="text-4xl font-extrabold">=</span>
              {cell(val, true)}
            </>
          )}
          {(p.skill === 'addsub' || p.skill === 'muldiv') && (
            <>
              <Fraction num={p.operands[0].num} den={p.operands[0].den} />
              <span className="text-4xl font-extrabold text-indigo-500">{opDisplay}</span>
              <Fraction num={p.operands[1].num} den={p.operands[1].den} />
              <span className="text-4xl font-extrabold">=</span>
              {fractionInput}
            </>
          )}
          {p.skill === 'simplify' && (
            <>
              <Fraction num={p.operands[0].num} den={p.operands[0].den} />
              <span className="text-4xl font-extrabold">=</span>
              {fractionInput}
            </>
          )}
        </div>

        <div className="min-h-[28px] mt-3 font-extrabold text-lg" style={{ color: msg?.ok ? '#16a34a' : '#ef4444' }}>{msg?.text ?? ''}</div>

        <div className="mt-4">
          {p.skill === 'recognize' && (
            <div className="grid grid-cols-4 gap-3 max-w-[420px]">
              {p.options!.map((o) => {
                const [n, d] = o.split('/');
                return (
                  <button key={o} onClick={() => submitAnswer(o)} className="border-[3px] border-indigo-200 rounded-2xl bg-white p-3 hover:bg-indigo-50">
                    <Fraction num={n} den={d} size="sm" />
                  </button>
                );
              })}
            </div>
          )}
          {p.skill === 'compare' && (
            <div className="flex gap-3">
              {['<', '=', '>'].map((s) => (
                <button key={s} onClick={() => { setCmpChoice(s); submitAnswer(s); }} className="w-16 h-16 rounded-2xl border-[3px] border-indigo-200 bg-white text-3xl font-extrabold text-indigo-700 hover:bg-indigo-50">{s}</button>
              ))}
            </div>
          )}
          {(p.skill === 'simplify' || p.skill === 'addsub' || p.skill === 'muldiv' || p.skill === 'fracof') && (
            <NumberPad onKey={onPad} />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Đảm bảo keyframes `wiggle` tồn tại**

`@keyframes wiggle` đã được thêm ở `src/index.css` (từ game Đánh Vần). Kiểm tra có; nếu chưa, thêm:
```css
@keyframes wiggle { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/games/FractionGame.tsx src/index.css
git commit -m "feat: FractionGame self-contained mini-game with 30s/question timer"
```

---

## Task 5: Tích hợp game + lọc theo lớp (`types`, `App`, `StartScreen`)

**Files:**
- Modify: `src/types.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/StartScreen.tsx`

- [ ] **Step 1: Thêm mode `'fractions'`**

Trong `src/types.ts`, thêm `| 'fractions'` vào cuối union `GameMode`:
```ts
  | 'spelling'
  | 'fractions';
```

- [ ] **Step 2: Import FractionGame + ClassLevel trong App**

Trong `src/App.tsx`, sau `import SpellingGame ...` thêm:
```ts
import FractionGame from './components/games/FractionGame.tsx';
```
(`ClassLevel` đã được import sẵn từ feature chọn lớp.)

- [ ] **Step 3: `startGame` — nhánh fractions không sinh câu hỏi**

Trong `startGame`, thêm nhánh (trước `else` cuối):
```ts
    } else if (selectedMode === 'spelling') {
      const round = generateSpellingRound();
      setSpellingRound(round);
      speakText(round.syllable);
    } else if (selectedMode === 'fractions') {
      // FractionGame tự quản đề/đồng hồ/điểm — không sinh Question ở đây
    } else {
```

- [ ] **Step 4: Loại fractions khỏi 2 effect dùng chung**

Effect auto-next (khoảng dòng 177-181): đổi điều kiện thành:
```ts
    if (gameState === 'playing' && !question && mode !== 'letters' && mode !== 'spelling' && mode !== 'fractions') {
```
Effect đồng hồ chung (khoảng dòng 183-193): đổi cả hai nhánh `mode !== 'letters'` thành `mode !== 'letters' && mode !== 'fractions'`, và thêm tạm dừng khi ẩn tab:
```ts
  useEffect(() => {
    let timer: number;
    if (gameState === 'playing' && timeLeft > 0 && !feedback && mode !== 'letters' && mode !== 'fractions') {
      timer = window.setInterval(() => {
        if (document.hidden) return;
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing' && mode !== 'letters' && mode !== 'fractions') {
      setGameState('end');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, feedback, mode]);
```

- [ ] **Step 5: Render FractionGame tách khỏi pipeline**

Thay dòng:
```tsx
            {gameState === 'playing' && renderPlaying()}
```
bằng:
```tsx
            {gameState === 'playing' && (mode === 'fractions'
              ? <FractionGame onExit={resetToHome} />
              : renderPlaying())}
```

- [ ] **Step 6: Truyền `level` vào StartScreen**

Trong JSX `<StartScreen ... />`, thêm prop:
```tsx
                onChangeName={() => setEditingSetup(true)}
                onChangeClass={() => setEditingSetup(true)}
                level={childClass || 'mam_non'}
```

- [ ] **Step 7: StartScreen — nhận `level`, import icon, lọc ô game**

Trong `src/components/StartScreen.tsx`:
(a) Thêm `import type { ClassLevel, GameMode, GameSettings, MathOperator } from '../types.ts';` — thêm `ClassLevel` vào dòng import type sẵn có.
(b) Thêm `Divide` vào import từ `lucide-react`:
```ts
  BookOpen,
  CheckCircle2,
  Divide,
  Gamepad2,
```
(c) Thêm prop vào interface + destructure:
```ts
  onChangeClass: () => void;
  level: ClassLevel;
```
```ts
export default function StartScreen({ name, settings, onSettingsChange, onStart, onChangeName, onChangeClass, level }: StartScreenProps) {
```
(d) **Bọc lưới ô game theo lớp.** Tìm dòng mở lưới:
```tsx
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```
Thay bằng (thêm lưới Lớp 4 + mở nhánh mầm non):
```tsx
      {level === 'lop_4' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => onStart('fractions')}
            className="group flex flex-col items-center p-6 bg-violet-100 hover:bg-violet-200 rounded-2xl transition-all border-b-8 border-violet-300 active:border-b-0 active:translate-y-2"
          >
            <div className="bg-violet-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
              <Divide size={48} />
            </div>
            <span className="text-2xl font-bold text-violet-700">Phân Số</span>
            <span className="text-sm text-violet-600 mt-2">Toán lớp 4</span>
          </button>
        </div>
      )}
      {level !== 'lop_4' && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```
(e) Đóng nhánh mầm non. Tìm phần cuối lưới — nút "Chữ Đầu Tiên" rồi `</div>` đóng lưới, ngay trước `</motion.div>`:
```tsx
          <span className="text-sm text-teal-600 mt-2">Chọn chữ cái đầu của tiếng</span>
        </button>
      </div>
    </motion.div>
```
Thay bằng (thêm `)}` đóng nhánh):
```tsx
          <span className="text-sm text-teal-600 mt-2">Chọn chữ cái đầu của tiếng</span>
        </button>
      </div>
      )}
    </motion.div>
```

- [ ] **Step 8: Lint + build**

Run: `npm run lint && npm run build`
Expected: no TS errors; build thành công.

- [ ] **Step 9: Commit**

```bash
git add src/types.ts src/App.tsx src/components/StartScreen.tsx
git commit -m "feat: wire FractionGame into App and filter games by class"
```

---

## Task 6: Chống thoát nhầm (mọi game) — `ExitConfirm` + guard trong App

**Files:**
- Create: `src/components/ExitConfirm.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Viết `ExitConfirm.tsx`**

Create `src/components/ExitConfirm.tsx`:
```tsx
interface ExitConfirmProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export default function ExitConfirm({ open, onStay, onLeave }: ExitConfirmProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl">
        <div className="text-5xl mb-2">🚪</div>
        <h3 className="text-xl font-bold text-gray-700">Thoát trò chơi?</h3>
        <p className="text-gray-500 mt-1">Kết quả lượt chơi sẽ không được lưu.</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onStay} className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200">Ở lại</button>
          <button onClick={onLeave} className="flex-1 py-3 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600">Thoát</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Import + state trong App**

Trong `src/App.tsx`, thêm import:
```ts
import ExitConfirm from './components/ExitConfirm.tsx';
```
Thêm state (cạnh các state khác, vd sau `spellingRound`):
```ts
  const [showExitConfirm, setShowExitConfirm] = useState(false);
```

- [ ] **Step 3: Effect guard khi đang chơi**

Thêm effect (sau effect đồng hồ):
```ts
  useEffect(() => {
    if (gameState !== 'playing') return;
    window.history.pushState({ game: true }, '');
    const onPop = () => setShowExitConfirm(true);
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('popstate', onPop);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [gameState]);
```

- [ ] **Step 4: Handler ở lại / thoát**

Thêm gần các handler khác:
```ts
  const stayInGame = () => {
    setShowExitConfirm(false);
    window.history.pushState({ game: true }, '');
  };
  const leaveGame = () => {
    setShowExitConfirm(false);
    resetToHome();
  };
```

- [ ] **Step 5: Render modal**

Ngay trước thẻ đóng `</div>` ngoài cùng của `return` (sau `<footer>...</footer>`), thêm:
```tsx
      <ExitConfirm open={showExitConfirm} onStay={stayInGame} onLeave={leaveGame} />
```

- [ ] **Step 6: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/ExitConfirm.tsx
git commit -m "feat: guard against accidental exit (back/swipe, close, tab-switch pause)"
```

---

## Task 7: Kiểm thử toàn diện

**Files:** (không sửa code)

- [ ] **Step 1: Test + lint + build**

Run:
```bash
npm test && npm run lint && npm run build
```
Expected: tất cả test pass (fractions + fractionProblems + các test cũ); tsc sạch; build thành công.

- [ ] **Step 2: Chơi thử thủ công**

`npm run dev`, mở http://localhost:3000. Đặt lớp = **Lớp 4** (màn đầu vào), rồi:
- `StartScreen` chỉ hiện ô **Phân Số** (không có game mầm non). Đổi lớp về Mầm non → hiện lại các game cũ.
- Vào Phân Số: chọn dạng (chip), thử từng dạng — nhận biết (chọn), rút gọn (nhập, 2/4 cho 1/2 → sai), so sánh (ô giữa điền dấu), cộng/trừ/nhân/chia (nhập sau dấu =, tương đương vẫn đúng), PS của số (nhập số).
- HUD: **Đúng/Sai/Tổng** cập nhật; đồng hồ **30s**/câu; để hết 30s → **Sai +1** và sang câu mới.
- Đổi sang tab khác vài giây rồi quay lại → đồng hồ **không tụt** khi đang ẩn.
- Bấm **Back** trình duyệt (giả lập vuốt-trở-về) → hiện modal "Thoát trò chơi?"; "Ở lại" → chơi tiếp; back lần nữa vẫn bắt được; "Thoát" → về màn chính.
- Refresh khi đang chơi → trình duyệt cảnh báo rời trang.
- Nút **Thoát** trong HUD → về màn chính thẳng (không hỏi).
- Chơi thử game mầm non (vd Đánh Vần) vẫn bình thường; back khi chơi cũng bật modal.

- [ ] **Step 3: Commit (nếu có chỉnh nhỏ)**

```bash
git add -A
git commit -m "test: manual verification for fractions game and exit guard"
```

---

## Ghi chú
- FractionGame tự quản đồng hồ/điểm → không đụng `score/timeLeft` cấp App.
- Guard chống thoát áp cho **mọi** `gameState==='playing'`; nút Thoát vẫn thoát thẳng.
- Độ khó số điều chỉnh trong `fractionProblems.ts` (phạm vi `rint`).
