# Syllable Blending ("Ghép vần") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm chế độ chơi "Ghép Vần": bé ghép âm đầu → vần → dấu thanh thành một tiếng (vd c+a+sắc → "cá") qua 3 bước trắc nghiệm, có tranh emoji + đọc mẫu, có đồng hồ 30s/tiếng + màn hết giờ như game Toán.

**Architecture:** Dữ liệu + sinh đề thuần trong `src/lib/syllables.ts` (lưu sẵn tiếng có dấu → không cần thuật toán đặt dấu), test bằng `tsx`. `BlendingGame.tsx` thuần trình bày. `App.tsx` giữ `blendChallenge`/`blendStep`, xử lý `handleBlendPick` (đúng bước cuối mới cộng điểm + sang tiếng mới + reset đồng hồ). Tái dùng `AnswerGrid`, `speakText`, `FeedbackOverlay`, `GameHUD`, `EndScreen`, confetti.

**Tech Stack:** React 19, TypeScript (non-strict), Vite 6, Tailwind 4, motion/react, lucide-react, canvas-confetti. Test thuần bằng `tsx` (devDep). Không thêm thư viện runtime.

**Spec:** `docs/superpowers/specs/2026-06-11-syllable-blending-design.md`

**Quy ước:** Import nội bộ kèm `.ts`/`.tsx`. Mã tham chiếu App.tsx/StartScreen.tsx theo trạng thái hiện tại trên `master` (sau khi đã merge bài Tập Viết).

---

### Task 1: Thêm `'blending'` vào `GameMode`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Sửa union GameMode**

Trong `src/types.ts`, đổi:

```ts
export type GameMode =
  | 'math'
  | 'numbers'
  | 'letters'
  | 'pattern'
  | 'sequence'
  | 'comparison'
  | 'missing_number'
  | 'letter_recognition';
```

thành (thêm `'blending'`):

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
  | 'blending';
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add 'blending' game mode"
```

---

### Task 2: Dữ liệu + sinh đề `src/lib/syllables.ts` (kèm test tsx)

**Files:**
- Create: `src/lib/syllables.ts`
- Create: `scripts/syllables.test.ts`

- [ ] **Step 1: Viết test trước** `scripts/syllables.test.ts`

```ts
import assert from 'node:assert';
import { generateBlendingChallenge, WORDS, TONES } from '../src/lib/syllables.ts';

for (let i = 0; i < 500; i++) {
  const c = generateBlendingChallenge();

  // target thuộc WORDS
  assert.ok(WORDS.includes(c.target), 'target phải thuộc WORDS');

  // mỗi bộ option đúng 4 phần tử, không trùng
  for (const [name, opts] of [['onset', c.onsetOptions], ['rhyme', c.rhymeOptions]] as const) {
    assert.strictEqual(opts.length, 4, `${name}Options phải có 4 phần tử`);
    assert.strictEqual(new Set(opts).size, 4, `${name}Options không được trùng`);
  }
  assert.strictEqual(c.toneOptions.length, 4, 'toneOptions phải có 4 phần tử');
  assert.strictEqual(new Set(c.toneOptions.map((t) => t.tone)).size, 4, 'toneOptions không được trùng');

  // đáp án đúng luôn nằm trong bộ option tương ứng
  assert.ok(c.onsetOptions.includes(c.target.onset), 'onset đúng phải có trong options');
  assert.ok(c.rhymeOptions.includes(c.target.rhyme), 'rhyme đúng phải có trong options');
  assert.ok(c.toneOptions.some((t) => t.tone === c.target.tone), 'tone đúng phải có trong options');

  // mọi toneOption phải là một thanh hợp lệ
  for (const t of c.toneOptions) assert.ok(TONES.some((x) => x.tone === t.tone), 'tone hợp lệ');
}

console.log('syllables: all assertions passed');
```

- [ ] **Step 2: Chạy test → FAIL** (chưa có module)

Run: `npx tsx scripts/syllables.test.ts`
Expected: FAIL — không import được `../src/lib/syllables.ts`.

- [ ] **Step 3: Viết** `src/lib/syllables.ts`

```ts
export type Tone = 'không' | 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng';

