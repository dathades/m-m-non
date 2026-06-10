# Refactor Components + Name Entry Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách `src/App.tsx` (1 file ~1230 dòng chứa 8 game mode) thành component/lib riêng, thêm màn hình nhập tên bé lưu vào localStorage, mọi text + giọng đọc dùng tên bé thay cho "Voi" (kiểu xưng hô: chỉ tên — "Na đếm xem...").

**Architecture:** App.tsx giữ điều hướng màn hình + state phiên chơi (điểm, timer, feedback, question, settings); game component thuần trình bày nhận props; hàm sinh câu hỏi nhận `name` để nhúng tên vào `Question.text` (giọng đọc tự ăn theo vì App đọc `question.text`).

**Tech Stack:** React 19, TypeScript (không strict), Vite 6, Tailwind CSS 4, motion/react, lucide-react, canvas-confetti. KHÔNG có test framework (theo spec) — mỗi task verify bằng `npm run lint` (tsc --noEmit), cuối cùng verify thủ công qua `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-06-10-refactor-components-name-screen-design.md`

**Tham chiếu nguồn:** mọi "App.tsx gốc, dòng X–Y" trỏ tới `src/App.tsx` tại commit `4c331d1` (trạng thái hiện tại, chưa sửa). Import nội bộ viết kèm đuôi `.ts`/`.tsx` (idiom hiện có trong `src/main.tsx`, tsconfig bật `allowImportingTsExtensions`).

**Quy ước chung:** Cho tới Task 15, file `src/App.tsx` cũ vẫn giữ nguyên và vẫn compile — các file mới chỉ import lẫn nhau nên `npm run lint` pass ở mọi task trung gian.

---

### Task 1: Tạo `src/types.ts`

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Viết file**

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

export type MathOperator = '+' | '-';

export interface Question {
  text: string;
  visual?: string[];
  answer: string;
  options: string[];
}

export interface GameSettings {
  mathRange: number;
  mathOperator: MathOperator;
  sequenceRange: number;
  comparisonRange: number;
  missingNumberRange: number;
}
```

Lưu ý: `Question` gốc có `image?` và `grid?` nhưng không nơi nào dùng — bỏ (YAGNI).

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0, không output lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "refactor: extract shared types to src/types.ts"
```

---

### Task 2: Tạo `src/lib/constants.ts`

**Files:**
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Viết file**

Nội dung = 4 hằng số copy **nguyên văn** từ App.tsx gốc, thêm `export`:

```ts
export const EMOJIS = [
  // ... copy NGUYÊN VĂN nội dung mảng từ App.tsx gốc dòng 41–45 (3 dòng emoji: trái cây/rau, động vật, phương tiện)
];

export const PATTERN_TYPES = [
  // ... copy NGUYÊN VĂN nội dung mảng từ App.tsx gốc dòng 46–112 (các nhóm ABAB, AABAAB, ABCABC, ABBABB, Complex — giữ cả comment)
];

export const LETTER_LIST = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y'
];

export const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3'
};
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "refactor: extract emoji/pattern/letter/sound constants to lib"
```

---

### Task 3: Tạo `src/lib/audio.ts`

**Files:**
- Create: `src/lib/audio.ts`

- [ ] **Step 1: Viết file**

Logic copy nguyên văn từ App.tsx gốc dòng 124–169 (playSound, speakText, khối preload voices), chỉ đổi nguồn SOUNDS sang import:

```ts
import { SOUNDS } from './constants.ts';

export const playSound = (type: 'correct' | 'wrong') => {
  const audio = new Audio(SOUNDS[type]);
  audio.play().catch(() => {
    // Ignore errors if browser blocks autoplay
  });
};

export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  // Stop any current speech
  window.speechSynthesis.cancel();

  // Prepare text for better speech (especially for math)
  let spokenText = text;
  spokenText = spokenText.replace(/\+/g, ' cộng ');
  spokenText = spokenText.replace(/-/g, ' trừ ');
  spokenText = spokenText.replace(/=/g, ' bằng ');
  spokenText = spokenText.replace(/\?/g, ' mấy ');
  spokenText = spokenText.replace(/>/g, ' lớn hơn ');
  spokenText = spokenText.replace(/</g, ' bé hơn ');

  // Small delay to ensure cancel has finished
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.toLowerCase().includes('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, 100);
};

// Initial voice load for some browsers
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/audio.ts
git commit -m "refactor: extract sound and speech helpers to lib/audio"
```

---

### Task 4: Tạo `src/lib/questions.ts`

**Files:**
- Create: `src/lib/questions.ts`

- [ ] **Step 1: Viết file**

Logic sinh câu hỏi giữ nguyên từ App.tsx gốc (dòng 394–537), khác biệt:
- Hàm thuần nhận tham số (`range`, `operator`, `name`) thay vì đọc state/closure.
- Text chứa "Voi" → dùng `name`.
- `generateSequence` trả thêm `visual: [num.toString()]` để UI hiển thị số to mà không phải parse chuỗi (App.tsx gốc dòng 1141 đang parse bằng `.replace(...)` — bỏ cách đó).

