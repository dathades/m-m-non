# Giọng đọc game lớp 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm giọng đọc (TTS) cho 2 game lớp 4 (Phân Số, Đo Lường): tự động đọc câu hỏi + nút Nghe lại + đọc kết quả đúng/sai/hết giờ.

**Architecture:** Hàm "verbalize" thuần (đọc phân số "… phần …", đơn vị đọc rõ qua `UNIT_SPEECH`) — test Vitest. Hai component gọi `speakText` khi câu đổi (auto-read), qua nút Nghe lại, và ở các nhánh đúng/sai/hết giờ; tăng độ trễ chuyển câu khi đúng để lời chúc không bị cắt.

**Tech Stack:** React 19 + TypeScript + Vite + Web Speech (`speakText`) + Vitest.

**Spec:** `docs/superpowers/specs/2026-08-11-grade4-voice-design.md`
**Nhánh:** tạo `feat/grade4-voice` từ `main`.

---

## File Structure
- Modify `src/lib/units.ts` — thêm `UNIT_SPEECH`.
- Modify `src/lib/audio.ts` — thêm `SAY` (lời kết quả).
- Modify `src/lib/fractionProblems.ts` — thêm `verbalizeFractionProblem`.
- Modify `src/lib/measurementProblems.ts` — thêm `verbalizeMeasurementProblem`.
- Modify `src/lib/fractionProblems.test.ts`, `src/lib/measurementProblems.test.ts`, `src/lib/units.test.ts` — thêm test.
- Modify `src/components/games/FractionGame.tsx`, `src/components/games/MeasurementGame.tsx` — gọi TTS.

Cổng kiểm: logic thuần `npm test`; component `npm run lint` + `npm run build` + chơi thử.

---

## Task 1: Verbalize thuần + hằng số (units, audio, fraction, measurement)

**Files:** Modify `src/lib/units.ts`, `src/lib/audio.ts`, `src/lib/fractionProblems.ts`, `src/lib/measurementProblems.ts` và 3 file test tương ứng.

- [ ] **Step 1: Viết test**

Thêm vào cuối `src/lib/units.test.ts`:
```ts
import { UNIT_SPEECH } from './units.ts';
describe('UNIT_SPEECH', () => {
  it('phủ mọi đơn vị trong MEASURES', () => {
    for (const m of MEASURES) for (const c of m.chains) for (const u of c) {
      expect(UNIT_SPEECH[u.label]).toBeTruthy();
    }
  });
});
```

Thêm vào cuối `src/lib/fractionProblems.test.ts`:
```ts
import { verbalizeFractionProblem } from './fractionProblems.ts';
describe('verbalizeFractionProblem', () => {
  const f = (num: number, den: number) => ({ num, den });
  it('đọc từng dạng', () => {
    expect(verbalizeFractionProblem({ skill: 'recognize', operands: [] } as any)).toBe('Phân số nào chỉ phần đã tô?');
    expect(verbalizeFractionProblem({ skill: 'simplify', operands: [f(2, 4)] } as any)).toBe('Rút gọn phân số, 2 phần 4');
    expect(verbalizeFractionProblem({ skill: 'compare', operands: [f(1, 2), f(1, 3)] } as any)).toBe('So sánh 1 phần 2 và 1 phần 3');
    expect(verbalizeFractionProblem({ skill: 'addsub', op: '+', operands: [f(1, 2), f(1, 3)] } as any)).toBe('1 phần 2 cộng 1 phần 3 bằng bao nhiêu');
    expect(verbalizeFractionProblem({ skill: 'muldiv', op: '×', operands: [f(2, 3), f(3, 4)] } as any)).toBe('2 phần 3 nhân 3 phần 4 bằng bao nhiêu');
    expect(verbalizeFractionProblem({ skill: 'fracof', operands: [f(2, 3)], ofNum: 12 } as any)).toBe('2 phần 3 của 12 bằng bao nhiêu');
  });
  it('không chứa ký hiệu toán', () => {
    const s = verbalizeFractionProblem({ skill: 'addsub', op: '−', operands: [f(2, 3), f(1, 6)] } as any);
    expect(s).not.toMatch(/[/+\-−×÷=?]/);
  });
});
```

