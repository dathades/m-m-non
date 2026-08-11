# Thiết kế: Game Phân Số (Toán lớp 4) + lọc game theo lớp + chống thoát nhầm

Ngày: 2026-08-11

## Mục tiêu

Thêm nội dung luyện tập **Toán lớp 4 — Phân số** (Kết nối tri thức) làm game
grade-4 đầu tiên, hiển thị khi lớp đã chọn là **Lớp 4**. Kèm hai phần hạ tầng
đi cùng:
- **Lọc game theo lớp** ở màn chọn game (Mầm non ↔ Lớp 4).
- **Chống thoát nhầm** khi đang chơi bất kỳ game nào (đặc biệt cho điện thoại:
  vuốt trở về hay làm văng khỏi game).

Đây là sub-project đầu của lộ trình Toán lớp 4; các mảng sau (Đo lường, Hình học,
Thống kê, Bài toán có lời văn) sẽ là các spec riêng.

## Phụ thuộc

Cần `ClassLevel` và state `childClass` từ feature **chọn lớp** (đang ở nhánh
`feat/entry-class-selection`, chưa merge). Game này xây tiếp trên nền đó — hoặc
merge nhánh đó vào `main` trước khi bắt đầu.

## Quyết định đã chốt (qua demo)

- v1 gồm **6 kỹ năng** phân số (bên dưới). Nhập số bằng **bàn phím số trên màn hình**.
- **Đồng hồ 30 giây/câu**; quá 30s → tính **Sai** rồi sang câu mới.
- Trả lời **sai chủ động** → "chưa đúng, thử lại" trong thời gian còn lại,
  **không** cộng Sai; **đúng** → Đúng +1 sang câu mới.
- HUD hiện **⏱ · Đúng · Sai · Tổng**. Chơi tới khi **thoát**; thoát → về màn chính.
- **Nút Thoát trong game: thoát thẳng, không hỏi.**
- **Chống thoát nhầm (mọi game):** chặn back/vuốt-trở-về (hỏi xác nhận), tạm dừng
  đồng hồ khi đổi/ẩn tab, cảnh báo khi đóng/refresh trang.
- Chấm: rút gọn phải **đúng tối giản**; cộng/trừ/nhân/chia chấp nhận **mọi phân số
  tương đương**; phân số của số khớp số nguyên; so sánh/nhận biết khớp lựa chọn.

## 1. Nội dung & dạng câu (6 kỹ năng)

| Kỹ năng (`skill`) | Đề hiển thị | Trả lời (`answerType`) | Chấm |
|---|---|---|---|
| `recognize` (Nhận biết) | Dải ô, tô màu k/n | 4 lựa chọn phân số | khớp chuỗi `k/n` |
| `simplify` (Rút gọn) | `a/b =` ▢ | nhập tử/mẫu | **đúng tối giản** (khớp cả tử & mẫu) |
| `compare` (So sánh) | `a/b` ▢ `c/d` | 3 nút `<` `=` `>` | khớp dấu |
| `addsub` (Cộng/Trừ) | `a/b op c/d =` ▢ | nhập tử/mẫu | **tương đương** (nhân chéo) |
| `muldiv` (Nhân/Chia) | `a/b op c/d =` ▢ | nhập tử/mẫu | **tương đương** |
| `fracof` (PS của số) | `a/b của N =` ▢ | nhập 1 số nguyên | khớp số |

Phạm vi số: mẫu 2–9 (một số dạng 2–8), tử nhỏ hơn mẫu (phân số thật). `simplify`
sinh từ phân số tối giản nhân hệ số k=2–4. `fracof` chọn N chia hết cho mẫu để
kết quả là số nguyên. `compare` thỉnh thoảng ra bằng nhau.

## 2. Thư viện phân số (thuần, test Vitest) — `src/lib/fractions.ts`

```ts
export interface Fraction { num: number; den: number }
export function gcd(a: number, b: number): number;
export function simplify(f: Fraction): Fraction;      // mẫu > 0, tối giản
export function add(a: Fraction, b: Fraction): Fraction;   // trả về đã tối giản
export function sub(a: Fraction, b: Fraction): Fraction;
export function mul(a: Fraction, b: Fraction): Fraction;
export function divide(a: Fraction, b: Fraction): Fraction;
export function compareFrac(a: Fraction, b: Fraction): -1 | 0 | 1; // nhân chéo
export function fracEquals(a: Fraction, b: Fraction): boolean;     // nhân chéo
export function fractionOfNumber(f: Fraction, n: number): number;  // f.num*n/f.den
```
Thuần, không side-effect → test đầy đủ.