```ts
import type { MathOperator, Question } from '../types.ts';
import { EMOJIS, LETTER_LIST, PATTERN_TYPES } from './constants.ts';

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const generateMath = (range: number, operator: MathOperator): Question => {
  let a, b, ans;
  if (operator === '+') {
    a = Math.floor(Math.random() * (range / 2 + 1));
    b = Math.floor(Math.random() * (range - a + 1));
    ans = a + b;
  } else {
    a = Math.floor(Math.random() * (range - 1)) + 1;
    b = Math.floor(Math.random() * (a + 1));
    ans = a - b;
  }

  const options = new Set<string>();
  options.add(ans.toString());
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 5) - 2;
    const fake = Math.max(0, ans + offset);
    options.add(fake.toString());
  }

  return {
    text: `${a} ${operator} ${b} = ?`,
    answer: ans.toString(),
    options: shuffle(Array.from(options))
  };
};

export const generateCounting = (name: string): Question => {
  const num = Math.floor(Math.random() * 10) + 1;
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const visuals = Array(num).fill(emoji);
  const options = new Set<string>();
  options.add(num.toString());
  while (options.size < 4) {
    options.add((Math.floor(Math.random() * 10) + 1).toString());
  }
  return {
    text: `${name} đếm xem có bao nhiêu hình nhé`,
    visual: visuals,
    answer: num.toString(),
    options: shuffle(Array.from(options))
  };
};

export const generatePattern = (name: string): Question => {
  const basePattern = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
  const sequence = [...basePattern];
  const ans = sequence.pop()!;

  const uniqueItems = Array.from(new Set(basePattern));
  const options = [...uniqueItems];

  while (options.length < 4) {
    const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    if (!options.includes(randomEmoji)) {
      options.push(randomEmoji);
    }
  }

  return {
    text: `${name} hãy tìm hình tiếp theo của quy luật nhé!`,
    visual: sequence,
    answer: ans,
    options: shuffle(options)
  };
};

export const generateSequence = (range: number): Question => {
  const num = Math.floor(Math.random() * (range - 1)) + 1; // 1 to range-1
  const isBefore = Math.random() > 0.5;
  const ans = isBefore ? num - 1 : num + 1;

  const options = new Set<string>();
  options.add(ans.toString());
  while (options.size < 4) {
    const fake = Math.max(0, ans + (Math.floor(Math.random() * 5) - 2));
    options.add(fake.toString());
  }

  return {
    text: `Số liền ${isBefore ? 'trước' : 'sau'} của số ${num} là số nào`,
    visual: [num.toString()],
    answer: ans.toString(),
    options: shuffle(Array.from(options))
  };
};

export const generateComparison = (range: number, name: string): Question => {
  const a = Math.floor(Math.random() * (range + 1));
  const b = Math.floor(Math.random() * (range + 1));
  let ans = '=';
  if (a < b) ans = '<';
  else if (a > b) ans = '>';

  return {
    text: `${name} hãy so sánh hai số ${a} và ${b} nhé!`,
    visual: [a.toString(), b.toString()],
    answer: ans,
    options: ['<', '=', '>']
  };
};

export const generateMissingNumber = (range: number, name: string): Question => {
  const start = Math.floor(Math.random() * (range - 5)) + 1;
  const step = Math.random() > 0.7 ? 2 : 1; // Sometimes skip by 2
  const sequence = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
  const missingIdx = Math.floor(Math.random() * sequence.length);
  const ans = sequence[missingIdx];

  const visual = sequence.map((n, idx) => idx === missingIdx ? '?' : n.toString());

  const options = new Set<string>();
  options.add(ans.toString());
  while (options.size < 4) {
    const fake = Math.max(0, ans + (Math.floor(Math.random() * 7) - 3));
    options.add(fake.toString());
  }

  return {
    text: `${name} hãy tìm số còn thiếu trong dãy số nhé!`,
    visual: visual,
    answer: ans.toString(),
    options: shuffle(Array.from(options))
  };
};

export const generateLetterRecognition = (name: string): Question => {
  const lettersOnly = LETTER_LIST.filter(l => isNaN(Number(l)));
  const ans = lettersOnly[Math.floor(Math.random() * lettersOnly.length)];

  const options = new Set<string>();
  options.add(ans);
  while (options.size < 4) {
    const fake = lettersOnly[Math.floor(Math.random() * lettersOnly.length)];
    options.add(fake);
  }

  return {
    text: `${name} hãy tìm chữ ${ans} nhé!`,
    answer: ans,
    options: shuffle(Array.from(options))
  };
};
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/questions.ts
git commit -m "refactor: extract question generators with child-name parameter"
```

---

### Task 5: Tạo `src/components/FeedbackOverlay.tsx`

**Files:**
- Create: `src/components/FeedbackOverlay.tsx`

- [ ] **Step 1: Viết file**

Thay cho khối overlay Đúng/Sai lặp lại trong App.tsx gốc dòng 894–916. Message truyền từ ngoài vào (để App nhúng tên bé và đổi câu theo mode).

```tsx
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Frown } from 'lucide-react';

interface FeedbackOverlayProps {
  feedback: 'correct' | 'wrong' | null;
  correctMessage: string;
  wrongMessage: string;
}

export default function FeedbackOverlay({ feedback, correctMessage, wrongMessage }: FeedbackOverlayProps) {
  return (
    <AnimatePresence>
      {feedback === 'correct' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/90 text-white z-20"
        >
          <CheckCircle2 size={120} className="mb-4" />
          <h2 className="text-4xl font-bold">{correctMessage}</h2>
        </motion.div>
      )}
      {feedback === 'wrong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/90 text-white z-20"
        >
          <Frown size={120} className="mb-4" />
          <h2 className="text-4xl font-bold">{wrongMessage}</h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/FeedbackOverlay.tsx
git commit -m "refactor: extract FeedbackOverlay component"
```

---

### Task 6: Tạo `src/components/AnswerGrid.tsx`

