# Design: Làm lại bài Tập Viết — đồ theo nét SVG (stroke-by-stroke)

**Ngày:** 2026-06-11
**Trạng thái:** Đã duyệt

## Vấn đề

Bài Tập Viết hiện tại (`src/components/games/TracingGame.tsx`, hàm `verifyTracing`)
chấm điểm bằng cách so pixel nét vẽ của bé với **khối chữ tô đặc** rồi đòi
`coverage > 0.4` — tức bé phải tô kín ~40% diện tích ruột chữ. Một nét đồ đúng
theo đường giữa chỉ phủ ~15–25% → **đồ đúng vẫn báo sai**. Cần làm lại.

## Mục tiêu

Bé đồ theo chữ tiếng Việt có sẵn ở nền (đường nét mờ), từng nét một, có hướng
dẫn chiều viết; chấm điểm theo **khoảng cách hình học tới nét** thay vì so pixel.

## Quyết định đã chốt

| Hạng mục | Lựa chọn |
|---|---|
| Nguồn dữ liệu nét | **Hershey Simplex** (single-stroke, public domain) cho A–Z + 0–9; tự vẽ thêm 7 dấu tiếng Việt ghép lên chữ gốc. Trích sẵn → JSON trong repo, **không thư viện runtime**, offline. |
| Tương tác | **Đồ từng nét có dẫn**: sao chạy mẫu đúng chiều, xong nét 1 mới sang nét 2. |
| Độ chặt | **Vừa phải, có tính sai**: đồ lệch nhiều → 1 lần sai (`onFail` → wrongCount++) rồi cho làm lại. |
| Chiều viết | Sao mẫu dạy chiều, nhưng **chấm không ép chiều** (nương tay), chỉ ép độ phủ + độ bám. |

## Kiến trúc

Bỏ `<canvas>` + `getImageData`. Dùng `<svg viewBox="0 0 100 100">` (hiển thị
~320×320). Mọi chữ chuẩn hoá trong lưới 100×100. Chấm điểm bằng hình học đường
nét qua `getTotalLength()` / `getPointAtLength()` của trình duyệt — không có
thư viện nhận dạng, không so pixel.

## Bộ chữ phủ

Toàn bộ `LETTER_LIST` (`src/lib/constants.ts`): `0 1 2 3 4 5 6 7 8 9` và
`A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y` — 39 ký tự (chữ in hoa).

7 ký tự dựng từ dấu ghép lên chữ gốc:
- `Ă` = A + breve (˘), `Â` = A + mũ (^)
- `Ê` = E + mũ, `Ô` = O + mũ
- `Ơ` = O + móc (horn), `Ư` = U + móc
- `Đ` = D + gạch ngang

## Dữ liệu — `src/lib/letterStrokes.ts`

```ts
// Mỗi chữ = mảng path 'd' SVG, theo ĐÚNG THỨ TỰ viết. Toạ độ trong viewBox 0..100.
export type GlyphStrokes = string[];
export const LETTER_STROKES: Record<string, GlyphStrokes>;
export function getStrokes(letter: string): GlyphStrokes; // [] nếu thiếu (phòng thủ)
```

- Sinh **offline** bằng script một lần (`scripts/genLetterStrokes.*`, không chạy
  lúc runtime) từ một bộ dữ liệu Hershey Simplex public-domain được vendor vào
  repo; chuẩn hoá toạ độ Hershey (scale, lật trục Y, căn baseline/cap-height
  chung) về viewBox 100×100; chuyển mỗi polyline thành path `d`
  (`M x0 y0 L x1 y1 …`). 7 ký tự dấu: ghép nét chữ gốc + nét dấu (toạ độ dấu
  đặt tương đối theo hộp bao chữ gốc). Kết quả **commit dạng JSON/TS tĩnh**;
  runtime chỉ đọc, không parse Hershey.
- Thứ tự nét trong mảng = thứ tự sao mẫu chạy và bé phải đồ.

## Component & ranh giới

- `src/lib/letterStrokes.ts` — dữ liệu nét + `getStrokes`.
- `src/components/games/StrokeTracer.tsx` (mới) — widget SVG đồ **một** chữ.
  Props: `{ letter: string; onComplete: () => void; onFail: () => void }`.
  Tự quản lý: nét hiện tại, mực bé đang vẽ, sao chạy mẫu, chấm từng nét.