export interface WordEntry {
  onset: string;    // âm đầu, vd 'c', 'nh'
  rhyme: string;    // vần KHÔNG dấu, vd 'a', 'eo'
  tone: Tone;       // thanh điệu
  syllable: string; // tiếng cuối ĐÃ có dấu, vd 'cá'
  emoji?: string;   // tranh minh hoạ nếu có
}

export interface ToneOption {
  tone: Tone;
  demo: string; // dấu đặt trên 'a' để bé thấy: á à ả ã ạ a
}

export interface BlendChallenge {
  target: WordEntry;
  onsetOptions: string[];
  rhymeOptions: string[];
  toneOptions: ToneOption[];
}

export const WORDS: WordEntry[] = [
  { onset: 'c', rhyme: 'a', tone: 'sắc', syllable: 'cá', emoji: '🐟' },
  { onset: 'g', rhyme: 'a', tone: 'huyền', syllable: 'gà', emoji: '🐔' },
  { onset: 'b', rhyme: 'o', tone: 'huyền', syllable: 'bò', emoji: '🐮' },
  { onset: 'd', rhyme: 'ê', tone: 'không', syllable: 'dê', emoji: '🐐' },
  { onset: 'v', rhyme: 'oi', tone: 'không', syllable: 'voi', emoji: '🐘' },
  { onset: 'g', rhyme: 'âu', tone: 'sắc', syllable: 'gấu', emoji: '🐻' },
  { onset: 'm', rhyme: 'eo', tone: 'huyền', syllable: 'mèo', emoji: '🐱' },
  { onset: 'l', rhyme: 'a', tone: 'sắc', syllable: 'lá', emoji: '🍃' },
  { onset: 'v', rhyme: 'it', tone: 'nặng', syllable: 'vịt', emoji: '🦆' },
  { onset: 's', rhyme: 'ưa', tone: 'ngã', syllable: 'sữa', emoji: '🥛' },
  { onset: 'm', rhyme: 'u', tone: 'ngã', syllable: 'mũ', emoji: '🎩' },
  { onset: 'c', rhyme: 'ơ', tone: 'huyền', syllable: 'cờ', emoji: '🚩' },
  { onset: 'd', rhyme: 'u', tone: 'huyền', syllable: 'dù', emoji: '☂️' },
  { onset: 'c', rhyme: 'ua', tone: 'không', syllable: 'cua', emoji: '🦀' },
  { onset: 'h', rhyme: 'ô', tone: 'hỏi', syllable: 'hổ', emoji: '🐯' },
  { onset: 'm', rhyme: 'ây', tone: 'không', syllable: 'mây', emoji: '☁️' },
  { onset: 'b', rhyme: 'ơ', tone: 'không', syllable: 'bơ', emoji: '🥑' },
  { onset: 'l', rhyme: 'ac', tone: 'nặng', syllable: 'lạc', emoji: '🥜' },
  { onset: 'nh', rhyme: 'o', tone: 'không', syllable: 'nho', emoji: '🍇' },
  { onset: 'b', rhyme: 'e', tone: 'sắc', syllable: 'bé', emoji: '👶' }
];

export const ONSETS: string[] = [
  'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n',
  'p', 'r', 's', 't', 'v', 'x', 'ch', 'kh', 'nh', 'ph', 'th', 'tr'
];

export const RHYMES: string[] = [
  'a', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y',
  'eo', 'ao', 'ai', 'ay', 'ây', 'oi', 'ôi', 'ui', 'ưa', 'ua', 'âu', 'it', 'ac'
];

export const TONES: ToneOption[] = [
  { tone: 'không', demo: 'a' },
  { tone: 'sắc', demo: 'á' },
  { tone: 'huyền', demo: 'à' },
  { tone: 'hỏi', demo: 'ả' },
  { tone: 'ngã', demo: 'ã' },
  { tone: 'nặng', demo: 'ạ' }
];

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// Lấy `n` phần tử ngẫu nhiên từ `pool`, loại những phần tử `eq` với `exclude`.
const pickDistractors = <T>(pool: T[], exclude: T, n: number, eq: (a: T, b: T) => boolean): T[] =>
  shuffle(pool.filter((p) => !eq(p, exclude))).slice(0, n);