**Files:**
- Create: `src/components/AnswerGrid.tsx`

- [ ] **Step 1: Viết file**

Gom 4 biến thể lưới nút đáp án trong App.tsx gốc (dòng 998–1009 pattern, 1086–1097 rose, 1116–1127 amber, 1160–1171 purple):

```tsx
type AnswerVariant = 'purple' | 'pattern' | 'rose' | 'amber';

const VARIANT_CLASSES: Record<AnswerVariant, { container: string; button: string }> = {
  purple: {
    container: 'grid grid-cols-2 gap-4 md:gap-6 w-full',
    button: 'py-5 text-4xl font-bold rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border-b-8 border-purple-200'
  },
  pattern: {
    container: 'grid grid-cols-2 md:grid-cols-4 gap-4 w-full',
    button: 'py-6 text-5xl font-bold rounded-2xl bg-white hover:bg-purple-50 text-purple-700 border-b-8 border-purple-200 shadow-md'
  },
  rose: {
    container: 'grid grid-cols-2 md:grid-cols-4 gap-4 w-full',
    button: 'py-6 text-5xl font-bold rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border-b-8 border-rose-200 shadow-md'
  },
  amber: {
    container: 'grid grid-cols-2 gap-6 w-full max-w-md mx-auto',
    button: 'py-10 text-7xl font-black rounded-3xl bg-white hover:bg-amber-50 text-amber-700 border-b-8 border-amber-200 shadow-md'
  }
};

interface AnswerGridProps {
  options: string[];
  onAnswer: (option: string) => void;
  disabled: boolean;
  variant: AnswerVariant;
}

export default function AnswerGrid({ options, onAnswer, disabled, variant }: AnswerGridProps) {
  const classes = VARIANT_CLASSES[variant];
  return (
    <div className={classes.container}>
      {options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => onAnswer(opt)}
          disabled={disabled}
          className={`${classes.button} transition-all active:border-b-0 active:translate-y-2 disabled:opacity-50`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/AnswerGrid.tsx
git commit -m "refactor: extract shared AnswerGrid component"
```

---

### Task 7: Tạo `src/components/GameHUD.tsx`

**Files:**
- Create: `src/components/GameHUD.tsx`

- [ ] **Step 1: Viết file**

Thay cho thanh trên cùng khi đang chơi (App.tsx gốc dòng 853–883). `timeLeft === null` → ẩn timer (mode tập viết).

```tsx
import { Hash, LogOut, Timer, Trophy, XCircle } from 'lucide-react';

interface GameHUDProps {
  totalCount: number;
  wrongCount: number;
  score: number;
  timeLeft: number | null;
  onExit: () => void;
}

export default function GameHUD({ totalCount, wrongCount, score, timeLeft, onExit }: GameHUDProps) {
  return (
    <div className="flex justify-between items-center mb-6 bg-white/60 p-4 rounded-2xl backdrop-blur-sm shadow-sm">
      <button
        onClick={onExit}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-full font-bold transition-colors"
      >
        <LogOut size={20} />
        <span>Thoát</span>
      </button>

      <div className="flex gap-3">
        <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-full font-bold shadow-sm text-sm">
          <Hash size={16} />
          <span>Tổng: {totalCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-full font-bold shadow-sm text-sm">
          <XCircle size={16} />
          <span>Sai: {wrongCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-400 text-white px-3 py-2 rounded-full font-bold shadow-sm text-sm">
          <Trophy size={16} />
          <span>{score}</span>
        </div>

        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold shadow-sm transition-colors text-sm ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
            <Timer size={16} />
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameHUD.tsx
git commit -m "refactor: extract GameHUD component"
```

---

### Task 8: Tạo `MathGame`, `CountingGame`, `SequenceGame`

**Files:**
- Create: `src/components/games/MathGame.tsx`
- Create: `src/components/games/CountingGame.tsx`
- Create: `src/components/games/SequenceGame.tsx`

Cả 3 dùng layout "đề bài + AnswerGrid purple" (App.tsx gốc dòng 1130–1172). Mọi game component nhận `disabled` = `feedback === 'correct'` từ App.

- [ ] **Step 1: Viết `src/components/games/MathGame.tsx`**

```tsx
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface MathGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function MathGame({ question, disabled, onAnswer }: MathGameProps) {
  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-6 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>
      <div className="mb-10 flex flex-wrap justify-center gap-4 min-h-[120px] items-center">
        <div className="text-7xl font-black text-purple-600">{question.text.split('=')[0]}</div>
      </div>
      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="purple" />
    </div>
  );
}
```

- [ ] **Step 2: Viết `src/components/games/CountingGame.tsx`**

```tsx
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface CountingGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function CountingGame({ question, disabled, onAnswer }: CountingGameProps) {
  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-6 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>
      <div className="mb-10 flex flex-wrap justify-center gap-4 min-h-[120px] items-center">
        <div className="flex flex-wrap justify-center gap-3 max-w-md">
          {question.visual?.map((v, i) => (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={i}
              className="text-5xl drop-shadow-sm"
            >
              {v}
            </motion.span>
          ))}
        </div>
      </div>
      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="purple" />
    </div>
  );
}
```

- [ ] **Step 3: Viết `src/components/games/SequenceGame.tsx`**

Hiển thị số to lấy từ `question.visual?.[0]` (Task 4 đã thêm), không parse text như bản gốc.

