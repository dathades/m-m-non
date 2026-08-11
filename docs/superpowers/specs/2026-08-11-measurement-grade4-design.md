# Thiết kế: Game Đo Lường & Đơn Vị (Toán lớp 4)

Ngày: 2026-08-11

## Mục tiêu

Thêm game luyện **Đo lường & đơn vị** cho lớp 4, là mảng Toán lớp 4 thứ hai (sau
Phân số). Hiển thị khi lớp = Lớp 4. Tái dùng khung mini-game đã có (bàn phím số,
`GameHUD`, đồng hồ 30s/câu, chống thoát nhầm).

Phạm vi v1: **4 loại đại lượng** (khối lượng, diện tích, thời gian, độ dài) ×
**3 dạng câu** (đổi đơn vị, so sánh, đổi đơn vị ghép). Đã duyệt qua demo bấm thử.

## Nội dung & dạng câu

| Dạng (`skill`) | Ví dụ | Trả lời (`answerType`) |
|---|---|---|
| `convert` (Đổi đơn vị) | `5 yến = ? kg` | nhập số |
| `compare` (So sánh) | `5 tạ ▢ 6 yến` | bấm `<` `=` `>` |
| `compound` (Đổi ghép) | `2 tấn 5 tạ = ? kg` | nhập số |

Đại lượng & đơn vị (mỗi loại gồm 1+ **chuỗi** đơn vị — chỉ đổi trong cùng chuỗi):
- **Khối lượng**: `g, kg, yến, tạ, tấn` (1 kg=1000 g, 1 yến=10 kg, 1 tạ=10 yến, 1 tấn=10 tạ).
- **Diện tích**: `mm², cm², dm², m²` (1 cm²=100 mm², 1 dm²=100 cm², 1 m²=100 dm²).
- **Độ dài**: `mm, cm, dm, m, km` (1 cm=10 mm, 1 dm=10 cm, 1 m=10 dm, 1 km=1000 m).
- **Thời gian**: 2 chuỗi tách biệt — `giây, phút, giờ, ngày` (60/60/24) và
  `năm, thế kỉ` (100). **Không** đổi chéo giữa hai chuỗi (năm↔giây không hợp lớp 4).

Quy tắc sinh số (giữ số "đẹp", kết quả là **số nguyên dương**):
- Chọn hai đơn vị **gần nhau** trong chuỗi (cách nhau 1–2 bậc) để tránh tỉ lệ quá lớn.
- `convert`: 70% chiều lớn→nhỏ (`q` × tỉ lệ, luôn nguyên), 30% nhỏ→lớn (chọn `q` là
  bội của tỉ lệ để đáp án nguyên).
- `compound`: dùng 3 đơn vị liên tiếp `big > small > target`; `q1 big + q2 small = ? target`.
  Chuỗi < 3 đơn vị (năm/thế kỉ) → bỏ qua compound, chuyển sang convert.
- `compare`: hai lượng (đơn vị bất kỳ trong cùng chuỗi), so theo giá trị quy về base.

## Kiến trúc (bám pattern game Phân số)

### 1. Dữ liệu đơn vị — `src/lib/units.ts` (mới, thuần)
```ts
export interface Unit { label: string; base: number } // base theo đơn vị nhỏ nhất của chuỗi
export type Chain = Unit[];                            // tăng dần theo base
export interface Measure { name: string; chains: Chain[] }
export const MEASURES: Measure[]; // 4 đại lượng như trên
```

### 2. Sinh đề + chấm — `src/lib/measurementProblems.ts` (mới, thuần)
```ts
export type MeasureSkill = 'convert' | 'compare' | 'compound';
export interface MeasurementProblem {
  skill: MeasureSkill;
  measure: string;              // 'Khối lượng' | 'Diện tích' | 'Thời gian' | 'Độ dài'
  prompt: string;
  answerType: 'number' | 'choice3';
  parts?: string;               // "5 yến" / "2 tấn 5 tạ"  (dạng number)
  toUnit?: string;              // đơn vị đích (dạng number)
  left?: string; right?: string;// "5 tạ" / "6 yến"       (dạng compare)
  answer: number | string;      // số nguyên | '<' | '=' | '>'
}
export function generateMeasurementProblem(skill: MeasureSkill | 'mix'): MeasurementProblem;
export function checkMeasurementAnswer(p: MeasurementProblem, input: number | string): boolean;
```
`checkMeasurementAnswer`: `choice3` → `input === p.answer`; `number` → `input === p.answer`.
Thuần → test Vitest.