export function generateBlendingChallenge(): BlendChallenge {
  const target = WORDS[Math.floor(Math.random() * WORDS.length)];

  const onsetOptions = shuffle([
    target.onset,
    ...pickDistractors(ONSETS, target.onset, 3, (a, b) => a === b)
  ]);
  const rhymeOptions = shuffle([
    target.rhyme,
    ...pickDistractors(RHYMES, target.rhyme, 3, (a, b) => a === b)
  ]);
  const correctTone = TONES.find((t) => t.tone === target.tone)!;
  const toneOptions = shuffle([
    correctTone,
    ...pickDistractors(TONES, correctTone, 3, (a, b) => a.tone === b.tone)
  ]);

  return { target, onsetOptions, rhymeOptions, toneOptions };
}
```

- [ ] **Step 4: Chạy test → PASS**

Run: `npx tsx scripts/syllables.test.ts`
Expected: `syllables: all assertions passed`, exit 0.

- [ ] **Step 5: Lint + commit**

Run: `npm run lint` → exit 0.

```bash
git add src/lib/syllables.ts scripts/syllables.test.ts
git commit -m "feat: syllable data + blending challenge generator with tsx test"
```

---

### Task 3: Component `src/components/games/BlendingGame.tsx`

**Files:**
- Create: `src/components/games/BlendingGame.tsx`

- [ ] **Step 1: Viết file**

```tsx
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { BlendChallenge, Tone } from '../../lib/syllables.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface BlendingGameProps {
  challenge: BlendChallenge;
  step: 0 | 1 | 2; // 0: âm đầu, 1: vần, 2: dấu thanh
  feedback: 'correct' | 'wrong' | null;
  onPick: (value: string) => void;
}

const STEP_LABELS = ['Chọn âm đầu', 'Chọn vần', 'Chọn dấu thanh'];

