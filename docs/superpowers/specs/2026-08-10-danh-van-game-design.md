# Thiết kế: Game "Đánh Vần"

Ngày: 2026-08-10

## Mục tiêu

Thêm trò chơi dạy bé đánh vần tiếng Việt theo cách hiện hành: bắt đầu từ
**âm đầu bên trái**, ghép với **vần**, rồi thêm **dấu (thanh)**.
Ví dụ "cá": `cờ – a – ca – dấu sắc – cá`.

Nguồn tiếng **sinh tự động** (ghép âm đầu + vần + dấu) rồi **lọc theo danh sách
tiếng tiếng Việt có thật** để phủ được rất nhiều tiếng mà vẫn chuẩn. Trò chơi
theo **kiểu chọn từng bước** (3 bước), tính điểm theo pipeline chung (mỗi tiếng
= 1 câu, đồng hồ 30 giây).

## Quyết định chính (đã chốt trong brainstorm)

- Kiểu chơi: **C — chọn từng bước** (âm đầu → vần → dấu), 3 bước, mỗi bước 4 đáp án.
- **Có nhãn cách đọc** dưới đáp án (cờ / a / dấu sắc).
- **Ẩn chuỗi đánh vần khi đang chơi**; chỉ hiện + đọc lại sau khi đúng cả 3 bước.
- Bước dấu hiện **ký hiệu dấu + tên dấu**; tiếng **không dấu** thì ô đúng **để
  trống** (bỏ chữ "ngang"). Không sinh cá/cà/cả/cạ ở đáp án.
- **Không dùng tranh/emoji** (khác game "Chữ đầu tiên"). Vì không có tranh,
  **hiện chính tiếng cần đánh vần** (chữ Tinos) để bé đọc + có nút nghe.
- Chấm điểm **pipeline chung**, đồng hồ 30s.
- Font **Tinos** (Times Unicode).
- Nguồn từ: **sinh tự động + lọc theo danh sách tiếng thật**.
- Thêm **Vitest** để test logic sinh/đặt dấu.

## Trải nghiệm chơi

Mỗi lượt (1 tiếng):

1. Hiện **tiếng cần đánh vần** (vd `cá`, chữ Tinos, to) + nút **🔊 Nghe lại**;
   app đọc tiếng khi bắt đầu.
2. **Bước 1 — Âm đầu:** "Tiếng này bắt đầu bằng âm nào?" — 4 đáp án chữ cái âm
   đầu, kèm nhãn đọc (vd `c` → "cờ").
3. **Bước 2 — Vần:** "Vần của tiếng này là gì?" — 4 đáp án vần không dấu (vd `a`).
4. **Bước 3 — Dấu:** "Tiếng này có dấu gì?" — 4 đáp án là ký hiệu dấu + tên
   (dấu sắc ◌́, huyền ◌̀, hỏi ◌̉, ngã ◌̃, nặng ◌̣); đáp án **không dấu** là **ô trống**.

Phản hồi:
- **Sai**: thẻ rung, phát "chưa đúng", `wrongCount++`, không chuyển bước.
- **Đúng**: đọc âm/vần/dấu vừa chọn, sang bước sau.
- **Đúng cả 3 bước**: hiện **chuỗi đánh vần đầy đủ** `cờ – a – ca – dấu sắc – cá`
  (trước đó ẩn), app đọc lại cả chuỗi, confetti, +1 điểm, rồi sang tiếng mới.

Tiếng **không dấu** (vd "voi"): chuỗi cuối chỉ `vờ – oi – voi` (không có mắt xích
"cộng dấu"), nhưng bước 3 vẫn hỏi và đáp án đúng là ô trống.

Độ khó cho bé: chỉ lấy tiếng trong **top ~2000 tiếng thông dụng nhất** (danh sách
đã sắp theo tần suất) để tránh tiếng hiếm/khó đọc.

## Kiến trúc

