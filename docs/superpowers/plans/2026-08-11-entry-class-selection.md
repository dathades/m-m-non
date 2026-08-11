# Entry Screen + Class Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gộp nhập tên + chọn lớp (Mầm non / Lớp 4) vào một màn đầu vào, lưu lớp vào localStorage, và thêm nút "Đổi lớp"; chọn lớp chưa ảnh hưởng nội dung game.

**Architecture:** Đổi `NameEntryScreen` → `EntryScreen` (nhập tên + 2 thẻ chọn lớp). `App` lưu `childClass` song song `childName`, gate vào cần cả hai, và một cờ `editingSetup` mở lại màn đầu vào. `StartScreen` thêm nút "Đổi lớp".

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 + motion + lucide-react.

**Spec:** `docs/superpowers/specs/2026-08-11-entry-class-selection-design.md`

---

## File Structure

- Modify `src/types.ts` — thêm `ClassLevel`.
- Create `src/components/EntryScreen.tsx` — màn nhập tên + chọn lớp (thay `NameEntryScreen`).
- Delete `src/components/NameEntryScreen.tsx` — thay bằng `EntryScreen`.
- Modify `src/App.tsx` — state/persistence lớp, gate, render, `editingSetup`.
- Modify `src/components/StartScreen.tsx` — nút "Đổi lớp".

**Không có logic thuần để unit-test.** Cổng kiểm mỗi task: `npm run lint` (tsc --noEmit). Cuối cùng: `npm run build` + `npm test` (33 test cũ vẫn xanh) + chơi thử.

---

## Task 1: Thêm kiểu `ClassLevel`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Thêm type**

Thêm vào cuối `src/types.ts`:
```ts
export type ClassLevel = 'mam_non' | 'lop_4';
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add ClassLevel type"
```

---

## Task 2: Tạo component `EntryScreen`

**Files:**
- Create: `src/components/EntryScreen.tsx`

(Chưa xoá `NameEntryScreen.tsx` và chưa đổi `App` ở task này — để lint luôn xanh; việc chuyển + xoá ở Task 3.)

- [ ] **Step 1: Viết component**

Create `src/components/EntryScreen.tsx`:
```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';
import type { ClassLevel } from '../types.ts';

interface EntryScreenProps {
  initialName: string;
  initialClass: ClassLevel | '';
  onSubmit: (name: string, level: ClassLevel) => void;
}

const CLASSES: { value: ClassLevel; label: string; emoji: string }[] = [
  { value: 'mam_non', label: 'Mầm non', emoji: '🧸' },
  { value: 'lop_4', label: 'Lớp 4', emoji: '🎓' },
];

export default function EntryScreen({ initialName, initialClass, onSubmit }: EntryScreenProps) {
  const [name, setName] = useState(initialName);
  const [level, setLevel] = useState<ClassLevel | ''>(initialClass);
  const trimmed = name.trim();
  const canSubmit = trimmed !== '' && level !== '';

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(trimmed, level as ClassLevel);
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

      <div>
        <p className="text-lg text-blue-600 font-medium mb-3">Bé học lớp nào?</p>
        <div className="grid grid-cols-2 gap-4">
          {CLASSES.map((c) => (
            <button
              key={c.value}
              onClick={() => setLevel(c.value)}
              className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-4 font-bold text-xl transition-all ${
                level === c.value
                  ? 'border-purple-400 bg-purple-100 text-purple-700 scale-105'
                  : 'border-purple-200 bg-purple-50 text-purple-400 hover:border-purple-300'
              }`}
            >
              <span className="text-4xl">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-lg text-blue-600 font-medium mb-3">Tên của bé là gì nào?</p>
        <input
          value={name}
          maxLength={20}
          autoFocus
          onChange={(e) => setName(e.target.value.replace(/[-+=<>?]/g, ''))}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit(); }}
          placeholder="Nhập tên bé..."
          className="w-full text-center text-3xl font-bold text-purple-700 bg-purple-50 border-4 border-purple-200 rounded-2xl px-6 py-4 outline-none focus:border-purple-400 placeholder:text-purple-300 placeholder:text-2xl"
        />
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xl shadow-lg transition-all border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Rocket size={24} />
        Bắt đầu học!
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors. (File mới chưa dùng — không sao.)

- [ ] **Step 3: Commit**

```bash
git add src/components/EntryScreen.tsx
git commit -m "feat: EntryScreen with name + class selection"
```

---

## Task 3: Tích hợp vào `App.tsx` (và xoá `NameEntryScreen`)

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/NameEntryScreen.tsx`

- [ ] **Step 1: Sửa import**

Trong `src/App.tsx`, dòng import type từ `./types.ts` hiện là:
```ts
import type { GameMode, GameSettings, Question } from './types.ts';
```
Đổi thành:
```ts
import type { ClassLevel, GameMode, GameSettings, Question } from './types.ts';
```
Và đổi dòng:
```ts
import NameEntryScreen from './components/NameEntryScreen.tsx';
```
thành:
```ts
import EntryScreen from './components/EntryScreen.tsx';
```

- [ ] **Step 2: Thêm khóa + hàm lưu/đọc lớp**

Ngay sau khối `saveChildName` (sau dòng đóng `};` của nó, khoảng dòng 54), thêm:
```ts
const CLASS_STORAGE_KEY = 'childClass';

const loadChildClass = (): ClassLevel | '' => {
  try {
    const v = localStorage.getItem(CLASS_STORAGE_KEY);
    return v === 'mam_non' || v === 'lop_4' ? v : '';
  } catch {
    return '';
  }
};