Thêm vào cuối `src/lib/measurementProblems.test.ts`:
```ts
import { verbalizeMeasurementProblem } from './measurementProblems.ts';
describe('verbalizeMeasurementProblem', () => {
  it('đọc đơn vị rõ + đúng mẫu', () => {
    expect(verbalizeMeasurementProblem({ answerType: 'number', parts: '5 yến', toUnit: 'kg' } as any)).toBe('5 yến bằng bao nhiêu ki lô gam');
    expect(verbalizeMeasurementProblem({ answerType: 'number', parts: '3 m²', toUnit: 'dm²' } as any)).toBe('3 mét vuông bằng bao nhiêu đề xi mét vuông');
    expect(verbalizeMeasurementProblem({ answerType: 'number', parts: '2 tấn 5 tạ', toUnit: 'kg' } as any)).toBe('2 tấn 5 tạ bằng bao nhiêu ki lô gam');
    expect(verbalizeMeasurementProblem({ answerType: 'choice3', left: '5 tạ', right: '6 yến' } as any)).toBe('So sánh 5 tạ và 6 yến');
  });
});
```

- [ ] **Step 2: Chạy — FAIL**

Run: `npm test` — Expected: FAIL (chưa có `UNIT_SPEECH`/verbalize).

- [ ] **Step 3: Thêm `UNIT_SPEECH` vào `src/lib/units.ts`**

Thêm ở cuối file:
```ts
export const UNIT_SPEECH: Record<string, string> = {
  g: 'gam', kg: 'ki lô gam', 'yến': 'yến', 'tạ': 'tạ', 'tấn': 'tấn',
  mm: 'mi li mét', cm: 'xăng ti mét', dm: 'đề xi mét', m: 'mét', km: 'ki lô mét',
  'mm²': 'mi li mét vuông', 'cm²': 'xăng ti mét vuông', 'dm²': 'đề xi mét vuông', 'm²': 'mét vuông',
  'giây': 'giây', 'phút': 'phút', 'giờ': 'giờ', 'ngày': 'ngày', 'năm': 'năm', 'thế kỉ': 'thế kỉ',
};
```

- [ ] **Step 4: Thêm `SAY` vào `src/lib/audio.ts`**

Thêm ở cuối file:
```ts
export const SAY = {
  correct: 'Đúng rồi! Tiếp tục nào!',
  retry: 'Chưa đúng, thử lại nhé!',
  timeout: 'Hết giờ rồi!',
};
```

- [ ] **Step 5: Thêm `verbalizeFractionProblem` vào `src/lib/fractionProblems.ts`**

Thêm ở cuối file:
```ts
const FRAC_OP_WORD: Record<string, string> = { '+': 'cộng', '−': 'trừ', '×': 'nhân', '÷': 'chia' };
const sayFrac = (f: Fraction) => `${f.num} phần ${f.den}`;

export function verbalizeFractionProblem(p: FractionProblem): string {
  const a = p.operands[0], b = p.operands[1];
  switch (p.skill) {
    case 'recognize': return 'Phân số nào chỉ phần đã tô?';
    case 'simplify': return `Rút gọn phân số, ${sayFrac(a)}`;
    case 'compare': return `So sánh ${sayFrac(a)} và ${sayFrac(b)}`;
    case 'addsub':
    case 'muldiv': return `${sayFrac(a)} ${FRAC_OP_WORD[p.op ?? ''] ?? ''} ${sayFrac(b)} bằng bao nhiêu`;
    case 'fracof': return `${sayFrac(a)} của ${p.ofNum} bằng bao nhiêu`;
  }
}
```
(`Fraction` đã được import sẵn ở đầu file `fractionProblems.ts`.)

- [ ] **Step 6: Thêm `verbalizeMeasurementProblem` vào `src/lib/measurementProblems.ts`**