Bám pattern sẵn có. Đây là trò chơi nhiều bước trong 1 "câu", nên đứng riêng như
`TracingGame` (không dùng `handleAnswer` đơn lẻ). **Không đụng** `syllables.ts`/
`WORDS`/game "Chữ đầu tiên" hiện có — logic mới nằm ở file riêng.

### 1. Dữ liệu tiếng thật — `src/lib/viSyllables.ts` (mới)

- Bundle danh sách tiếng tiếng Việt có thật, **sắp theo tần suất giảm dần**.
  Nguồn: hieuthi "7184 common Vietnamese syllables"
  (https://gist.github.com/hieuthi/1f5d80fca871f3642f61f7e3de883f3a).
  Dự phòng: vietnameselanguage/syllable (6674 tiếng).
- Xuất `VI_SYLLABLES: string[]` (theo thứ tự tần suất) và
  `VI_SYLLABLE_SET: Set<string>` (để lọc O(1)).
- Sinh file này bằng script `scripts/build-syllables.ts`: tải danh sách gốc,
  chuẩn hoá NFC + lowercase, ghi ra module TS. Chạy 1 lần khi làm; kết quả commit
  vào repo (không phụ thuộc mạng lúc chạy app). Ghi rõ nguồn + license ở đầu file.

### 2. Khối ngữ âm + logic sinh — `src/lib/spelling.ts` (mới)

**Khối cố định (bảng tra):**
- `ONSETS`: danh sách âm đầu kèm cách đọc và **biến thể chính tả**. Nhóm cố định
  (b→bờ, ch→chờ, d→dờ, đ→đờ, h→hờ, kh→khờ, l→lờ, m→mờ, n→nờ, nh→nhờ, ph→phờ,
  r→rờ, s→sờ, t→tờ, th→thờ, tr→trờ, v→vờ, x→xờ, gi→dờ, qu→quờ) và nhóm biến thể
  theo nguyên âm sau: /k/ đọc "cờ" (c trước a/ă/â/o/ô/ơ/u/ư; **k** trước e/ê/i/y),
  /g/ đọc "gờ" (g / **gh**), /ng/ đọc "ngờ" (ng / **ngh**). Cũng cho phép **âm đầu
  rỗng** (vd "anh", "em") — đọc theo chính vần.
- `RHYMES`: danh sách vần không dấu (khối để ghép). Không cần đầy đủ tuyệt đối —
  chỉ cần đủ rộng; tiếng ghép ra sẽ được **lọc lại** theo `VI_SYLLABLE_SET`.
- `TONES`, `TONE_LABELS`, `TONE_MARKS`: 6 thanh (không/sắc/huyền/hỏi/ngã/nặng),
  nhãn tên, ký hiệu dấu (không → rỗng).

**Hàm thuần (unit-test được):**
- `chooseOnsetSpelling(onsetPhoneme, rhyme): string` — chọn c/k, g/gh, ng/ngh
  theo nguyên âm đầu của vần.
- `applyTone(toneless, tone): string` — đặt dấu đúng vị trí bằng **ký tự tổ hợp
  (combining mark) + `String.normalize('NFC')`**. Vị trí ưu tiên: nguyên âm mang
  dấu phụ (â/ê/ô/ơ/ă/ư); nếu có âm cuối → nguyên âm cuối của cụm; nguyên âm đôi
  mở → theo luật oa/oe/uy (dấu ở nguyên âm sau) vs ia/ua/ưa (dấu ở nguyên âm trước).
- `buildCorpus(): SpellingWord[]` — quét mọi tổ hợp `ONSET × RHYME × TONE`, render
  chuỗi (chọn chính tả + đặt dấu), **giữ lại chuỗi có trong `VI_SYLLABLE_SET`**.
  Mỗi phần tử giữ sẵn `{ syllable, onset, rhyme, tone, onsetReading, blend, freqRank }`.
  Chạy 1 lần (memo hoá ở cấp module). Vì đã ghép từ khối nên **biết sẵn cách tách**;
  bộ lọc đảm bảo chỉ tiếng thật + đúng chính tả lọt qua (đặt dấu/chính tả sai →
  chuỗi không khớp set → bị loại, không hiện ra).

  Xử lý nhập nhằng: chỉ sinh "gi"/"qu" từ âm đầu tương ứng (không để g+i.. hay
  q+.. tạo trùng chuỗi) — nhờ luật gh/ngh, g trước i luôn ra "gh", nên "gi" chỉ
  đến từ âm đầu `gi`.

**Kiểu & hàm sinh đề:**
```ts
export interface SpellStepOption { display: string; reading: string; value: string }
export interface SpellingRound {
  syllable: string;        // "cá"  (hiện lên cho bé đọc)
  blend: string;           // "ca"  = onset + rhyme (không dấu)
  onset: string;           // "c"
  rhyme: string;           // "a"
  tone: Tone;              // "sắc" | "không" | ...
  onsetReading: string;    // "cờ"
  toneLabel: string;       // "sắc"; "" nếu không dấu
  hasTone: boolean;        // tone !== 'không'
  onsetOptions: SpellStepOption[];
  rhymeOptions: SpellStepOption[];
  toneOptions: SpellStepOption[];
}
export function generateSpellingRound(maxRank?: number): SpellingRound;
```
`generateSpellingRound`:
- Lấy `corpus = buildCorpus()`; chọn ngẫu nhiên 1 phần tử có `freqRank < maxRank`
  (mặc định ~2000) — nếu rỗng thì nới `maxRank`.
- `onsetOptions`: đúng + 3 nhiễu âm đầu khác (display = chữ âm đầu như đã chọn
  chính tả, reading = cách đọc, value = âm đầu). Xáo trộn.
- `rhymeOptions`: đúng + 3 nhiễu vần khác. Xáo trộn.
- `toneOptions`: đúng + 3 nhiễu thanh khác (display = `TONE_MARKS[tone]`, rỗng cho
  không dấu; reading = tone==='không' ? '' : 'dấu '+TONE_LABELS[tone]; value=tone).
  Xáo trộn.
- Hàm thuần (chỉ phụ thuộc `Math.random`).

### 3. Kiểu — `src/types.ts`

- Thêm `'spelling'` vào union `GameMode`.
- `Tone`, `SpellingRound`, `SpellStepOption` để trong `spelling.ts` cùng logic.

### 4. Component — `src/components/games/SpellingGame.tsx` (mới)

Props:
```ts
interface SpellingGameProps {
  round: SpellingRound;
  disabled: boolean;
  onComplete: () => void;   // đúng cả 3 bước
  onWrong: () => void;      // mỗi lần chọn sai
}
```
- State nội bộ `step: 0|1|2` + cờ "đã xong"; reset khi `round.syllable` đổi.
- Render: **tiếng** (Tinos, to) + nút Nghe lại + câu hỏi theo bước + lưới 4 đáp án
  (mỗi ô: chữ lớn Tinos + nhãn đọc nhỏ). Ẩn chuỗi khi chơi.
- Đúng: `speakText(reading)`, `step++`; Sai: rung thẻ + `onWrong()`.
- Sau bước 3: render **chuỗi đánh vần**, đọc tuần tự (`onsetReading → rhyme →
  blend → toneLabel → syllable`, bỏ 2 mắt cuối nếu `!hasTone`), rồi `onComplete()`.
- Lưới đáp án render riêng trong component (AnswerGrid hiện chỉ nhận string, không
  có nhãn phụ). Chữ dùng class `.font-spell`; cho chuỗi tự xuống dòng gọn (đã
  kiểm với tiếng dài: chuối/bướm/ngựa).

### 5. `App.tsx`

- Thêm state `const [spellingRound, setSpellingRound] = useState<SpellingRound|null>`.
- `generateQuestionForMode`/`startGame`/`nextQuestion`: khi `mode==='spelling'`,
  gọi `generateSpellingRound()`, set `spellingRound`, `speakText(round.syllable)`.
- `renderGameBody` case `'spelling'` → `<SpellingGame round={spellingRound!}
  disabled=... onComplete={handleSpellingComplete} onWrong={handleSpellingWrong}/>`.
- `handleSpellingComplete`: `totalCount++`, `score++`, `playSound('correct')`,
  `speakText('… giỏi quá!')`, confetti, `setTimeout(nextQuestion, ~2500)`.
- `handleSpellingWrong`: `playSound('wrong')` + `wrongCount++`.
- Dùng chung đồng hồ 30s (đi nhánh có timer, không phải nhánh `'letters'`).
- `AnimatePresence key` dùng `spellingRound?.syllable` cho mode này.

### 6. `StartScreen.tsx`

Thêm ô "Đánh Vần": màu fuchsia (chưa dùng), icon `SpellCheck`/`BookOpenText`,
phụ đề "Ghép âm thành tiếng", `onClick={() => onStart('spelling')}`.

### 7. Font — `index.html` + `src/index.css`

`index.html` nhúng Google Fonts Tinos:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap" rel="stylesheet" />
```
`index.css`: `.font-spell { font-family: 'Tinos', 'Times New Roman', serif; }`

## Kiểm thử (Vitest)

- Thêm `vitest` vào devDependencies, script `"test": "vitest run"`.
- `src/lib/spelling.test.ts`:
  - `applyTone`: bộ ca cố định — cá, cà, cả, cã?→ngã "cã", cạ; gấu→sắc "gấu";
    sữa (s+ưa+ngã)→"sữa"; ngựa→"ngựa"; bướm→"bướm"; chuối→"chuối"; hoà/hoa; của/cua;
    múa/mua; không dấu trả về nguyên chuỗi.
  - `chooseOnsetSpelling`: c/k (ca vs kê), g/gh (ga vs ghe), ng/ngh (nga vs nghe).
  - `buildCorpus`: mọi phần tử `syllable ∈ VI_SYLLABLE_SET`;
    `onset + applyTone(rhyme,tone) === syllable`; `blend === onset + rhyme`;
    corpus không rỗng và đủ lớn (vd > 1500).
  - `generateSpellingRound` (chạy nhiều lần): mỗi bước đúng 4 option & chứa đáp án
    đúng; `value` không trùng; đáp án đúng khớp onset/rhyme/tone; `onsetReading`,
    `toneLabel`, `hasTone` đúng.
- Còn lại: `npm run lint` (tsc) + chơi thử thủ công (âm thanh, confetti, ẩn/hiện
  chuỗi, font Tinos, tiếng dài, tiếng không dấu).

## Ngoài phạm vi (YAGNI)

- Không gọi API online lúc chạy — dữ liệu tiếng bundle sẵn.
- Không tự tách (parse) tiếng phụ huynh gõ — chỉ sinh-rồi-lọc.
- Không tách vần thành âm đệm/âm chính/âm cuối — vần là 1 đơn vị.
- Không dùng tranh cho game này; không màn cài đặt riêng; không đổi game cũ.

## Rủi ro & cách giảm

- **Đặt dấu sai** → tiếng bị loại (an toàn, không hiện sai), nhưng nếu sai nhiều
  sẽ giảm độ phủ. Giảm thiểu bằng unit-test `applyTone` kỹ.
- **Chất lượng TTS tiếng Việt** khác nhau giữa máy; đã có `speakText` sẵn, chấp nhận.
- **Nhập nhằng gi/qu** trong tách: xử lý bằng luật gh/ngh + chỉ sinh gi/qu từ âm
  đầu tương ứng; có test bao phủ.
