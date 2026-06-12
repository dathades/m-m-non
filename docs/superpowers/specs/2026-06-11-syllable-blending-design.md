# Design: Bài tập "Ghép vần / đánh vần" (ghép tiếng có thanh điệu)

**Ngày:** 2026-06-11
**Trạng thái:** Đã duyệt

## Mục tiêu

Thêm chế độ chơi mới dạy bé ghép **âm đầu + vần + dấu thanh** thành một tiếng
(vd `c` + `a` + sắc → "cá"), theo 3 bước trắc nghiệm, có tranh emoji khi có và
luôn đọc mẫu tiếng đích. Tái dùng hạ tầng sẵn (lưới đáp án, `speakText` vi-VN,
emoji, tên bé, confetti, đồng hồ, màn hết giờ).

## Quyết định đã chốt

| Hạng mục | Lựa chọn |
|---|---|
| Cấp độ | Ghép tiếng **có thanh điệu**: âm đầu + vần + dấu thanh |
| Cơ chế | **3 bước trắc nghiệm**: âm đầu → vần → dấu; tiếng lớn dần |
| Ra đề | Danh sách tiếng tự soạn; có tranh emoji khi có; **luôn đọc mẫu** tiếng đích |
| Đồng hồ | **Có** — 30s mỗi tiếng, hết giờ → màn "Hết giờ" (giống game Toán) |
| Cài đặt | Không (thẻ đơn giản, cố định 4 lựa chọn/bước) cho v1 |

## Luồng chơi (một tiếng)

1. Ra đề: hiện emoji (nếu có) + nút loa đọc tiếng đích (vd 🐟, đọc "cá"). Đồng hồ 30s bắt đầu cho tiếng này.
2. **Bước 1 – Âm đầu:** lưới 4 nút (đáp án đúng `c` + 3 nhiễu). Chọn đúng → phần ghép hiện "c", sang bước 2.
3. **Bước 2 – Vần:** lưới 4 nút (`a` + 3 nhiễu). Chọn đúng → ghép "ca", đọc "ca", sang bước 3.
4. **Bước 3 – Dấu thanh:** lưới 4 nút dấu, mỗi nút hiện mark trên chữ `a` mẫu + tên
   (vd `á` / "sắc", `à` / "huyền", `a` / "không", `ả` / "hỏi"). Chọn đúng → ra "cá",
   đọc "cá", **confetti + cộng điểm**, overlay "Đúng rồi! {tên} giỏi quá!" ~2s,
   rồi sinh tiếng mới + reset đồng hồ 30s.
5. Chọn **sai** ở bất kỳ bước nào → tính 1 Sai (wrongCount++), overlay "Sai rồi…" ~1.5s,
   ở lại bước đó cho làm lại. (Bước đúng giữa chừng KHÔNG hiện overlay — chuyển nhanh.)
6. Hết 30s khi đang dở một tiếng → màn "Hết giờ" (như game Toán). Điểm = số tiếng ghép xong.

## Dữ liệu — `src/lib/syllables.ts`

```ts
export type Tone = 'không' | 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng';

export interface WordEntry {
  onset: string;   // âm đầu, vd 'c', 'b', 'nh'
  rhyme: string;   // vần KHÔNG dấu, vd 'a', 'eo', 'ây'
  tone: Tone;      // thanh điệu
  syllable: string;// tiếng cuối ĐÃ có dấu, vd 'cá'  (lưu sẵn → không cần thuật toán đặt dấu)
  emoji?: string;  // tranh minh hoạ nếu có
}

export interface ToneOption { tone: Tone; demo: string; } // demo = dấu đặt trên 'a': á à ả ã ạ a

export interface BlendChallenge {
  target: WordEntry;
  onsetOptions: string[]; // 4 lựa chọn, gồm target.onset
  rhymeOptions: string[]; // 4 lựa chọn, gồm target.rhyme
  toneOptions: ToneOption[]; // 4 lựa chọn, gồm target.tone
}

export const WORDS: WordEntry[];               // ~18–20 tiếng, phủ đủ 6 thanh
export const ONSETS: string[];                 // kho âm đầu sinh nhiễu
export const RHYMES: string[];                 // kho vần sinh nhiễu
export const TONES: ToneOption[];              // 6 thanh + chữ 'a' mẫu

export function generateBlendingChallenge(): BlendChallenge;
```

- **Lưu sẵn `syllable`** (tiếng đã có dấu) nên không cần đặt dấu bằng thuật toán.
  Phần ghép giữa chừng = `onset` rồi `onset + rhyme` (nối chuỗi thường, vd "c", "ca");
  tiếng cuối = `syllable` ("cá").
- `generateBlendingChallenge`: chọn ngẫu nhiên 1 `WordEntry`; mỗi bộ option = đáp án
  đúng + 3 nhiễu khác nhau lấy ngẫu nhiên từ kho tương ứng, đã trộn (dùng cùng kiểu
  `shuffle` như `src/lib/questions.ts`). `toneOptions` lấy 3 nhiễu từ 6 thanh.
- Danh sách khởi điểm (phủ đủ 6 thanh, ưu tiên có emoji), vd:
  cá🐟(c+a+sắc), gà🐔(g+a+huyền), bò🐮(b+o+huyền), dê🐐(d+ê+không), voi🐘(v+oi+không),
  gấu🐻(g+âu+sắc), mèo🐱(m+eo+huyền), lá🍃(l+a+sắc), vịt🦆(v+it+nặng), sữa🥛(s+ưa+ngã),
  mũ🎩(m+u+ngã), cờ🚩(c+ơ+huyền), dù☂️(d+u+huyền), cua🦀(c+ua+không), hổ🐯(h+ô+hỏi),
  mây☁️(m+ây+không), bơ🥑(b+ơ+không), lạc🥜(l+ac+nặng), nho🍇(nh+o+không), bé👶(b+e+sắc).
  (Danh sách có thể mở rộng sau; mỗi tiếng đều CÓ âm đầu để 3 bước đồng nhất.)