const saveChildClass = (level: ClassLevel) => {
  try {
    localStorage.setItem(CLASS_STORAGE_KEY, level);
  } catch {
    // localStorage bị chặn (private mode) — lớp chỉ sống trong phiên
  }
};
```

- [ ] **Step 3: Thêm state lớp + đổi `editingName` → `editingSetup`**

Thay hai dòng:
```ts
  const [childName, setChildName] = useState(loadChildName);
  const [editingName, setEditingName] = useState(false);
```
bằng:
```ts
  const [childName, setChildName] = useState(loadChildName);
  const [childClass, setChildClass] = useState<ClassLevel | ''>(loadChildClass);
  const [editingSetup, setEditingSetup] = useState(false);
```

- [ ] **Step 4: Gộp handler submit**

Thay toàn bộ `handleNameSubmit`:
```ts
  const handleNameSubmit = (name: string) => {
    saveChildName(name);
    setChildName(name);
    setEditingName(false);
    speakText(`Xin chào ${name}! Cùng học nào!`);
  };
```
bằng:
```ts
  const handleSetupSubmit = (name: string, level: ClassLevel) => {
    saveChildName(name);
    saveChildClass(level);
    setChildName(name);
    setChildClass(level);
    setEditingSetup(false);
    speakText(`Xin chào ${name}! Cùng học nào!`);
  };
```

- [ ] **Step 5: Đổi gate `needsName` → `needsSetup`**

Thay dòng:
```ts
  const needsName = !childName || editingName;
```
bằng:
```ts
  const needsSetup = !childName || !childClass || editingSetup;
```

- [ ] **Step 6: Đổi phần render đầu vào + nút đổi tên/lớp**

Thay khối:
```tsx
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
```
bằng:
```tsx
        {needsSetup ? (
          <EntryScreen initialName={childName} initialClass={childClass} onSubmit={handleSetupSubmit} />
        ) : (
          <>
            {gameState === 'start' && (
              <StartScreen
                name={childName}
                settings={settings}
                onSettingsChange={(patch) => setSettings(prev => ({ ...prev, ...patch }))}
                onStart={startGame}
                onChangeName={() => setEditingSetup(true)}
                onChangeClass={() => setEditingSetup(true)}
              />
            )}
```

- [ ] **Step 7: Thêm icon `GraduationCap` vào import lucide của StartScreen**

Trong `src/components/StartScreen.tsx`, khối import từ `lucide-react`, thêm `GraduationCap`:
```ts
  Gamepad2,
  GraduationCap,
  Hash,
```

- [ ] **Step 8: Thêm prop `onChangeClass` cho StartScreen**

Trong `interface StartScreenProps`, thêm dòng:
```ts
  onChangeClass: () => void;
```
Và thêm `onChangeClass` vào tham số destructure của component:
```ts
export default function StartScreen({ name, settings, onSettingsChange, onStart, onChangeName, onChangeClass }: StartScreenProps) {
```

- [ ] **Step 9: Thêm nút "Đổi lớp" cạnh "Đổi tên" trong StartScreen**

Thay khối nút "Đổi tên" hiện tại:
```tsx
      <button
        onClick={onChangeName}
        className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors mb-4"
      >
        <Pencil size={14} />
        Đổi tên
      </button>
```
bằng:
```tsx
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={onChangeName}
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors"
        >
          <Pencil size={14} />
          Đổi tên
        </button>
        <button
          onClick={onChangeClass}
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors"
        >
          <GraduationCap size={14} />
          Đổi lớp
        </button>
      </div>
```

- [ ] **Step 10: Xoá component cũ + lint**

Run:
```bash
git rm src/components/NameEntryScreen.tsx
npm run lint
```
Expected: no TypeScript errors (App + StartScreen giờ khớp prop `onChangeClass`, không còn tham chiếu `NameEntryScreen`).

- [ ] **Step 11: Commit**

```bash
git add src/App.tsx src/components/StartScreen.tsx
git commit -m "feat: wire class selection into App entry gate + Đổi lớp button"
```

---

## Task 4: Kiểm thử toàn diện

**Files:** (không sửa code)

- [ ] **Step 1: Lint + build + test**

Run:
```bash
npm run lint && npm run build && npm test
```
Expected: tsc không lỗi; build thành công; 33 test cũ pass.

- [ ] **Step 2: Chơi thử thủ công**

Run `npm run dev`, mở http://localhost:3000. Xoá localStorage (DevTools → Application → Local Storage → xoá `childName`, `childClass`) để giả lập vào lần đầu, rồi kiểm:
- Màn đầu vào hiện 2 thẻ lớp (Mầm non 🧸 / Lớp 4 🎓) + ô tên. Nút "Bắt đầu học!" **mờ** cho tới khi chọn lớp **và** nhập tên.
- Chọn lớp (thẻ nổi bật), nhập tên, bấm Bắt đầu → vào `StartScreen`. Cả hai lớp vào cùng màn game như nhau.
- Ở `StartScreen` có 2 nút nhỏ: "Đổi tên" và "Đổi lớp". Bấm mỗi nút → mở lại màn đầu vào, **điền sẵn** tên + lớp đang dùng; đổi rồi bấm Bắt đầu quay lại được.
- Tải lại trang (F5) → vào thẳng `StartScreen`, không hỏi lại (đã nhớ localStorage).
- Chơi thử một game bất kỳ (vd Đánh Vần) vẫn chạy bình thường.

- [ ] **Step 3: Commit (nếu có chỉnh nhỏ khi kiểm)**

```bash
git add -A
git commit -m "test: manual verification for entry class selection"
```

---

## Ghi chú
- Chọn lớp hiện chưa lọc game — đúng chủ ý (nội dung lớp 4 làm ở buổi sau).
- Cả "Đổi tên" và "Đổi lớp" mở cùng màn đầu vào (một màn làm cả hai việc).
