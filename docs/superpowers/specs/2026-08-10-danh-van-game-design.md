# Thiết kế: Game "Đánh Vần"

Ngày: 2026-08-10

## Mục tiêu

Thêm một trò chơi mới dạy bé đánh vần tiếng Việt theo cách hiện hành:
bắt đầu từ **âm đầu bên trái**, ghép với **vần**, rồi thêm **dấu (thanh)**.
Ví dụ tiếng "cá": `cờ – a – ca – dấu sắc – cá`.

Trò chơi theo **kiểu chọn từng bước** (trắc nghiệm 3 bước), tính điểm theo
pipeline chung của app (mỗi tiếng = 1 câu, đồng hồ 30 giây).

## Trải nghiệm chơi

Mỗi lượt (1 tiếng):

1. Hiện **tranh** (emoji) + nút **🔊 Nghe lại**; app đọc tiếng khi bắt đầu.
2. **Bước 1 — Âm đầu:** "Tiếng này bắt đầu bằng âm nào?"
   4 đáp án là chữ cái âm đầu, kèm **nhãn cách đọc** (vd `c` → "cờ").
3. **Bước 2 — Vần:** "Vần của tiếng này là gì?"
   4 đáp án là vần không dấu (vd `a`), nhãn = chính nó.
4. **Bước 3 — Dấu:** "Tiếng này có dấu gì?"
   4 đáp án là **tên dấu + ký hiệu**: dấu sắc ◌́, dấu huyền ◌̀, dấu hỏi ◌̉,
   dấu ngã ◌̃, dấu nặng ◌̣, và "ngang" (không dấu). **Không** hiện tiếng
   kết quả (cá/cà/cả/cạ) để tránh phải sinh dấu bằng máy.

Quy tắc phản hồi:
- Chọn **sai**: thẻ rung, phát "chưa đúng", tăng `wrongCount`. Không chuyển bước.
- Chọn **đúng**: đọc âm/vần/tên-dấu vừa chọn, chuyển bước tiếp theo.
- **Đúng cả 3 bước**: hiện **chuỗi đánh vần đầy đủ** `cờ – a – ca – dấu sắc – cá`
  (trước đó ẩn hoàn toàn), app đọc lại cả chuỗi, confetti, +1 điểm, rồi sang
  tiếng mới.

Với tiếng **thanh ngang** (vd "voi"): chuỗi cuối chỉ là `vờ – oi – voi`
(không có bước "cộng dấu"), nhưng bước 3 vẫn hỏi và đáp án đúng là "ngang".

## Kiến trúc

Bám sát pattern sẵn có. Điểm khác biệt: đây là trò chơi nhiều bước trong 1
"câu hỏi", nên đứng riêng như `TracingGame` (không dùng `handleAnswer` đơn lẻ).

### 1. Dữ liệu & hàm sinh đề — `src/lib/syllables.ts` (mở rộng)

Tái dùng `WORDS` và `ONSETS` đã có. Thêm:

- `ONSET_READINGS: Record<string, string>` — cách đọc âm đầu (theo âm/phonics):
  `b→bờ, c→cờ, ch→chờ, d→dờ, đ→đờ, g→gờ, gh→gờ, gi→dờ, h→hờ, k→cờ, kh→khờ,
  l→lờ, m→mờ, n→nờ, ng→ngờ, ngh→ngờ, nh→nhờ, p→pờ, ph→phờ, qu→quờ, r→rờ,
  s→sờ, t→tờ, th→thờ, tr→trờ, v→vờ, x→xờ`.
  (Phủ mọi âm đầu xuất hiện trong `WORDS`; bổ sung dần nếu thêm từ. Các giá trị
  đọc gom một chỗ, dễ rà/sửa theo sách giáo khoa mục tiêu.)
- `TONE_LABELS: Record<Tone, string>` — nhãn dấu:
  `không→ngang, sắc→sắc, huyền→huyền, hỏi→hỏi, ngã→ngã, nặng→nặng`.
- `TONE_MARKS: Record<Tone, string>` — ký hiệu dấu để hiển thị:
  `sắc→◌́, huyền→◌̀, hỏi→◌̉, ngã→◌̃, nặng→◌̣, không→''`.

Kiểu và hàm sinh:

```ts
export interface SpellStepOption {
  display: string;   // chữ hiển thị lớn (âm đầu / vần / ký hiệu dấu)
  reading: string;   // nhãn cách đọc dưới đáp án ("cờ", "a", "dấu sắc")
  value: string;     // giá trị so khớp (onset / rhyme / tone)
}

export interface SpellingRound {
  emoji: string;
  syllable: string;          // "cá"
  blend: string;             // "ca" = onset + rhyme (không dấu)
  onset: string;             // "c"
  rhyme: string;             // "a"
  tone: Tone;                // "sắc"
  onsetReading: string;      // "cờ"
  toneLabel: string;         // "sắc" (hoặc "ngang")
  hasTone: boolean;          // tone !== 'không'
  onsetOptions: SpellStepOption[];
  rhymeOptions: SpellStepOption[];
  toneOptions: SpellStepOption[];
}

export function generateSpellingRound(): SpellingRound;
```

Logic `generateSpellingRound`:
- Chọn ngẫu nhiên 1 `WordEntry` từ `WORDS`.
- `blend = word.onset + word.rhyme`.
- `onsetOptions`: đáp án đúng `onset` + 3 nhiễu lấy ngẫu nhiên từ `ONSETS`
  (khác nhau, khác đáp án đúng); mỗi option `display=onset`,
  `reading=ONSET_READINGS[onset] ?? onset`, `value=onset`. Xáo trộn.