## Component & tích hợp

- `src/components/games/BlendingGame.tsx` — **thuần trình bày**. Props:
  `{ name, challenge, step, feedback, onPick }` với `step: 0|1|2` (âm đầu/vần/dấu).
  Hiển thị: ô đề (emoji nếu có + nút loa đọc `challenge.target.syllable`), phần ghép
  hiện tại (theo `step`), nhãn bước ("Chọn âm đầu" / "Chọn vần" / "Chọn dấu thanh"),
  và `AnswerGrid` cho options của bước hiện tại. Nút dấu hiển thị `demo` + tên thanh.
  Gọi `onPick(value)` (value = chuỗi onset/rhyme, hoặc `Tone` cho bước dấu).
- `App.tsx` thêm:
  - `GameMode` thêm `'blending'` (`src/types.ts`).
  - State: `blendChallenge: BlendChallenge | null`, `blendStep: 0 | 1 | 2`.
  - `startGame('blending')`: `generateBlendingChallenge()`, `blendStep=0`, `timeLeft=30`,
    đọc tiếng đích.
  - `handleBlendPick(value)`:
    - Sai (value ≠ phần đúng của bước) → `wrongCount++`, `playSound('wrong')`,
      `speakText('Chưa đúng rồi!')`, `feedback='wrong'`, xoá feedback sau 1.5s, giữ nguyên bước.
    - Đúng & chưa phải bước cuối → `blendStep++`; đọc phần ghép mới khi đã thành tiếng
      (sau vần đọc `onset+rhyme`); KHÔNG overlay, KHÔNG reset giờ.
    - Đúng & là bước cuối (dấu) → `score++`, `playSound('correct')`, confetti,
      `speakText(target.syllable)` rồi khen `${childName} giỏi quá!`, `feedback='correct'`;
      sau 2s: `generateBlendingChallenge()` mới, `blendStep=0`, `timeLeft=30`, `feedback=null`.
  - **Đồng hồ:** blending là chế độ **có giờ** → giữ trong nhánh đếm giờ hiện tại
    (các guard `mode !== 'letters'` KHÔNG loại blending; đồng hồ chạy và hết giờ → end như game Toán).
  - **Loại blending khỏi effect tự gọi `nextQuestion`** (effect fallback dựa trên `question`):
    đổi điều kiện thành `mode !== 'letters' && mode !== 'blending'` (blending dùng
    `blendChallenge` chứ không dùng `question`).
  - `renderGameBody` thêm `case 'blending'` → `<BlendingGame name={childName}
    challenge={blendChallenge!} step={blendStep} feedback={feedback} onPick={handleBlendPick} />`.
  - `StartScreen.tsx`: thêm 1 thẻ "Ghép Vần" (không cài đặt) gọi `onStart('blending')`,
    màu/icon đồng bộ (vd teal + icon `Combine`/`Blocks` của lucide).
- `FeedbackOverlay`/`GameHUD`/`EndScreen` tái dùng nguyên trạng.

## Xử lý lỗi / biên

- `blendChallenge` null khi chưa khởi tạo: `renderGameBody` chỉ render khi đã có
  (startGame luôn tạo trước khi vào playing) — guard `challenge!` an toàn nhờ thứ tự đó;
  thêm guard nhẹ trong BlendingGame nếu `!challenge` → không render.
- Không đọc lẻ phụ âm đầu (máy đọc "c" → "xê", sai kiểu đánh vần): chỉ đọc khi đã
  thành tiếng (sau vần đọc "ca", sau dấu đọc "cá").
- Sinh đáp án nhiễu phải khác đáp án đúng và khác nhau (dùng `Set`/lọc trùng).
- `speakText` thay ký hiệu (+ - = ? < >) — tên thanh và tiếng tiếng Việt không chứa
  các ký hiệu đó nên không xung đột.

## Kiểm chứng

Project không có test framework (không thêm trong scope).
1. `npm run lint` (tsc --noEmit) pass; `npm run build` pass.
2. Unit test thuần bằng `tsx` cho `generateBlendingChallenge` (chạy nhiều lần):
   - mỗi bộ option có đúng 4 phần tử, không trùng;
   - đáp án đúng (`target.onset` / `target.rhyme` / `target.tone`) luôn nằm trong bộ option tương ứng;
   - `target` luôn thuộc `WORDS`.
3. Checklist thủ công qua `npm run dev`:
   - Cả 3 bước hoạt động, tiếng lớn dần đúng (c → ca → cá), đọc đúng mẫu.
   - Chọn sai tính 1 Sai + cho làm lại; chọn đúng bước cuối → confetti + điểm + tiếng mới + reset 30s.
   - Hết 30s trên một tiếng → màn "Hết giờ"; "Chơi lại"/"Trang chủ" hoạt động.
   - Emoji hiện khi có; tiếng không emoji vẫn đọc mẫu được.
   - Text/giọng xưng tên bé như toàn app.

## Ngoài scope

- Không đánh vần kiểu đọc từng bước "bờ-a-ba" bằng giọng (chỉ đọc phần ghép & tiếng cuối).
- Không thuật toán đặt dấu (lưu sẵn tiếng cuối).
- Không cài đặt độ khó, không tiếng không-âm-đầu (ăn, áo, ô) ở v1.
- Không đổi các game khác.