Sửa dòng import từ `./units.ts` để thêm `UNIT_SPEECH`:
```ts
import { MEASURES, UNIT_SPEECH, type Chain, type Unit } from './units.ts';
```
Thêm ở cuối file:
```ts
const sayQty = (s: string) => s.replace(/(\d+)\s+(\S+)/g, (_, n, unit) => `${n} ${UNIT_SPEECH[unit] ?? unit}`);

export function verbalizeMeasurementProblem(p: MeasurementProblem): string {
  if (p.answerType === 'choice3') return `So sánh ${sayQty(p.left ?? '')} và ${sayQty(p.right ?? '')}`;
  return `${sayQty(p.parts ?? '')} bằng bao nhiêu ${UNIT_SPEECH[p.toUnit ?? ''] ?? p.toUnit}`;
}
```

- [ ] **Step 7: Chạy — PASS + lint**

Run: `npm test && npm run lint`
Expected: các test verbalize + UNIT_SPEECH pass; tsc sạch.

- [ ] **Step 8: Commit**

```bash
git add src/lib/units.ts src/lib/audio.ts src/lib/fractionProblems.ts src/lib/measurementProblems.ts src/lib/units.test.ts src/lib/fractionProblems.test.ts src/lib/measurementProblems.test.ts
git commit -m "feat: verbalize helpers + speech constants for grade-4 games"
```

---

## Task 2: Gọi TTS trong `FractionGame.tsx`

**Files:** Modify `src/components/games/FractionGame.tsx`

- [ ] **Step 1: Sửa import**

Dòng `import { playSound } from '../../lib/audio.ts';` → 
```ts
import { playSound, speakText, SAY } from '../../lib/audio.ts';
```
Khối import từ `fractionProblems.ts` → thêm `verbalizeFractionProblem`:
```ts
import {
  generateFractionProblem, checkFractionAnswer, verbalizeFractionProblem,
  type FractionProblem, type FractionSkill,
} from '../../lib/fractionProblems.ts';
```

- [ ] **Step 2: Effect tự động đọc câu hỏi**

Thêm ngay sau effect "hết giờ" (sau khối `}, [timeLeft, skill]);`):
```ts
  // đọc câu hỏi mỗi khi hiện câu mới (gồm câu đầu tiên)
  useEffect(() => { speakText(verbalizeFractionProblem(problem)); }, [problem]);
```

- [ ] **Step 3: Đọc kết quả + giãn nhịp khi đúng**

Trong `finishCorrect`, thêm `speakText(SAY.correct);` (sau `playSound('correct');`) và
đổi độ trễ `850` → `1800`:
```ts
  const finishCorrect = () => {
    setLocked(true);
    setRight((r) => r + 1);
    setTotal((n) => n + 1);
    setMsg({ text: 'Đúng rồi! 🎉', ok: true });
    playSound('correct');
    speakText(SAY.correct);
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.7 } });
    advanceRef.current = window.setTimeout(() => startProblem(skill), 1800);
  };
```
Trong `wrongTry`, thêm `speakText(SAY.retry);` (sau `playSound('wrong');`).
Trong effect "hết giờ", thêm `speakText(SAY.timeout);` (sau `playSound('wrong');`) và
đổi độ trễ `1200` → `1500`.

- [ ] **Step 4: Nút 🔊 Nghe lại**

Ngay sau khối `<div className="flex flex-wrap gap-2 justify-center mb-4"> … </div>`
(hàng chip), trước thẻ `<div className="bg-white rounded-3xl …">`, thêm:
```tsx
      <div className="flex justify-center mb-4">
        <button
          onClick={() => speakText(verbalizeFractionProblem(problem))}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm hover:bg-indigo-200"
        >
          🔊 Nghe lại
        </button>
      </div>
```

- [ ] **Step 5: Lint + commit**

Run: `npm run lint`
```bash
git add src/components/games/FractionGame.tsx
git commit -m "feat: voice (question + feedback) in FractionGame"
```

