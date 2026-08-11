# Thiết kế: Màn đầu vào — nhập tên + chọn lớp

Ngày: 2026-08-11

## Mục tiêu

Khi mới vào web, gộp **nhập tên** và **chọn lớp** vào cùng một màn hình. Hai lớp:
**Mầm non** và **Lớp 4** (lớp 4). Lưu lớp đã chọn để dùng về sau.

Phạm vi lần này **chỉ là màn đầu vào + lưu lớp + đổi lớp**. Chọn lớp **chưa có
tác dụng** gì tới nội dung game — cả hai lớp vào cùng `StartScreen` hiện tại.
Nội dung/bài học riêng cho lớp 4 là một buổi thiết kế **riêng** sau này
(sẽ thêm bộ lọc game theo lớp lúc đó — không làm bây giờ, YAGNI).

## Quyết định đã chốt

- Hai lớp, nhãn đúng: **"Mầm non"** và **"Lớp 4"**.
- Chọn lớp không đổi nội dung game (cả hai → `StartScreen` như cũ).
- Có nút **"Đổi lớp"** ở `StartScreen` (cạnh "Đổi tên").
- Phải có **cả tên và lớp** mới vào được màn game.
- **Lời chào giữ nguyên** như hiện tại (`Xin chào <tên>! Cùng học nào!`) — không
  nhắc lớp.

## Trải nghiệm

Màn đầu vào (một màn, thứ tự trên→dưới):
1. Emoji 🐘 + tiêu đề "Chào mừng bé! 🌟".
2. "Bé học lớp nào?" — **2 thẻ chọn lớp** cạnh nhau: **Mầm non** (🧸) và
   **Lớp 4** (🎓). Chạm để chọn; thẻ được chọn có viền/nền nổi bật. Chọn 1.
3. "Tên của bé là gì nào?" — ô nhập tên (giữ nguyên logic lọc ký tự, maxLength,
   Enter để gửi như hiện tại).
4. Nút **"🚀 Bắt đầu học!"** — chỉ bật khi **đã nhập tên (trim khác rỗng) và đã
   chọn lớp**.

Khi vào lại để sửa (bấm "Đổi tên" hoặc "Đổi lớp" ở `StartScreen`): mở lại đúng
màn này, **điền sẵn** tên và lớp đang dùng.

## Kiến trúc

Bám pattern hiện có (localStorage cho tên → thêm tương tự cho lớp).

### 1. Kiểu — `src/types.ts`
Thêm:
```ts
export type ClassLevel = 'mam_non' | 'lop_4';
```

### 2. Component — đổi `NameEntryScreen.tsx` → `EntryScreen.tsx`
Vì màn này giờ làm cả tên + lớp, đổi tên file/component cho đúng trách nhiệm.
Props:
```ts
interface EntryScreenProps {
  initialName: string;
  initialClass: ClassLevel | '';
  onSubmit: (name: string, level: ClassLevel) => void;
}
```
- State nội bộ: `name` (khởi tạo `initialName`), `level` (khởi tạo `initialClass`).
- 2 thẻ lớp: mảng cấu hình `[{ value:'mam_non', label:'Mầm non', emoji:'🧸' },
  { value:'lop_4', label:'Lớp 4', emoji:'🎓' }]`. Thẻ được chọn có style active.
- Nút gửi `disabled` khi `!name.trim() || !level`. Gửi: `onSubmit(name.trim(), level)`.
- Giữ nguyên phần nhập tên (lọc ký tự `/[-+=<>?]/g`, maxLength 20, autoFocus,
  Enter gửi — nhưng Enter chỉ gửi khi đã chọn lớp).
- Giữ nguyên khung/hiệu ứng motion và class Tailwind tông sáng như bản cũ.

### 3. `src/App.tsx`
- Thêm hằng `CLASS_STORAGE_KEY = 'childClass'` + `loadChildClass()` /
  `saveChildClass()` (đối xứng với tên). `loadChildClass` trả về `ClassLevel | ''`,
  chỉ chấp nhận `'mam_non'`/`'lop_4'`, giá trị khác → `''`.
- State: `const [childClass, setChildClass] = useState<ClassLevel | ''>(loadChildClass)`.
- Đổi `editingName` → `editingSetup` (vì màn này giờ sửa cả tên lẫn lớp).
- Gộp `handleNameSubmit` → `handleSetupSubmit(name, level)`:
  lưu tên + lớp, `setChildName`, `setChildClass`, `setEditingSetup(false)`,
  `speakText(\`Xin chào ${name}! Cùng học nào!\`)` (giữ nguyên lời chào).
- Gate: `const needsSetup = !childName || !childClass || editingSetup;`
  Thay chỗ dùng `needsName` bằng `needsSetup`; render `EntryScreen` thay
  `NameEntryScreen`, truyền `initialName={childName}` `initialClass={childClass}`
  `onSubmit={handleSetupSubmit}`.
- `StartScreen` nhận thêm `onChangeClass={() => setEditingSetup(true)}`
  (nút "Đổi tên" cũng gọi `setEditingSetup(true)`).

### 4. `src/components/StartScreen.tsx`
- Thêm prop `onChangeClass: () => void`.
- Cạnh nút "Đổi tên" thêm nút **"Đổi lớp"** (cùng style nhỏ, icon `GraduationCap`
  của lucide), `onClick={onChangeClass}`.

## Kiểm thử
- Không có logic thuần đáng thêm test. Kiểm bằng `npm run lint` (tsc) +
  `npm run build` + chơi thử:
  - Vào lần đầu: phải chọn lớp và nhập tên mới bật nút Bắt đầu.
  - Chọn lớp, nhập tên → vào `StartScreen` bình thường (cả 2 lớp giống nhau).
  - Bấm "Đổi lớp"/"Đổi tên" → mở lại màn đầu vào, điền sẵn tên + lớp; đổi rồi
    quay lại được.
  - Tải lại trang: tên + lớp vẫn nhớ (localStorage), vào thẳng `StartScreen`.
  - `viSyllables`/`spelling` test cũ vẫn 33/33 pass (không đụng tới).

## Ngoài phạm vi (YAGNI)
- Không lọc/ẩn game theo lớp (chưa có nội dung lớp 4 → chọn lớp chưa có tác dụng).
- Không thêm nội dung/bài toán lớp 4 (buổi thiết kế riêng sau).
- Không đổi lời chào theo lớp.
- Không thêm lớp thứ 3.