```tsx
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface SequenceGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function SequenceGame({ question, disabled, onAnswer }: SequenceGameProps) {
  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-6 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>
      <div className="mb-10 flex flex-wrap justify-center gap-4 min-h-[120px] items-center">
        <div className="text-7xl font-black text-purple-600">{question.visual?.[0]}</div>
      </div>
      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="purple" />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/games/MathGame.tsx src/components/games/CountingGame.tsx src/components/games/SequenceGame.tsx
git commit -m "refactor: extract Math, Counting, Sequence game components"
```

---

### Task 9: Tạo `PatternGame`, `MissingNumberGame`, `LetterRecognitionGame`

**Files:**
- Create: `src/components/games/PatternGame.tsx`
- Create: `src/components/games/MissingNumberGame.tsx`
- Create: `src/components/games/LetterRecognitionGame.tsx`

Nguồn: App.tsx gốc dòng 971–1010 (pattern), 1062–1098 (missing number), 1099–1128 (letter recognition).

- [ ] **Step 1: Viết `src/components/games/PatternGame.tsx`**

```tsx
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface PatternGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function PatternGame({ question, disabled, onAnswer }: PatternGameProps) {
  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-8 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>

      <div className="flex flex-wrap justify-center gap-4 mb-12 items-center min-h-[120px]">
        {question.visual?.map((emoji, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="text-6xl bg-purple-50 w-24 h-24 flex items-center justify-center rounded-2xl border-2 border-purple-100 shadow-sm"
          >
            {emoji}
          </motion.div>
        ))}
        <div className="w-24 h-24 border-4 border-dashed border-purple-300 rounded-2xl flex items-center justify-center text-4xl text-purple-300 animate-pulse">
          ?
        </div>
      </div>

      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="pattern" />
    </div>
  );
}
```

- [ ] **Step 2: Viết `src/components/games/MissingNumberGame.tsx`**

```tsx
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface MissingNumberGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function MissingNumberGame({ question, disabled, onAnswer }: MissingNumberGameProps) {
  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-8 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>

      <div className="flex flex-wrap justify-center gap-4 mb-12 items-center min-h-[120px]">
        {question.visual?.map((val, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`text-6xl w-24 h-24 flex items-center justify-center rounded-2xl border-4 shadow-sm font-black ${val === '?' ? 'border-dashed border-rose-300 text-rose-300 animate-pulse' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
          >
            {val}
          </motion.div>
        ))}
      </div>

      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="rose" />
    </div>
  );
}
```

- [ ] **Step 3: Viết `src/components/games/LetterRecognitionGame.tsx`**

```tsx
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface LetterRecognitionGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function LetterRecognitionGame({ question, disabled, onAnswer }: LetterRecognitionGameProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center mb-12">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => speakText(question.text)}
          className="w-48 h-48 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg border-8 border-amber-200 mb-6"
        >
          <div className="flex flex-col items-center">
            <Volume2 size={80} />
            <span className="text-sm font-bold mt-2">Bấm để nghe</span>
          </div>
        </motion.button>
        <h3 className="text-3xl font-bold text-gray-600">Nghe và chọn chữ nhé!</h3>
      </div>

      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="amber" />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/games/PatternGame.tsx src/components/games/MissingNumberGame.tsx src/components/games/LetterRecognitionGame.tsx
git commit -m "refactor: extract Pattern, MissingNumber, LetterRecognition game components"
```

---

### Task 10: Tạo `src/components/games/ComparisonGame.tsx`

**Files:**
- Create: `src/components/games/ComparisonGame.tsx`

Nguồn: App.tsx gốc dòng 1011–1061. State `draggedSymbol` chuyển từ App vào component này (chỉ nó dùng). Cần biết `feedback === 'correct'` để hiện đáp án trong ô trống → nhận prop `solved`.

- [ ] **Step 1: Viết file**

```tsx
import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';

interface ComparisonGameProps {
  question: Question;
  solved: boolean;
  onAnswer: (option: string) => void;
}

export default function ComparisonGame({ question, solved, onAnswer }: ComparisonGameProps) {
  const [draggedSymbol, setDraggedSymbol] = useState<string | null>(null);

  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-8 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>

      <div className="flex items-center justify-center gap-8 mb-12">
        <div className="text-8xl font-black text-blue-600 bg-blue-50 w-32 h-32 flex items-center justify-center rounded-3xl border-4 border-blue-100">
          {question.visual?.[0]}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const symbol = e.dataTransfer.getData('symbol');
            onAnswer(symbol);
          }}
          className={`w-32 h-32 border-4 border-dashed rounded-3xl flex items-center justify-center text-7xl font-bold transition-all ${solved ? 'bg-green-100 border-green-300 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-300'}`}
        >
          {solved ? question.answer : '?'}
        </div>

        <div className="text-8xl font-black text-pink-600 bg-pink-50 w-32 h-32 flex items-center justify-center rounded-3xl border-4 border-pink-100">
          {question.visual?.[1]}
        </div>
      </div>

      <div className="flex justify-center gap-6">
        {['<', '=', '>'].map((symbol) => (
          <div
            key={symbol}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('symbol', symbol);
              setDraggedSymbol(symbol);
            }}
            onDragEnd={() => setDraggedSymbol(null)}
            onClick={() => onAnswer(symbol)}
            className={`w-24 h-24 flex items-center justify-center text-5xl font-bold bg-white rounded-2xl border-4 border-purple-200 shadow-lg cursor-grab active:cursor-grabbing hover:bg-purple-50 transition-all ${draggedSymbol === symbol ? 'opacity-50 scale-90' : ''}`}
          >
            {symbol}
          </div>
        ))}
      </div>
      <p className="mt-6 text-gray-400 font-medium italic">Kéo dấu vào ô trống hoặc chạm để chọn nhé!</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/games/ComparisonGame.tsx