- `src/components/games/TracingGame.tsx` — giữ nguyên phần chọn chữ (picker) và
  header; thay khối luyện viết bằng `<StrokeTracer letter={currentLetter}
  onComplete={onComplete} onFail={onFail} />`. Xoá `TracingCanvas` cũ.
- `src/App.tsx` — **không đổi**: vẫn 7 props của TracingGame; `onComplete` gọi
  khi xong **cả chữ**, `onFail` gọi mỗi lần một nét bị lệch (đã map sẵn vào
  `handleTracingComplete`/`handleTracingFail`).

## Luồng trong StrokeTracer

State: `currentStrokeIndex` (nét đang đồ), `userPoints` (điểm bé vẽ nét hiện tại),
`isDrawing`, `showDemo`.

Hiển thị (SVG layers, dưới → trên):
1. **Nét đã xong** — vẽ đậm (màu nhạt cố định).
2. **Nét tương lai** — rất mờ.
3. **Nét hiện tại** — gạch mờ nổi bật (dashed).
4. **Sao mẫu** — chấm chạy dọc nét hiện tại theo `getPointAtLength`, lặp, dạy
   chiều; ẩn khi bé bắt đầu chạm.
5. **Mực bé** — polyline lớn dần theo `userPoints`.

Tương tác: Pointer Events (`pointerdown/move/up`) + `setPointerCapture`,
`touch-action: none`. Đổi toạ độ client → SVG bằng `svg.getScreenCTM().inverse()`.

Chấm khi nhấc tay (1 lần `pointerdown..up` = 1 lần thử nét hiện tại):
- Lấy `N≈100` điểm mẫu dọc nét đích: `P[i] = path.getPointAtLength(i/N * total)`.
- **Độ phủ** `coverage` = (số mẫu `P` có điểm bé trong bán kính `R`) / N.
- **Độ bám** `onTrack` = (số điểm bé nằm trong bán kính `R` của nét) / tổng điểm bé.
- **Đạt** khi `coverage ≥ COVER_PASS` **và** `onTrack ≥ TRACK_PASS`.
  Giá trị khởi điểm (đơn vị viewBox 100): `R = 9` (hành lang rộng ~18),
  `COVER_PASS = 0.75`, `TRACK_PASS = 0.70`. Tinh chỉnh khi test thủ công.
- Đạt → nét hiện tại thành "đã xong", `currentStrokeIndex++`, chạy mẫu nét kế.
  Nếu hết nét → `onComplete()`.
- Trượt → `onFail()` (tính 1 sai), xoá `userPoints`, hiện lại sao mẫu, cho làm lại.

## Xử lý lỗi / biên

- Chữ không có trong `LETTER_STROKES` (không xảy ra vì phủ đủ; phòng thủ):
  StrokeTracer hiện thông báo nhẹ, không crash.
- `getScreenCTM()` trả null trước khi mount: guard, bỏ qua điểm đó.
- Bé chạm rồi nhấc ngay (đường quá ngắn): `onTrack`/`coverage` thấp → coi như
  trượt, không crash khi chia 0 (nếu `userPoints` rỗng → trượt).
- Đổi chữ giữa chừng / reset: StrokeTracer remount theo `key={currentLetter}`
  ở phía TracingGame, state nét reset sạch.
- Nút "Xoá để viết lại" (Eraser, giữ từ bản cũ): xoá mực nét hiện tại, không
  đổi `currentStrokeIndex`.

## Kiểm chứng

Project không có test framework (không thêm trong scope này).
1. `npm run lint` (tsc --noEmit) pass.
2. `npm run build` pass.
3. Manual checklist qua `npm run dev`:
   - Cả 39 ký tự render đúng nét, sao mẫu chạy đúng chiều.
   - Đồ bám nét → đậu và sang nét kế; scribble lệch → tính sai + cho làm lại.
   - 7 ký tự dấu (Ă Â Đ Ê Ô Ơ Ư) hiển thị dấu đúng vị trí.
   - Xong cả chữ → pháo giấy + cộng điểm + về picker; giọng đọc tên bé giữ nguyên.
   - Cảm ứng (touch) trên tablet kéo được, không cuộn trang khi vẽ.

## Ngoài scope

- Không dạy/ép thứ tự nét theo chuẩn sư phạm chính thống (dùng thứ tự Hershey).
- Không ép chiều viết khi chấm.
- Không chữ thường (giữ in hoa như app hiện tại).
- Không thêm thư viện nhận dạng chữ viết tay; không snap nét.
- Không đổi các game khác hay luồng App.