---

## Task 3: Gọi TTS trong `MeasurementGame.tsx`

**Files:** Modify `src/components/games/MeasurementGame.tsx`

- [ ] **Step 1: Sửa import**

Dòng `import { playSound } from '../../lib/audio.ts';` →
```ts
import { playSound, speakText, SAY } from '../../lib/audio.ts';
```
Khối import từ `measurementProblems.ts` → thêm `verbalizeMeasurementProblem`:
```ts
import {
  generateMeasurementProblem, checkMeasurementAnswer, verbalizeMeasurementProblem,
  type MeasurementProblem, type MeasureSkill,
} from '../../lib/measurementProblems.ts';
```

- [ ] **Step 2: Effect tự động đọc câu hỏi**

Thêm ngay sau effect "hết giờ" (sau khối `}, [timeLeft, skill]);`):
```ts
  useEffect(() => { speakText(verbalizeMeasurementProblem(problem)); }, [problem]);
```

- [ ] **Step 3: Đọc kết quả + giãn nhịp khi đúng**

Trong `finishCorrect`, thêm `speakText(SAY.correct);` (sau `playSound('correct');`) và
đổi `850` → `1800`:
```ts
  const finishCorrect = () => {
    setLocked(true);
    setRight((r) => r + 1);
    setTotal((n) => n + 1);
    setMsg({ text: 'Đúng rồi! 🎉', ok: true });
    playSound('correct');
    speakText(SAY.correct);
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.7 } });
    advanceRef.current = window.setTimeout(() => startProblem(skill), 1800);
  };
```
Trong `wrongTry`, thêm `speakText(SAY.retry);` (sau `playSound('wrong');`).
Trong effect "hết giờ", thêm `speakText(SAY.timeout);` (sau `playSound('wrong');`) và
đổi `1200` → `1500`.

- [ ] **Step 4: Nút 🔊 Nghe lại**

Ngay sau hàng chip (`<div className="flex flex-wrap gap-2 justify-center mb-4"> … </div>`),
trước thẻ thân bài, thêm:
```tsx
      <div className="flex justify-center mb-4">
        <button
          onClick={() => speakText(verbalizeMeasurementProblem(problem))}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 text-teal-700 font-bold text-sm hover:bg-teal-200"
        >
          🔊 Nghe lại
        </button>
      </div>
```

- [ ] **Step 5: Lint + commit**

Run: `npm run lint`
```bash
git add src/components/games/MeasurementGame.tsx
git commit -m "feat: voice (question + feedback) in MeasurementGame"
```

---

## Task 4: Kiểm thử toàn diện

- [ ] **Step 1: Test + lint + build**

Run: `npm test && npm run lint && npm run build`
Expected: tất cả test pass (verbalize + các test cũ); tsc sạch; build ok.

- [ ] **Step 2: Chơi thử thủ công**

`npm run dev`, lớp = Lớp 4:
- **Phân Số**: vào game nghe đọc câu hỏi tự động; bấm **🔊 Nghe lại** đọc lại;
  đọc phân số "… phần …"; chọn đúng → nghe "Đúng rồi! Tiếp tục nào!" rồi tự sang câu
  (lời chúc **không bị cắt**); chọn sai → "Chưa đúng, thử lại nhé!"; để hết giờ → "Hết giờ rồi!".
- **Đo Lường**: tương tự; đơn vị đọc rõ ("ki lô gam", "mét vuông"…); đổi ghép/so sánh đọc đúng.
- Đổi tab khi đang chơi vẫn OK; game mầm non không đổi.

- [ ] **Step 3: Commit (nếu chỉnh nhỏ)**

```bash
git add -A
git commit -m "test: manual verification for grade-4 voice"
```

---

## Ghi chú
- Chuỗi verbalize không chứa `+ − × ÷ = ? < > /` nên không bị bảng thay thế của `speakText`.
- Độ trễ chuyển câu khi đúng tăng 850→1800ms để lời chúc đọc trọn trước câu kế.