git commit -m "refactor: extract ComparisonGame with internal drag state"
```

---

### Task 11: Tạo `src/components/games/TracingGame.tsx`

**Files:**
- Create: `src/components/games/TracingGame.tsx`

Gồm: `TracingCanvas` (component nội bộ, copy **nguyên văn** từ App.tsx gốc dòng 172–355, giữ nguyên thuật toán verify coverage > 0.4 / accuracy > 0.3) + UI chọn chữ / tập viết (App.tsx gốc dòng 918–970) với "Voi" → `name`.

- [ ] **Step 1: Viết file**

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Eraser, Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import { LETTER_LIST } from '../../lib/constants.ts';

// ===== TracingCanvas: copy NGUYÊN VĂN App.tsx gốc dòng 172–355 =====
// const TracingCanvas = ({ letter, onComplete, onFail }: { ... }) => { ... };
// (giữ nguyên toàn bộ: drawGuide, startDrawing, stopDrawing, draw, verifyTracing,
//  JSX hai canvas 400x400 + nút Eraser + nút "Hoàn thành")

interface TracingGameProps {
  name: string;
  currentLetter: string;
  showPicker: boolean;
  onSelectLetter: (letter: string) => void;
  onRequestPicker: () => void;
  onComplete: () => void;
  onFail: () => void;
}

export default function TracingGame({
  name,
  currentLetter,
  showPicker,
  onSelectLetter,
  onRequestPicker,
  onComplete,
  onFail
}: TracingGameProps) {
  if (showPicker) {
    return (
      <div className="w-full">
        <h3
          className="text-2xl font-bold text-purple-600 mb-6 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
          onClick={() => speakText(`${name} muốn tập viết chữ nào`)}
        >
          <Volume2 size={24} />
          {name} muốn tập viết chữ nào
        </h3>
        <div className="grid grid-cols-5 md:grid-cols-7 gap-3 max-h-[400px] overflow-y-auto p-2">
          {LETTER_LIST.map(l => (
            <button
              key={l}
              onClick={() => onSelectLetter(l)}
              className="aspect-square flex items-center justify-center text-2xl font-bold bg-purple-50 hover:bg-purple-200 text-purple-700 rounded-xl border-b-4 border-purple-200 active:border-b-0 active:translate-y-1 transition-all"
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3
          className="text-2xl font-bold text-purple-600 cursor-pointer hover:opacity-80 flex items-center gap-2"
          onClick={() => speakText(`${name} tập viết chữ ${currentLetter}`)}
        >
          <Volume2 size={24} />
          {name} tập viết chữ: {currentLetter}
        </h3>
        <button
          onClick={onRequestPicker}
          className="text-sm font-bold text-blue-500 hover:underline"
        >
          Đổi chữ khác
        </button>
      </div>
      <TracingCanvas letter={currentLetter} onComplete={onComplete} onFail={onFail} />
    </div>
  );
}
```

Lưu ý cho người thực thi: phần comment `// ===== TracingCanvas =====` ở trên phải được thay bằng code thật copy nguyên văn dòng 172–355 của App.tsx gốc (component `TracingCanvas` đầy đủ). Việc chọn chữ/đọc giọng nói khi bấm nằm ở App (Task 15) qua `onSelectLetter`/`onRequestPicker`.

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0. Nếu báo `React` unused: bỏ `React` khỏi import, giữ `import { useCallback, useEffect, useRef, useState }` (TracingCanvas dùng `React.MouseEvent`/`React.TouchEvent` trong chữ ký — nếu vậy giữ `import React`).

- [ ] **Step 3: Commit**

```bash
git add src/components/games/TracingGame.tsx
git commit -m "refactor: extract TracingGame with TracingCanvas and letter picker"
```

---

### Task 12: Tạo `src/components/NameEntryScreen.tsx`

**Files:**
- Create: `src/components/NameEntryScreen.tsx`

- [ ] **Step 1: Viết file**

Màn hình mới — phong cách đồng bộ app (card trắng bo tròn, viền vàng, animation motion). Validate: trim không rỗng, maxLength 20. Enter để submit.

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';

interface NameEntryScreenProps {
  initialName: string;
  onSubmit: (name: string) => void;
}

