# Design: Tách component các trò chơi + Màn hình nhập tên bé

**Ngày:** 2026-06-10
**Trạng thái:** Đã duyệt

## Mục tiêu

1. Tách `src/App.tsx` (~1230 dòng, chứa toàn bộ 8 game mode) thành các component riêng.
2. Thêm màn hình nhập tên bé khi vào app lần đầu.
3. Mọi text hiển thị và giọng đọc đang hardcode "Voi" sẽ dùng tên bé vừa nhập.

## Quyết định đã chốt

| Quyết định | Lựa chọn |
|---|---|
| Lưu tên | `localStorage` key `childName` — chỉ hỏi lần đầu, có nút "Đổi tên" trên StartScreen |
| Xưng hô | **Chỉ tên**: "Na đếm xem có bao nhiêu hình nhé", "Đúng rồi! Na giỏi quá!" |
| Cấu trúc | Tách đầy đủ: mỗi game 1 file, tách lib (questions/audio/constants) và types |

## Luồng màn hình

```
Mở app → đọc localStorage("childName")
  ├─ Chưa có tên → NameEntryScreen
  │     nhập tên → validate (trim, không rỗng, ≤20 ký tự)
  │     → lưu localStorage → speak "Xin chào {tên}! Cùng học nào!" → StartScreen
  └─ Có tên → StartScreen
StartScreen → chọn game (+ cài đặt phạm vi/phép tính) → Playing → hết giờ → EndScreen
EndScreen → "Chơi lại" (cùng mode) | "Trang chủ" (StartScreen)
StartScreen → nút "Đổi tên" → NameEntryScreen (prefill tên hiện tại)
```

## Cấu trúc file

```
src/
├─ App.tsx                 — điều hướng màn hình + state phiên chơi
├─ types.ts                — GameMode, Question, MathOperator
├─ lib/
│  ├─ constants.ts         — EMOJIS, PATTERN_TYPES, LETTER_LIST, SOUNDS
│  ├─ audio.ts             — playSound, speakText (vi-VN, giữ nguyên logic)
│  └─ questions.ts         — generateMath(range, op), generateCounting(name),
│                            generatePattern(name), generateSequence(range),
│                            generateComparison(range, name),
│                            generateMissingNumber(range, name),
│                            generateLetterRecognition(name)
└─ components/
   ├─ NameEntryScreen.tsx  — nhập tên bé
   ├─ StartScreen.tsx      — chọn game + cài đặt + nút "Đổi tên"
   ├─ EndScreen.tsx        — tổng kết điểm
   ├─ GameHUD.tsx          — thanh Thoát / Tổng / Sai / Điểm / Timer
   ├─ AnswerGrid.tsx       — lưới nút đáp án dùng chung (prop màu, cỡ chữ)
   ├─ FeedbackOverlay.tsx  — overlay Đúng/Sai dùng chung
   └─ games/
      ├─ MathGame.tsx
      ├─ CountingGame.tsx
      ├─ TracingGame.tsx      — gồm letter picker + TracingCanvas
      ├─ PatternGame.tsx
      ├─ SequenceGame.tsx
      ├─ ComparisonGame.tsx
      ├─ MissingNumberGame.tsx
      └─ LetterRecognitionGame.tsx
```

## Phân chia trách nhiệm

- **App.tsx**: giữ state phiên chơi như hiện tại (screen, mode, score, wrongCount,
  totalCount, timeLeft, feedback, question, các setting phạm vi/phép tính) +
  state `childName` (khởi tạo từ localStorage). Logic timer, handleAnswer,
  nextQuestion, confetti, speak khen/chê nằm ở App.
- **Game components**: thuần trình bày — nhận `question`, `feedback`, `onAnswer`,
  `name` qua props và render phần thân câu hỏi. `TracingGame` đặc thù: không
  timer, có letter picker, nhận `onComplete`/`onFail`.
- **questions.ts**: hàm sinh câu hỏi nhận `name` để nhúng tên vào `Question.text`
  (giọng đọc tự ăn theo vì App speak `question.text`).

## Thay "Voi" bằng tên

Mọi chuỗi chứa "Voi" đổi thành tên bé, gồm: tiêu đề StartScreen
("{tên} Vui Học Tập! 🌟"), text câu hỏi các mode, lời khen/nhắc
("Đúng rồi! {tên} giỏi quá!", "{tên} viết chưa đúng rồi!", "Thử lại nhé!"),
màn tổng kết ("{tên} đã làm rất tốt!"), tooltip tập viết. Footer
"Học mà chơi, chơi mà học" giữ nguyên. Tên app trong `metadata.json`/`index.html`
giữ nguyên.

## Xử lý lỗi

- localStorage bị chặn (private mode): bọc try/catch khi đọc/ghi, fallback
  state trong phiên (mỗi lần mở sẽ hỏi lại tên — chấp nhận được).
- Tên rỗng/toàn khoảng trắng: disable nút bắt đầu.
- Hành vi game giữ nguyên 100%: timer 30s, âm thanh, confetti, thuật toán
  chấm điểm tập viết (coverage > 0.4, accuracy > 0.3), drag-drop so sánh.

## Kiểm chứng

Project chưa có test framework và không thêm trong scope này. Kiểm chứng bằng:

1. `npm run lint` (tsc --noEmit) pass, không lỗi type.
2. Chạy `npm run dev`: kiểm tra luồng nhập tên (lần đầu, reload, đổi tên) và
   từng game mode hiển thị tên đúng trong text + giọng đọc.

## Ngoài scope

- Không thêm test framework, không dọn dependency thừa (`@google/genai`,
  `express`, `dotenv`), không đổi gameplay, không hỗ trợ nhiều profile bé.