## 3. Sinh đề + chấm — `src/lib/fractionProblems.ts`

```ts
export type FractionSkill = 'recognize'|'simplify'|'compare'|'addsub'|'muldiv'|'fracof';
export type AnswerType = 'choice'|'choice3'|'fraction'|'integer';

export interface FractionProblem {
  skill: FractionSkill;
  prompt: string;
  operands: Fraction[];        // các phân số trong đề
  op?: '+'|'−'|'×'|'÷';        // addsub/muldiv
  ofNum?: number;              // fracof
  shaded?: number; total?: number; // recognize
  answerType: AnswerType;
  answer: Fraction | number | string; // đáp án chuẩn
  options?: string[];          // recognize (4) / không dùng cho choice3
  strict?: boolean;            // simplify = true → phải đúng tối giản
}

export function generateFractionProblem(skill: FractionSkill | 'mix'): FractionProblem;

// input: {num,den} cho fraction; number cho integer; string cho choice/choice3
export function checkFractionAnswer(
  p: FractionProblem,
  input: Fraction | number | string
): boolean;
```
`checkFractionAnswer`:
- `choice`/`choice3`: `input === p.answer`.
- `integer`: `input === p.answer`.
- `fraction`: nếu `p.strict` → khớp cả `num` & `den` với `p.answer`; ngược lại
  `fracEquals(input, p.answer)` (chấp nhận tương đương). Mẫu 0 → sai.

Thuần → test: đáp án đúng luôn nằm trong `options` (recognize); `strict` từ chối
phân số tương đương chưa tối giản; addsub/muldiv chấp nhận tương đương; ranges hợp lệ.

## 4. Component

### `src/components/Fraction.tsx` (mới)
Hiển thị 1 phân số: tử / gạch ngang / mẫu (font serif). Props `{num, den, size?}`.

### `src/components/NumberPad.tsx` (mới)
Bàn phím số dùng chung: nút `0–9`, `⌫`, `✓`. Props `onKey: (k: string) => void`
(k ∈ '0'..'9' | 'del' | 'ok'). Thuần trình bày.

### `src/components/games/FractionGame.tsx` (mới) — tự quản như `SpellingGame`
Trách nhiệm (một mini-game khép kín):
- State: `problem`, ô nhập (`num`/`den`/`val` + ô đang chọn), `right/wrong/total`,
  `timeLeft` (30/câu), `locked` (khoá lúc chuyển câu), cờ hết giờ.
- **Đồng hồ 30s/câu**: reset mỗi câu mới; hết 30s → `wrong++, total++`, báo
  "Hết giờ! (tính là sai)", tự sang câu mới. **Tạm dừng** khi `document.hidden`
  (đổi/ẩn tab), chạy tiếp khi hiện lại (giữ nguyên số giây còn lại).
- Render theo `answerType`:
  - `choice` (recognize): dải ô tô màu + 4 nút phân số.
  - `choice3` (compare): `a/b` ▢ `c/d` + 3 nút `< = >` (bấm → điền dấu vào ▢ rồi chấm).
  - `fraction` (simplify/addsub/muldiv): đề `… =` + ô nhập tử/mẫu **inline sau dấu =**;
    `NumberPad` phía dưới. Chạm ô để chọn tử/mẫu; gõ số tự nhảy sang mẫu.
  - `integer` (fracof): đề `a/b của N =` + ô nhập số; `NumberPad`.
- Chấm bằng `checkFractionAnswer`: đúng → `right++, total++`, câu mới sau ~0.85s;
  sai chủ động → "chưa đúng, thử lại" (không cộng Sai, làm lại trong thời gian còn lại).
- Dùng lại `GameHUD` cho thanh trên (truyền `timeLeft`, `score=right`,
  `wrongCount=wrong`, `totalCount=total`, `onExit`) — **nút Thoát gọi `onExit`
  thẳng, không hỏi**.
- Props: `{ onExit: () => void }`. Không có "kết thúc theo giờ" — chơi tới khi thoát;
  thoát → `onExit()` (về màn chính).

## 5. Lọc game theo lớp — `src/types.ts`, `src/App.tsx`, `src/components/StartScreen.tsx`

- Thêm `'fractions'` vào `GameMode`.
- `StartScreen` nhận thêm prop `level: ClassLevel`. Chia ô game theo lớp:
  - `mam_non` → giữ nguyên toàn bộ ô game hiện có.
  - `lop_4` → hiện ô **"Phân Số"** (icon phù hợp, vd `Divide`/`Sigma`), phụ đề
    "Toán lớp 4"; (các mảng lớp 4 khác thêm sau).
  - Tách phần render ô theo lớp cho gọn (không đổi logic ô mầm non).