### 3. Component — `src/components/games/MeasurementGame.tsx` (mới)
Mini-game khép kín, **song song với `FractionGame`**:
- Tái dùng `NumberPad` (bàn phím số) và `GameHUD` (thanh Đúng/Sai/Tổng + đồng hồ + Thoát).
- Chip chọn dạng: **Tổng hợp / Đổi đơn vị / So sánh / Đổi ghép** (loại đại lượng random;
  hiện tên loại phía trên câu hỏi). Đổi chip → câu mới.
- **Đồng hồ 30s/câu**: reset mỗi câu; hết giờ → `Sai+1, Tổng+1`, câu mới. **Tạm dừng**
  khi `document.hidden`. Sao chép đúng cơ chế đã kiểm ở `FractionGame` (gồm `advanceRef`
  huỷ timeout khi sang câu, và cờ `locked`).
- Render:
  - `number` (convert/compound): `<parts> = [ô nhập] <đơn vị đích>` + `NumberPad`.
  - `choice3` (compare): `<left> ▢ <right>` + 3 nút `< = >` (bấm → điền dấu vào ▢ rồi chấm).
- Chấm bằng `checkMeasurementAnswer`: đúng → `Đúng+1, Tổng+1`, câu mới sau ~0.85s;
  sai chủ động → "chưa đúng, thử lại" (KHÔNG cộng Sai/Tổng, làm lại trong thời gian còn lại).
- Props: `{ onExit: () => void }`; nút Thoát của `GameHUD` gọi `onExit` thẳng (không hỏi).

> **Ghi chú kỹ thuật nợ:** logic vòng chơi/đồng hồ được **lặp lại** từ `FractionGame`.
> Chấp nhận ở bước này để không đụng game Phân số vừa ổn định; khi làm game lớp 4 thứ 3
> nên tách một hook chung (vd `useRoundEngine`) dùng cho cả ba. Ngoài phạm vi lần này.

### 4. Tích hợp — `src/types.ts`, `src/App.tsx`, `src/components/StartScreen.tsx`
- Thêm `'measurement'` vào `GameMode`.
- `StartScreen` (nhánh `level==='lop_4'`): thêm ô **"Đo Lường"** (icon `Ruler`/`Scale`,
  màu teal), cạnh ô **"Phân Số"**. Cùng lưới.
- `App`: import `MeasurementGame`; `startGame('measurement')` không sinh Question;
  render tách `mode==='measurement' ? <MeasurementGame onExit={resetToHome}/> : ...`
  (mở rộng ternary hiện có cho fractions); loại `'measurement'` khỏi 2 effect dùng chung
  (auto-next theo `!question` và đồng hồ chung) y như đã làm cho `'fractions'`.
- **Chống thoát nhầm** đã có sẵn ở App (guard theo `gameState==='playing'`) → tự động
  áp cho game này, không cần thêm.

## Kiểm thử (Vitest)
- `src/lib/units.test.ts`: `MEASURES` có đủ 4 loại; base tăng dần trong mỗi chuỗi;
  các tỉ lệ chuẩn (kg/g=1000, yến/kg=10, m²/dm²=100, km/m=1000, giờ/phút=60, thế kỉ/năm=100).
- `src/lib/measurementProblems.test.ts` (chạy nhiều lần mỗi dạng):
  - `convert`/`compound`: `answer` là **số nguyên dương**; đơn vị hợp lệ trong cùng chuỗi;
    kiểm lại đáp án bằng cách tự quy đổi qua base.
  - `compare`: `answer ∈ {<,=,>}` và khớp so sánh base thực tế.
  - `compound` không sinh cho chuỗi < 3 đơn vị (năm/thế kỉ).
  - `checkMeasurementAnswer`: number khớp số; choice3 khớp dấu.
- Còn lại: `npm run lint` + `npm run build` + chơi thử (lọc lớp thấy 2 ô Phân Số/Đo Lường;
  bàn phím, đồng hồ 30s, back/tab/refresh; test cũ vẫn xanh).

## Ngoài phạm vi (YAGNI)
- Không làm dạng "chọn đơn vị hợp lý" (đã bỏ ở bước chốt phạm vi).
- Không đổi chéo giữa các chuỗi thời gian (năm↔giây).
- Chưa tách hook vòng chơi dùng chung (nợ kỹ thuật, làm ở game thứ 3).
- Không đụng game Phân số / game mầm non.
