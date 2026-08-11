# Thiết kế: Giọng đọc (TTS) cho game lớp 4 (Phân Số, Đo Lường)

Ngày: 2026-08-11

## Mục tiêu

Hai game lớp 4 (`FractionGame`, `MeasurementGame`) hiện chỉ có tiếng "correct/
wrong" (mp3), **chưa có giọng đọc** câu hỏi và kết quả. Thêm:
- **Tự động đọc câu hỏi** mỗi khi hiện câu mới, kèm nút **🔊 Nghe lại**.
- **Đọc kết quả**: đúng / sai / hết giờ.

Đọc bằng `speakText` (Web Speech, vi-VN) đã có sẵn. Đã duyệt cách đọc qua demo nghe thử.

## Cách đọc (đã chốt qua demo)

- **Phân số** đọc `"<tử> phần <mẫu>"` (1/2 → "một phần hai"); phép tính đọc
  cộng/trừ/nhân/chia; `= ?` → "bằng bao nhiêu".
  - Nhận biết → "Phân số nào chỉ phần đã tô?"
  - Rút gọn → "Rút gọn phân số, 4 phần 8"
  - So sánh → "So sánh 1 phần 2 và 1 phần 3"
  - Cộng/Trừ/Nhân/Chia → "1 phần 2 cộng 1 phần 3 bằng bao nhiêu"
  - Phân số của số → "2 phần 3 của 12 bằng bao nhiêu"
- **Đo lường**: đọc số + **đơn vị đọc rõ** (kg→"ki lô gam", m²→"mét vuông",
  dm²→"đề xi mét vuông", cm→"xăng ti mét", km→"ki lô mét"…).
  - Đổi đơn vị → "5 yến bằng bao nhiêu ki lô gam"
  - Đổi ghép → "2 tấn 5 tạ bằng bao nhiêu ki lô gam"
  - So sánh → "So sánh 5 tạ và 6 yến"
- **Kết quả**: đúng → **"Đúng rồi! Tiếp tục nào!"**; sai (chủ động) → "Chưa đúng,
  thử lại nhé!"; hết giờ → "Hết giờ rồi!".

## Kiến trúc

Logic "verbalize" là hàm **thuần** (test được); phần đọc/nút do component gọi.

### 1. Bảng phiên âm đơn vị — `src/lib/units.ts` (thêm)
```ts
export const UNIT_SPEECH: Record<string, string> = {
  g: 'gam', kg: 'ki lô gam', 'yến': 'yến', 'tạ': 'tạ', 'tấn': 'tấn',
  mm: 'mi li mét', cm: 'xăng ti mét', dm: 'đề xi mét', m: 'mét', km: 'ki lô mét',
  'mm²': 'mi li mét vuông', 'cm²': 'xăng ti mét vuông', 'dm²': 'đề xi mét vuông', 'm²': 'mét vuông',
  'giây': 'giây', 'phút': 'phút', 'giờ': 'giờ', 'ngày': 'ngày', 'năm': 'năm', 'thế kỉ': 'thế kỉ',
};
```
(Không dùng dấu gạch nối trong giá trị — vì `speakText` thay `-` thành "trừ".)

### 2. Verbalize — thêm hàm thuần vào lib sinh đề
- `src/lib/fractionProblems.ts`: `export function verbalizeFractionProblem(p: FractionProblem): string`.
  Dựng từ các trường của `p` (skill, operands, op, ofNum). Phân số → `${num} phần ${den}`.
- `src/lib/measurementProblems.ts`: `export function verbalizeMeasurementProblem(p: MeasurementProblem): string`.
  Thay mỗi cụm "số + đơn vị" trong `parts`/`left`/`right` và `toUnit` bằng `UNIT_SPEECH`.
  Ví dụ (thuần):
```ts
const sayQty = (s: string) =>
  s.replace(/(\d+)\s+(\S+)/g, (_, n, unit) => `${n} ${UNIT_SPEECH[unit] ?? unit}`);
// number: `${sayQty(parts)} bằng bao nhiêu ${UNIT_SPEECH[toUnit] ?? toUnit}`
// compare: `So sánh ${sayQty(left)} và ${sayQty(right)}`
```

### 3. Lời kết quả dùng chung — `src/lib/audio.ts` (thêm)
```ts
export const SAY = {
  correct: 'Đúng rồi! Tiếp tục nào!',
  retry: 'Chưa đúng, thử lại nhé!',
  timeout: 'Hết giờ rồi!',
};
```
`speakText` giữ nguyên (đã đọc vi-VN). Các chuỗi verbalize không chứa ký hiệu
`+ - = ? < >` nên không bị bảng thay thế của `speakText` ảnh hưởng.

### 4. Gọi trong 2 component (`FractionGame.tsx`, `MeasurementGame.tsx`)
- **Tự động đọc câu hỏi**: thêm `useEffect` chạy khi `problem` đổi → `speakText(verbalize(problem))`.
  (Bao gồm câu đầu tiên lúc mount và mọi câu mới.)
- **Nút 🔊 Nghe lại**: đặt cạnh hàng chip chọn dạng (hoặc trong thẻ đề) →
  `onClick={() => speakText(verbalize(problem))}`.
- **Đọc kết quả**:
  - `finishCorrect`: thêm `speakText(SAY.correct)` (giữ `playSound('correct')` + confetti).
  - `wrongTry` (sai chủ động): thêm `speakText(SAY.retry)` (giữ `playSound('wrong')`).
  - Effect hết giờ: thêm `speakText(SAY.timeout)` (giữ `playSound('wrong')`).
- **Chỉnh nhịp để lời chúc không bị cắt**: khi đúng, câu chúc (~1.8s) sẽ bị câu hỏi
  kế tiếp cắt nếu chuyển câu quá nhanh. Tăng độ trễ chuyển câu khi đúng từ **850ms →
  1800ms** (cả hai game). Độ trễ hết-giờ giữ ~1200–1500ms.

Không đụng game mầm non (đã có giọng đọc riêng). Không đổi `speakText`.

## Kiểm thử
- **Vitest** cho verbalize (thuần):
  - `fractionProblems.test.ts`: `verbalizeFractionProblem` cho từng skill trả chuỗi
    đúng mẫu (vd simplify {2,4} → "Rút gọn phân số, 2 phần 4"; addsub {1/2 + 1/3} →
    "1 phần 2 cộng 1 phần 3 bằng bao nhiêu"; compare → "So sánh …"; fracof → "… của N bằng bao nhiêu").
    Chuỗi **không chứa** `/ + − × ÷ = ?`.
  - `measurementProblems.test.ts`: `verbalizeMeasurementProblem` — đơn vị được thay
    theo `UNIT_SPEECH` (kg→"ki lô gam", m²→"mét vuông"); convert/compound có "bằng bao
    nhiêu"; compare có "So sánh". Không còn ký hiệu `= ▢`.
  - `units.test.ts`: `UNIT_SPEECH` có đủ mọi `label` xuất hiện trong `MEASURES`.
- Còn lại: `npm run lint` + `npm run build` + chơi thử (nghe đọc câu hỏi khi vào/đổi
  câu, nút Nghe lại, đọc đúng/sai/hết giờ; lời chúc không bị cắt). Test cũ vẫn xanh.

## Ngoài phạm vi (YAGNI)
- Không đọc câu hỏi cho game mầm non (đã có).
- Không thêm nút bật/tắt tiếng (có thể thêm sau).
- Không đổi giọng/tốc độ đọc.