export default function NameEntryScreen({ initialName, onSubmit }: NameEntryScreenProps) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  const submit = () => {
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6 p-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-yellow-300 w-full max-w-md"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-7xl"
      >
        🐘
      </motion.div>
      <h1 className="text-4xl font-bold text-pink-500 drop-shadow-sm">Chào mừng bé! 🌟</h1>
      <p className="text-lg text-blue-600 font-medium">Tên của bé là gì nào?</p>
      <input
        value={name}
        maxLength={20}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Nhập tên bé..."
        className="w-full text-center text-3xl font-bold text-purple-700 bg-purple-50 border-4 border-purple-200 rounded-2xl px-6 py-4 outline-none focus:border-purple-400 placeholder:text-purple-300 placeholder:text-2xl"
      />
      <button
        onClick={submit}
        disabled={!trimmed}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xl shadow-lg transition-all border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Rocket size={24} />
        Bắt đầu học!
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/NameEntryScreen.tsx
git commit -m "feat: add NameEntryScreen for child name input"
```

---

### Task 13: Tạo `src/components/StartScreen.tsx`

**Files:**
- Create: `src/components/StartScreen.tsx`

Nguồn: App.tsx gốc dòng 646–849 (`renderStartScreen`). Khác biệt:
- Tiêu đề: `{name} Vui Học Tập! 🌟`; thêm nút "Đổi tên" nhỏ dưới tagline.
- Settings đọc/ghi qua props `settings` + `onSettingsChange` (state vẫn ở App).

- [ ] **Step 1: Viết file**

```tsx
import { motion } from 'motion/react';
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
import type { GameMode, GameSettings, MathOperator } from '../types.ts';

interface StartScreenProps {
  name: string;
  settings: GameSettings;
  onSettingsChange: (patch: Partial<GameSettings>) => void;
  onStart: (mode: GameMode) => void;
  onChangeName: () => void;
}

export default function StartScreen({ name, settings, onSettingsChange, onStart, onChangeName }: StartScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 p-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-yellow-300 w-full max-w-4xl"
    >
      <h1 className="text-5xl font-bold text-pink-500 mb-2 drop-shadow-sm">{name} Vui Học Tập! 🌟</h1>
      <p className="text-lg text-blue-600 font-medium italic mb-2">"Học mà chơi, chơi mà học"</p>
      <button
        onClick={onChangeName}
        className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors mb-4"
      >
        <Pencil size={14} />
        Đổi tên
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GIỮ NGUYÊN VĂN 8 card chọn game từ App.tsx gốc dòng 656–847, với các thay đổi cơ học sau: */}
        {/* - startGame('xxx')            → onStart('xxx')                                  */}
        {/* - mathRange / setMathRange(r) → settings.mathRange / onSettingsChange({ mathRange: r }) */}
        {/* - mathOperator / setMathOperator(op) → settings.mathOperator / onSettingsChange({ mathOperator: op }) */}
        {/* - sequenceRange / setSequenceRange(r) → settings.sequenceRange / onSettingsChange({ sequenceRange: r }) */}
        {/* - comparisonRange / setComparisonRange(r) → settings.comparisonRange / onSettingsChange({ comparisonRange: r }) */}
        {/* - missingNumberRange / setMissingNumberRange(r) → settings.missingNumberRange / onSettingsChange({ missingNumberRange: r }) */}
      </div>
    </motion.div>
  );
}
```

Lưu ý cho người thực thi: block comment trong `<div className="grid ...">` phải thay bằng JSX thật — copy nguyên văn 8 card (Làm Toán, Tập Đếm, Tập Viết, Quy Luật, Liền Trước/Sau, So Sánh Số, Điền Số Còn Thiếu, Nhận Biết Chữ) từ App.tsx gốc dòng 656–847 rồi áp các thay thế cơ học liệt kê ở trên. Không đổi class/markup nào khác. Khai báo `(['+', '-'] as MathOperator[])` giữ nguyên (vì vậy import `MathOperator`).

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0. Nếu icon nào trong danh sách import không được dùng sau khi copy (đối chiếu: Gamepad2, Trophy, BookOpen, RotateCcw, CheckCircle2, Hash, Volume2, Settings2 đều xuất hiện trong 8 card) thì xoá icon thừa khỏi import.

- [ ] **Step 3: Commit**

```bash
git add src/components/StartScreen.tsx
git commit -m "feat: StartScreen with child name title and change-name button"
```

---

### Task 14: Tạo `src/components/EndScreen.tsx`

**Files:**
- Create: `src/components/EndScreen.tsx`

Nguồn: App.tsx gốc dòng 1179–1210, "Voi đã làm rất tốt!" → `{name} đã làm rất tốt!`.

- [ ] **Step 1: Viết file**

```tsx
import { motion } from 'motion/react';
import { Home, PartyPopper, RotateCcw } from 'lucide-react';

interface EndScreenProps {
  name: string;
  score: number;
  totalCount: number;
  wrongCount: number;
  onHome: () => void;
  onReplay: () => void;
}