- `rhymeOptions`: đáp án đúng `rhyme` + 3 nhiễu từ tập vần duy nhất trong
  `WORDS` (khác đáp án); `display=reading=value=rhyme`. Xáo trộn.
- `toneOptions`: đáp án đúng `tone` + 3 nhiễu từ 6 thanh (khác đáp án);
  `display=TONE_MARKS[tone]` (rỗng cho ngang → hiển thị "ngang"),
  `reading = tone==='không' ? 'ngang' : 'dấu '+TONE_LABELS[tone]`,
  `value=tone`. Xáo trộn.
- Tái dùng `shuffle` và `pickDistractors` có sẵn (mở rộng `pickDistractors`
  để nhận pool tổng quát — đã có sẵn dạng này).

Hàm thuần, không side-effect ngoài `Math.random` → dễ test.

### 2. Kiểu — `src/types.ts`

- Thêm `'spelling'` vào union `GameMode`.
- (`SpellingRound` để trong `syllables.ts` cùng logic, không nhét vào `types.ts`.)

### 3. Component — `src/components/games/SpellingGame.tsx` (mới)

Props:
```ts
interface SpellingGameProps {
  round: SpellingRound;
  disabled: boolean;
  onComplete: () => void;   // đúng cả 3 bước
  onWrong: () => void;      // mỗi lần chọn sai
}
```
Trách nhiệm:
- Giữ state nội bộ `step: 0|1|2` và trạng thái "đã xong".
- Reset `step=0` khi `round` đổi (dựa vào `round.syllable` qua `useEffect`/`key`).
- Render tranh + nút Nghe lại + câu hỏi + lưới 4 đáp án theo `step`.
- Chọn đúng: `speakText(reading)`, tăng `step`; chọn sai: rung thẻ + `onWrong()`.
- Sau bước 3: render **chuỗi đánh vần**, đọc tuần tự cả chuỗi
  (`onsetReading → rhyme → blend → toneLabel → syllable`, bỏ 2 phần cuối nếu
  `!hasTone`), rồi gọi `onComplete()`.
- Phần chữ cái/tiếng dùng class `.font-spell` (Tinos).
- Tái dùng `AnswerGrid` nếu vừa; nếu cần nhãn phụ dưới mỗi đáp án thì render
  lưới riêng trong component (AnswerGrid hiện chỉ nhận chuỗi option).

### 4. `App.tsx`

- `generateQuestionForMode`: thêm nhánh `'spelling'`. Vì `SpellingRound` không
  phải `Question`, lưu round vào state riêng `spellingRound` thay vì `question`.
  Theo pattern hiện tại: thêm state `const [spellingRound, setSpellingRound]`.
- Khởi tạo/nạp vòng mới trong `startGame`/`nextQuestion` khi `mode==='spelling'`
  (đọc `round.syllable` khi bắt đầu).
- `renderGameBody`: case `'spelling'` → `<SpellingGame round={spellingRound!}
  disabled={...} onComplete={handleSpellingComplete} onWrong={handleSpellingWrong} />`.
- `handleSpellingComplete`: `totalCount++`, `score++`, `playSound('correct')`,
  `speakText('… giỏi quá!')`, confetti, `setTimeout(nextQuestion, ~2500)`.
- `handleSpellingWrong`: `playSound('wrong')` + `wrongCount++` (feedback rung do
  component tự lo; không bật `FeedbackOverlay` toàn màn).
- Đồng hồ 30s dùng chung (mode `'spelling'` đi theo nhánh có timer như các game
  trắc nghiệm, không phải nhánh `'letters'`).
- `AnimatePresence key`: dùng `spellingRound?.syllable` cho mode này.

### 5. `StartScreen.tsx`

Thêm 1 ô game "Đánh Vần":
- Màu: fuchsia/pink (chưa dùng), icon `BookOpenText` (lucide) hoặc `SpellCheck`.
- Nhãn: **"Đánh Vần"**, phụ đề "Ghép âm thành tiếng".
- `onClick={() => onStart('spelling')}`.

### 6. Font — `index.html`

Nhúng Google Fonts **Tinos** (Times Unicode, tiếng Việt đầy đủ):
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap" rel="stylesheet" />
```
Trong `src/index.css` thêm tiện ích:
```css
.font-spell { font-family: 'Tinos', 'Times New Roman', serif; }
```

## Kiểm thử

Thêm **Vitest** cho hàm sinh đề (phần logic thuần, dễ vỡ nhất).

- Thêm `vitest` vào devDependencies, script `"test": "vitest run"`.
- File `src/lib/syllables.test.ts`, kiểm `generateSpellingRound()` (chạy nhiều
  lần để phủ ngẫu nhiên):
  - Mỗi bước có đúng 4 option, **có chứa đáp án đúng**.
  - Các option **không trùng** `value` nhau.
  - `blend === onset + rhyme`.
  - `value` đáp án đúng khớp `onset`/`rhyme`/`tone` của từ.
  - `onsetReading === ONSET_READINGS[onset]`; `toneLabel` đúng map;
    ngang khi `tone==='không'`.
  - `hasTone === (tone !== 'không')`.
- Kiểm còn lại: `npm run lint` (tsc) + chơi thử thủ công (âm thanh, confetti,
  ẩn/hiện chuỗi, font Tinos hiển thị đúng dấu).

## Ngoài phạm vi (YAGNI)

- Không thêm bộ quy tắc đặt dấu tiếng Việt (không sinh cá/cà/cả/cạ).
- Không tách vần thành âm đệm/âm chính/âm cuối — vần là 1 đơn vị.
- Không thêm màn cài đặt riêng cho game này.
- Không đổi các game hiện có.