- `App`: truyền `level={childClass}` vào `StartScreen`. `startGame('fractions')`
  chỉ cần `setMode('fractions')` + `setGameState('playing')` (reset điểm nếu muốn).
- **Render tách biệt:** khi `gameState==='playing'`, nếu `mode==='fractions'` thì
  render thẳng `<FractionGame onExit={resetToHome} />` (game tự có `GameHUD`,
  đồng hồ, tính điểm) — **không** bọc trong `renderPlaying()` (khung câu hỏi + HUD
  + FeedbackOverlay của pipeline chung). Các mode khác vẫn dùng `renderPlaying()`.
- **Loại `'fractions'` khỏi các effect dùng chung** để không bị đụng:
  - effect auto-next theo `!question`: thêm `&& mode !== 'fractions'`.
  - effect đồng hồ chung (đếm ngược → kết thúc lượt): thêm `&& mode !== 'fractions'`
    (FractionGame tự quản đồng hồ riêng).
  - `renderGameBody`/`AnimatePresence key`: không cần nhánh `'fractions'` vì đã
    render tách ở trên.

## 6. Chống thoát nhầm (áp dụng mọi game đang chơi) — `src/App.tsx`

Gói trong một hook/effect kích hoạt khi `gameState === 'playing'`:
- **Back/vuốt-trở-về:** khi vào chơi, `history.pushState` một mốc; nghe `popstate`
  → hiện **modal xác nhận** "Thoát trò chơi? Kết quả chưa lưu." (Ở lại / Thoát).
  - "Ở lại" → `history.pushState` lại (giữ trong game).
  - "Thoát" → `resetToHome()` (không đẩy lại mốc).
- **Đóng/refresh trang:** `beforeunload` → `e.preventDefault(); e.returnValue=''`
  (trình duyệt tự cảnh báo). Chỉ gắn khi đang chơi.
- **Đổi/ẩn tab:** `visibilitychange` → tạm dừng đồng hồ đang chạy khi ẩn, chạy
  tiếp khi hiện. Áp cho đồng hồ của game hiện tại (FractionGame tự lo đồng hồ của
  nó; đồng hồ pipeline chung của các game khác cũng tạm dừng theo cờ ẩn tab).
- Component modal xác nhận back: `src/components/ExitConfirm.tsx` (hoặc render
  inline trong App). Đây là modal cho **back/vuốt**, KHÔNG phải cho nút Thoát.
- Dọn sạch listener khi rời trạng thái chơi (effect cleanup).

Ghi chú: **nút Thoát** ở `GameHUD` vẫn thoát thẳng (không modal) như cũ.

## 7. Kiểm thử

- **Vitest** cho logic thuần:
  - `src/lib/fractions.test.ts`: gcd, simplify (vd 6/8→3/4, 5/10→1/2), add/sub/mul/
    divide (kết quả tối giản, vd 1/2+1/3=5/6, 2/3−1/6=1/2, 2/3×3/4=1/2, 1/2÷1/4=2/1),
    compareFrac, fracEquals (1/2 ≡ 2/4), fractionOfNumber (2/3 của 12 = 8).
  - `src/lib/fractionProblems.test.ts`: `generateFractionProblem` mỗi kỹ năng (chạy
    nhiều lần) — đáp án hợp lệ, recognize có 4 option chứa đáp án, phạm vi số đúng,
    fracof ra số nguyên; `checkFractionAnswer` — simplify strict từ chối 2/4 cho 1/2,
    addsub/muldiv chấp nhận tương đương, integer/choice khớp chính xác.
- Còn lại (`npm run lint` + `npm run build` + chơi thử): bàn phím số nhập tử/mẫu,
  đồng hồ 30s → hết giờ tính Sai + câu mới, HUD Đúng/Sai/Tổng, chống back/vuốt
  (bấm Back → modal), tạm dừng khi đổi tab, cảnh báo khi refresh, lọc game theo lớp
  (Mầm non vs Lớp 4). Các test cũ (đánh vần) vẫn xanh.

## Ngoài phạm vi (YAGNI)
- Chưa làm các mảng lớp 4 khác (đo lường, hình học, thống kê, toán lời văn).
- Không đổi hành vi hết-giờ của các game mầm non hiện có (chúng vẫn kết thúc lượt
  khi hết giờ; chỉ FractionGame dùng "hết giờ = Sai + câu mới").
- Không lưu lịch sử điểm/tiến độ giữa các lượt.
- Chưa đổi tông màu/giao diện "người lớn hơn" cho lớp 4 (dùng khung hiện có).