export default function BlendingGame({ challenge, step, feedback, onPick }: BlendingGameProps) {
  const { target, onsetOptions, rhymeOptions, toneOptions } = challenge;
  const disabled = feedback !== null;

  // Phần đã ghép theo số bước đã hoàn thành
  const assembled = step === 0 ? '' : step === 1 ? target.onset : target.onset + target.rhyme;

  return (
    <div className="w-full">
      {/* Ô đề: tranh (nếu có) + nút nghe tiếng đích */}
      <div className="flex flex-col items-center mb-6">
        {target.emoji ? <div className="text-7xl mb-2">{target.emoji}</div> : null}
        <button
          onClick={() => speakText(target.syllable)}
          className="flex items-center gap-2 px-5 py-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-full font-bold transition-colors"
        >
          <Volume2 size={20} />
          Nghe tiếng
        </button>
      </div>

      {/* Phần ghép lớn dần */}
      <div className="min-h-[80px] mb-6 flex items-center justify-center">
        <span className="text-6xl font-black text-teal-600 tracking-wider">{assembled || '…'}</span>
      </div>

      {/* Nhãn bước */}
      <h3 className="text-xl font-bold text-gray-500 mb-4">{STEP_LABELS[step]}</h3>

      {/* Lựa chọn theo bước */}
      {step < 2 ? (
        <AnswerGrid
          options={step === 0 ? onsetOptions : rhymeOptions}
          onAnswer={onPick}
          disabled={disabled}
          variant="pattern"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {toneOptions.map((t) => (
            <button
              key={t.tone}
              onClick={() => onPick(t.tone as Tone)}
              disabled={disabled}
              className="flex flex-col items-center py-6 rounded-2xl bg-white hover:bg-teal-50 border-b-8 border-teal-200 transition-all active:border-b-0 active:translate-y-2 disabled:opacity-50 shadow-md"
            >
              <span className="text-5xl font-black text-teal-700">{t.demo}</span>
              <span className="text-sm font-bold text-teal-500 mt-1">{t.tone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/games/BlendingGame.tsx
git commit -m "feat: BlendingGame component - 3-step syllable building UI"
```

---

### Task 4: Tích hợp vào `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

Áp 8 sửa đổi nhỏ (theo đúng chuỗi hiện có). Sau Task 4: lint + build.

- [ ] **Step 1: Thêm import** — sau khối import generators (kết thúc dòng `} from './lib/questions.ts';`) thêm:

```tsx
import { generateBlendingChallenge } from './lib/syllables.ts';
import type { BlendChallenge } from './lib/syllables.ts';
```

và sau `import LetterRecognitionGame from './components/games/LetterRecognitionGame.tsx';` thêm:

```tsx
import BlendingGame from './components/games/BlendingGame.tsx';
```

- [ ] **Step 2: Thêm state** — thay:

```tsx
  const [currentLetter, setCurrentLetter] = useState('A');
  const [showLetterPicker, setShowLetterPicker] = useState(false);
```

bằng:

```tsx
  const [currentLetter, setCurrentLetter] = useState('A');
  const [showLetterPicker, setShowLetterPicker] = useState(false);
  const [blendChallenge, setBlendChallenge] = useState<BlendChallenge | null>(null);
  const [blendStep, setBlendStep] = useState<0 | 1 | 2>(0);
```

- [ ] **Step 3: resetToHome** — thay:

```tsx
    setFeedback(null);
    setTimeLeft(30);
    setShowLetterPicker(false);
  };
```

bằng:

```tsx
    setFeedback(null);
    setTimeLeft(30);
    setShowLetterPicker(false);
    setBlendChallenge(null);
    setBlendStep(0);
  };
```

- [ ] **Step 4: startGame** — thay nhánh điều kiện cuối của `startGame`:

```tsx
    if (selectedMode === 'letters') {
      setCurrentLetter('A');
      setShowLetterPicker(true);
      speakText(`${childName} muốn tập viết chữ nào`);
    } else {
      const firstQuestion = generateQuestionForMode(selectedMode);
      if (firstQuestion) {
        setQuestion(firstQuestion);
        speakText(firstQuestion.text);
      }
    }
  };
```

bằng:

```tsx
    if (selectedMode === 'letters') {
      setCurrentLetter('A');
      setShowLetterPicker(true);
      speakText(`${childName} muốn tập viết chữ nào`);
    } else if (selectedMode === 'blending') {
      const challenge = generateBlendingChallenge();
      setBlendChallenge(challenge);
      setBlendStep(0);
      speakText(challenge.target.syllable);
    } else {
      const firstQuestion = generateQuestionForMode(selectedMode);
      if (firstQuestion) {
        setQuestion(firstQuestion);
        speakText(firstQuestion.text);
      }
    }
  };
```

- [ ] **Step 5: Loại blending khỏi effect tự gọi nextQuestion** — thay:

```tsx
    if (gameState === 'playing' && !question && mode !== 'letters') {
      nextQuestion();
    }
```

bằng:

```tsx
    if (gameState === 'playing' && !question && mode !== 'letters' && mode !== 'blending') {
      nextQuestion();
    }
```

(Effect đồng hồ phía dưới GIỮ NGUYÊN — blending là chế độ có giờ nên vẫn nằm trong nhánh `mode !== 'letters'`.)

- [ ] **Step 6: Thêm handleBlendPick** — sau hàm `handleRequestPicker` (kết thúc bằng `};`) thêm:

```tsx
  const handleBlendPick = (value: string) => {
    if (feedback || !blendChallenge) return;
    const t = blendChallenge.target;
    const correct = blendStep === 0 ? t.onset : blendStep === 1 ? t.rhyme : t.tone;

    if (value === correct) {
      if (blendStep < 2) {
        const nextStep = (blendStep + 1) as 0 | 1 | 2;
        setBlendStep(nextStep);
        if (nextStep === 2) speakText(t.onset + t.rhyme); // đã thành tiếng (vd "ca")
      } else {
        setScore((prev) => prev + 1);
        setTotalCount((prev) => prev + 1);
        setFeedback('correct');
        playSound('correct');
        speakText(`${t.syllable}! ${childName} giỏi quá!`);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          const next = generateBlendingChallenge();
          setBlendChallenge(next);
          setBlendStep(0);
          setTimeLeft(30);
          setFeedback(null);
          speakText(next.target.syllable);
        }, 2000);
      }
    } else {
      setFeedback('wrong');
      setWrongCount((prev) => prev + 1);
      playSound('wrong');
      speakText('Chưa đúng rồi!');
      setTimeout(() => setFeedback(null), 1500);
    }
  };
```

- [ ] **Step 7: renderGameBody** — thay dòng guard và thêm case. Thay:

```tsx
  const renderGameBody = () => {
    if (!question && mode !== 'letters') return null;
    const disabled = feedback === 'correct';

    switch (mode) {
      case 'letters':
```

bằng:

```tsx
  const renderGameBody = () => {
    if (!question && mode !== 'letters' && mode !== 'blending') return null;
    const disabled = feedback === 'correct';

    switch (mode) {
      case 'blending':
        return blendChallenge ? (
          <BlendingGame
            challenge={blendChallenge}
            step={blendStep}
            feedback={feedback}
            onPick={handleBlendPick}
          />
        ) : null;
      case 'letters':
```

- [ ] **Step 8: motion key** — thay:

```tsx
          key={mode === 'letters' ? (showLetterPicker ? 'picker' : currentLetter) : (question?.text ?? '') + (question?.visual?.length || '')}
```

bằng:

```tsx
          key={
            mode === 'letters'
              ? (showLetterPicker ? 'picker' : currentLetter)
              : mode === 'blending'
              ? (blendChallenge?.target.syllable ?? '')
              : (question?.text ?? '') + (question?.visual?.length || '')
          }
```

- [ ] **Step 9: Lint + build**

Run: `npm run lint` → exit 0.
Run: `npm run build` → success.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire blending mode into App (timed, 3-step pick handler)"
```

---

### Task 5: Thêm thẻ "Ghép Vần" vào `src/components/StartScreen.tsx`

**Files:**
- Modify: `src/components/StartScreen.tsx`

- [ ] **Step 1: Thêm icon import** — thay khối import lucide:

```tsx
import {
  BookOpen,
  CheckCircle2,
  Gamepad2,
  Hash,
  Pencil,
  RotateCcw,
  Settings2,
  Trophy,
  Volume2
} from 'lucide-react';
```

bằng (thêm `Blocks`):

```tsx
import {
  Blocks,
  BookOpen,
  CheckCircle2,
  Gamepad2,
  Hash,
  Pencil,
  RotateCcw,
  Settings2,
  Trophy,
  Volume2
} from 'lucide-react';
```

- [ ] **Step 2: Thêm thẻ** — thay (thẻ Nhận Biết Chữ + đóng grid):

```tsx
        <button
          onClick={() => onStart('letter_recognition')}
          className="group flex flex-col items-center p-6 bg-amber-100 hover:bg-amber-200 rounded-2xl transition-all border-b-8 border-amber-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-amber-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <Volume2 size={48} />
          </div>
          <span className="text-2xl font-bold text-amber-700">Nhận Biết Chữ</span>
          <span className="text-sm text-amber-600 mt-2">Nghe và chọn chữ</span>
        </button>
      </div>
```

bằng (thêm thẻ teal "Ghép Vần" trước khi đóng `</div>`):

```tsx
        <button
          onClick={() => onStart('letter_recognition')}
          className="group flex flex-col items-center p-6 bg-amber-100 hover:bg-amber-200 rounded-2xl transition-all border-b-8 border-amber-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-amber-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <Volume2 size={48} />
          </div>
          <span className="text-2xl font-bold text-amber-700">Nhận Biết Chữ</span>
          <span className="text-sm text-amber-600 mt-2">Nghe và chọn chữ</span>
        </button>

        <button
          onClick={() => onStart('blending')}
          className="group flex flex-col items-center p-6 bg-teal-100 hover:bg-teal-200 rounded-2xl transition-all border-b-8 border-teal-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-teal-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <Blocks size={48} />
          </div>
          <span className="text-2xl font-bold text-teal-700">Ghép Vần</span>
          <span className="text-sm text-teal-600 mt-2">Ghép âm đầu, vần, dấu</span>
        </button>
      </div>
```

- [ ] **Step 3: Lint + build**

Run: `npm run lint` → exit 0.
Run: `npm run build` → success.

- [ ] **Step 4: Commit**

```bash
git add src/components/StartScreen.tsx
git commit -m "feat: add Ghep Van card to StartScreen"
```

---

### Task 6: Kiểm chứng thủ công

**Files:** không sửa (chạy app).

- [ ] **Step 1: Dev server**

Run: `npm run dev` (background)
Expected: Vite ready tại `http://localhost:3000`.

- [ ] **Step 2: Checklist trong trình duyệt**

Vào app → (nhập tên nếu cần) → **Ghép Vần**:
1. Ra đề: hiện emoji + nút "Nghe tiếng" đọc đúng tiếng đích; đồng hồ 30s chạy.
2. Bước 1 chọn âm đầu đúng → hiện chữ; bước 2 chọn vần đúng → ghép thành tiếng không dấu + đọc (vd "ca"); bước 3 nút dấu hiện `á/à/ả/ã/ạ/a` + tên thanh.
3. Chọn đúng dấu (bước cuối) → ra tiếng có dấu, confetti, đọc "cá! {tên} giỏi quá!", overlay xanh ~2s, sang tiếng mới + đồng hồ reset 30s, điểm +1.
4. Chọn sai bất kỳ bước nào → số "Sai" tăng, overlay đỏ ~1.5s, ở lại bước đó làm lại.
5. Để hết 30s trên một tiếng → màn "Hết giờ"; "Chơi lại" vào lại Ghép Vần, "Trang chủ" về chọn game.
6. Nút Thoát về trang chủ; các game khác vẫn chạy bình thường (không hồi quy).
7. Tiếng không emoji (nếu thêm sau) vẫn nghe đọc được; text/giọng xưng tên bé.

- [ ] **Step 3: Nếu ngưỡng/độ khó cần chỉnh** — sửa danh sách `WORDS` hoặc kho nhiễu trong `src/lib/syllables.ts`, chạy lại `npx tsx scripts/syllables.test.ts` (đảm bảo pass). Commit nếu có đổi.

- [ ] **Step 4: Dừng dev server.**

---

## Self-Review (đã chạy)

**1. Spec coverage:**
- Mode 'blending' + 3 bước âm đầu/vần/dấu: Task 1, 3, 4 ✓.
- Dữ liệu lưu sẵn tiếng có dấu, ~20 tiếng phủ 6 thanh, kho nhiễu, generator: Task 2 ✓.
- Có đồng hồ 30s/tiếng + màn hết giờ: Task 4 (giữ blending trong nhánh timer; reset timeLeft khi sang tiếng) ✓.
- Đúng bước cuối mới cộng điểm + sang tiếng mới; sai tính 1 Sai + làm lại; bước đúng giữa chừng không overlay: Task 4 `handleBlendPick` ✓.
- Nút dấu hiện mark trên 'a' + tên thanh; không đọc lẻ phụ âm (chỉ đọc sau khi thành tiếng): Task 3 + Task 4 ✓.
- Thẻ "Ghép Vần" ở StartScreen: Task 5 ✓.
- Tái dùng AnswerGrid/FeedbackOverlay/GameHUD/EndScreen/confetti: Task 3, 4 ✓.
- Kiểm chứng lint/build/test tsx/manual: Task 2, 4, 5, 6 ✓.

**2. Placeholder scan:** Không có TBD. Mọi bước có mã đầy đủ hoặc lệnh cụ thể.

**3. Type consistency:** `BlendChallenge`/`Tone`/`WordEntry`/`ToneOption` định nghĩa ở `syllables.ts` (Task 2), dùng ở BlendingGame (Task 3) và App (Task 4). `generateBlendingChallenge()` chữ ký khớp lời gọi App. Props `BlendingGame` (`challenge, step, feedback, onPick`) khớp chỗ render Task 4 Step 7. `onPick(value: string)` — `handleBlendPick(value: string)` khớp (Tone là string union nên truyền được). `step: 0|1|2` khớp `blendStep` state. `'blending'` thêm vào GameMode (Task 1) nên mọi `mode === 'blending'` hợp lệ kiểu.