export default function EndScreen({ name, score, totalCount, wrongCount, onHome, onReplay }: EndScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center p-12 bg-white rounded-3xl shadow-2xl border-4 border-pink-300 w-full max-w-md"
    >
      <PartyPopper size={80} className="mx-auto text-pink-500 mb-6" />
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Hết giờ rồi!</h2>
      <div className="space-y-2 mb-8">
        <div className="text-5xl font-black text-blue-600">{score} Điểm</div>
        <div className="text-lg font-bold text-gray-400">Đã làm: {totalCount} | Sai: {wrongCount}</div>
      </div>
      <p className="text-xl text-gray-600 mb-8">{name} đã làm rất tốt! Muốn chơi lại không</p>

      <div className="flex flex-col gap-4">
        <button
          onClick={onHome}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
        >
          <Home size={24} />
          Trang chủ
        </button>
        <button
          onClick={onReplay}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold shadow-lg transition-all border-b-4 border-pink-700 active:border-b-0 active:translate-y-1"
        >
          <RotateCcw size={24} />
          Chơi lại
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/EndScreen.tsx
git commit -m "feat: EndScreen with child name"
```

---

### Task 15: Viết lại `src/App.tsx`

**Files:**
- Modify: `src/App.tsx` (thay toàn bộ nội dung)

- [ ] **Step 1: Thay toàn bộ nội dung App.tsx**

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import type { GameMode, GameSettings, Question } from './types.ts';
import { playSound, speakText } from './lib/audio.ts';
import {
  generateComparison,
  generateCounting,
  generateLetterRecognition,
  generateMath,
  generateMissingNumber,
  generatePattern,
  generateSequence
} from './lib/questions.ts';
import NameEntryScreen from './components/NameEntryScreen.tsx';
import StartScreen from './components/StartScreen.tsx';
import EndScreen from './components/EndScreen.tsx';
import GameHUD from './components/GameHUD.tsx';
import FeedbackOverlay from './components/FeedbackOverlay.tsx';
import MathGame from './components/games/MathGame.tsx';
import CountingGame from './components/games/CountingGame.tsx';
import TracingGame from './components/games/TracingGame.tsx';
import PatternGame from './components/games/PatternGame.tsx';
import SequenceGame from './components/games/SequenceGame.tsx';
import ComparisonGame from './components/games/ComparisonGame.tsx';
import MissingNumberGame from './components/games/MissingNumberGame.tsx';
import LetterRecognitionGame from './components/games/LetterRecognitionGame.tsx';

const NAME_STORAGE_KEY = 'childName';

const loadChildName = (): string => {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

const saveChildName = (name: string) => {
  try {
    localStorage.setItem(NAME_STORAGE_KEY, name);
  } catch {
    // localStorage bị chặn (private mode) — tên chỉ sống trong phiên
  }
};

export default function App() {
  const [childName, setChildName] = useState(loadChildName);
  const [editingName, setEditingName] = useState(false);

  const [mode, setMode] = useState<GameMode>('math');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [currentLetter, setCurrentLetter] = useState('A');
  const [showLetterPicker, setShowLetterPicker] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    mathRange: 10,
    mathOperator: '+',
    sequenceRange: 20,
    comparisonRange: 20,
    missingNumberRange: 20
  });

  const handleNameSubmit = (name: string) => {
    saveChildName(name);
    setChildName(name);
    setEditingName(false);
    speakText(`Xin chào ${name}! Cùng học nào!`);
  };

  const resetToHome = () => {
    setGameState('start');
    setQuestion(null);
    setScore(0);
    setWrongCount(0);
    setTotalCount(0);
    setFeedback(null);
    setTimeLeft(30);
    setShowLetterPicker(false);
  };

  const generateQuestionForMode = useCallback((selectedMode: GameMode): Question | null => {
    if (selectedMode === 'math') return generateMath(settings.mathRange, settings.mathOperator);
    if (selectedMode === 'numbers') return generateCounting(childName);
    if (selectedMode === 'pattern') return generatePattern(childName);
    if (selectedMode === 'sequence') return generateSequence(settings.sequenceRange);
    if (selectedMode === 'comparison') return generateComparison(settings.comparisonRange, childName);
    if (selectedMode === 'missing_number') return generateMissingNumber(settings.missingNumberRange, childName);
    if (selectedMode === 'letter_recognition') return generateLetterRecognition(childName);
    return null;
  }, [settings, childName]);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setTimeLeft(30);
    const newQuestion = generateQuestionForMode(mode);

    if (newQuestion) {
      setQuestion(newQuestion);
      speakText(newQuestion.text);
    }
    // In letters mode, we don't auto-next
  }, [mode, generateQuestionForMode]);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setScore(0);
    setWrongCount(0);
    setTotalCount(0);
    setGameState('playing');
    setFeedback(null);
    setTimeLeft(30);
    setQuestion(null);

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

  useEffect(() => {
    if (gameState === 'playing' && !question && mode !== 'letters') {
      nextQuestion();
    }
  }, [gameState, question, mode, nextQuestion]);

  useEffect(() => {
    let timer: number;
    if (gameState === 'playing' && timeLeft > 0 && !feedback && mode !== 'letters') {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing' && mode !== 'letters') {
      setGameState('end');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, feedback, mode]);

  const handleAnswer = (selected: string) => {
    if (feedback === 'correct') return;

    setTotalCount(prev => prev + 1);
    if (selected === question?.answer) {
      setFeedback('correct');
      setScore(prev => prev + 1);
      playSound('correct');
      speakText(`Đúng rồi! ${childName} giỏi quá!`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(nextQuestion, 2000);
    } else {
      setFeedback('wrong');
      setWrongCount(prev => prev + 1);
      playSound('wrong');
      speakText('Chưa đúng rồi!');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handleTracingComplete = () => {
    setTotalCount(prev => prev + 1);
    setScore(prev => prev + 1);
    setFeedback('correct');
    playSound('correct');
    speakText(`${childName} giỏi quá!`);
    confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => {
      setFeedback(null);
      setShowLetterPicker(true);
      speakText(`${childName} muốn tập viết chữ nào tiếp theo`);
    }, 2000);
  };

  const handleTracingFail = () => {
    setFeedback('wrong');
    setWrongCount(prev => prev + 1);
    playSound('wrong');
    speakText('Thử lại nhé!');
    setTimeout(() => setFeedback(null), 1500);
  };

  const handleSelectLetter = (letter: string) => {
    setCurrentLetter(letter);
    setShowLetterPicker(false);
    speakText(`${childName} tập viết chữ ${letter}`);
  };

  const handleRequestPicker = () => {
    setShowLetterPicker(true);
    speakText(`${childName} muốn tập viết chữ nào`);
  };

  const renderGameBody = () => {
    if (!question && mode !== 'letters') return null;
    const disabled = feedback === 'correct';

    switch (mode) {
      case 'letters':
        return (
          <TracingGame
            name={childName}
            currentLetter={currentLetter}
            showPicker={showLetterPicker}
            onSelectLetter={handleSelectLetter}
            onRequestPicker={handleRequestPicker}
            onComplete={handleTracingComplete}
            onFail={handleTracingFail}
          />
        );
      case 'math':
        return <MathGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'numbers':
        return <CountingGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'pattern':
        return <PatternGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'sequence':
        return <SequenceGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'comparison':
        return <ComparisonGame question={question!} solved={disabled} onAnswer={handleAnswer} />;
      case 'missing_number':
        return <MissingNumberGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'letter_recognition':
        return <LetterRecognitionGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      default:
        return null;
    }
  };

  const renderPlaying = () => (
    <div className="w-full max-w-2xl">
      <GameHUD
        totalCount={totalCount}
        wrongCount={wrongCount}
        score={score}
        timeLeft={mode === 'letters' ? null : timeLeft}
        onExit={resetToHome}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={mode === 'letters' ? (showLetterPicker ? 'picker' : currentLetter) : (question?.text ?? '') + (question?.visual?.length || '')}
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.1, x: -20 }}
          className="bg-white rounded-3xl p-8 shadow-xl border-4 border-purple-200 text-center relative overflow-hidden min-h-[550px] flex flex-col items-center justify-center"
        >
          <FeedbackOverlay
            feedback={feedback}
            correctMessage={`Đúng rồi! ${childName} giỏi quá! 🌟`}
            wrongMessage={mode === 'letters' ? `${childName} viết chưa đúng rồi!` : `Sai rồi, ${childName} chọn lại nhé!`}
          />
          {renderGameBody()}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const needsName = !childName || editingName;

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col items-center justify-center p-4 font-sans selection:bg-pink-200" id="app-container">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 w-full flex flex-col items-center">
        {needsName ? (
          <NameEntryScreen initialName={childName} onSubmit={handleNameSubmit} />
        ) : (
          <>
            {gameState === 'start' && (
              <StartScreen
                name={childName}
                settings={settings}
                onSettingsChange={(patch) => setSettings(prev => ({ ...prev, ...patch }))}
                onStart={startGame}
                onChangeName={() => setEditingName(true)}
              />
            )}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'end' && (
              <EndScreen
                name={childName}
                score={score}
                totalCount={totalCount}
                wrongCount={wrongCount}
                onHome={resetToHome}
                onReplay={() => startGame(mode)}
              />
            )}
          </>
        )}
      </main>

      <footer className="mt-12 text-blue-400 font-medium flex items-center gap-2">
        <span>Học mà chơi, chơi mà học</span>
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App orchestrates screens, child name drives all text and speech"
```

---

### Task 16: Verify thủ công toàn luồng

**Files:** không sửa file (chỉ chạy app kiểm tra).

- [ ] **Step 1: Chạy dev server**

Run: `npm run dev` (background)
Expected: Vite ready, app tại `http://localhost:3000`.

- [ ] **Step 2: Checklist kiểm tra trong browser**

1. Lần đầu mở (localStorage trống): hiện NameEntryScreen; nút "Bắt đầu học!" disabled khi input rỗng/toàn space.
2. Nhập tên (vd "Na") → Enter: nghe "Xin chào Na! Cùng học nào!", vào StartScreen tiêu đề "Na Vui Học Tập! 🌟".
3. Reload trang: vào thẳng StartScreen (không hỏi tên lại).
4. Nút "Đổi tên": quay lại NameEntryScreen, input prefill "Na"; đổi tên mới → StartScreen cập nhật.
5. Làm Toán: đề "a + b = ?", trả lời đúng → overlay "Đúng rồi! Na giỏi quá! 🌟" + confetti + giọng đọc có tên; sai → "Sai rồi, Na chọn lại nhé!".
6. Tập Đếm / Quy Luật / So Sánh (cả kéo-thả lẫn chạm) / Liền Trước-Sau / Điền Số Thiếu / Nhận Biết Chữ: text câu hỏi chứa tên, giọng đọc khớp, timer 30s chạy, hết giờ ra EndScreen "Na đã làm rất tốt!".
7. Tập Viết: picker đọc "Na muốn tập viết chữ nào", chọn chữ → vẽ → "Hoàn thành" đúng → "Na giỏi quá!" rồi quay lại picker; vẽ bậy → "Na viết chưa đúng rồi!"; không có timer trên HUD.
8. Cài đặt phạm vi (10/20/50/100) và phép tính (Cộng/Trừ) trên StartScreen có hiệu lực trong game.

- [ ] **Step 3: Dừng dev server, commit cuối (nếu có sửa lỗi phát sinh)**

```bash
git status
git add -A
git commit -m "fix: address issues found during manual verification"  # chỉ khi có thay đổi
```

---

## Self-Review (đã chạy)

1. **Spec coverage:** Cấu trúc file (Task 1–14) ✓; NameEntryScreen + localStorage + try/catch (Task 12, 15) ✓; "Đổi tên" (Task 13, 15) ✓; thay "Voi" bằng tên trong text + voice (Task 4, 11, 13, 14, 15) ✓; giữ nguyên gameplay (code copy nguyên văn) ✓; kiểm chứng lint + manual (mọi task + Task 16) ✓.
2. **Placeholder scan:** Hai chỗ "copy nguyên văn dòng X–Y" (EMOJIS/PATTERN_TYPES, TracingCanvas, 8 card StartScreen) là chỉ dẫn di chuyển code có địa chỉ chính xác kèm danh sách thay thế cơ học — không phải TBD.
3. **Type consistency:** `GameSettings` (Task 1) dùng ở Task 13/15; chữ ký generators (Task 4) khớp lời gọi trong `generateQuestionForMode` (Task 15); props từng game component khớp `renderGameBody`; `ComparisonGame` dùng `solved` (không phải `disabled`) — nhất quán ở cả hai phía.
