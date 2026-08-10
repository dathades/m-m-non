// Tải danh sách âm tiết tiếng Việt (sắp theo tần suất) và ghi ra module TS.
// Nguồn: hieuthi — 7184 common Vietnamese syllables
// https://gist.github.com/hieuthi/1f5d80fca871f3642f61f7e3de883f3a
// Dự phòng: https://raw.githubusercontent.com/vietnameselanguage/syllable/master/syllables.txt
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const URL =
  'https://gist.githubusercontent.com/hieuthi/1f5d80fca871f3642f61f7e3de883f3a/raw';
const LOCAL = 'scripts/vi-syllables-raw.txt';

// Ưu tiên file cục bộ (khi máy build không có mạng); nếu không có thì tải.
let text;
if (existsSync(LOCAL)) {
  text = readFileSync(LOCAL, 'utf8');
} else {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Tải thất bại: ${res.status}`);
  text = await res.text();
}

const seen = new Set();
const syllables = [];
for (const raw of text.split(/[\s,]+/)) {
  const s = raw.trim().toLowerCase().normalize('NFC');
  // chỉ giữ 1 tiếng thuần chữ (có dấu), bỏ dòng rỗng/khoảng trắng/số
  if (!s || /[^a-zàáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/.test(s)) {
    continue;
  }
  if (seen.has(s)) continue;
  seen.add(s);
  syllables.push(s);
}

const header =
  '// TỰ ĐỘNG SINH bởi scripts/build-syllables.mjs — đừng sửa tay.\n' +
  '// Nguồn: hieuthi "7184 common Vietnamese syllables" (sắp theo tần suất giảm dần).\n' +
  '// https://gist.github.com/hieuthi/1f5d80fca871f3642f61f7e3de883f3a\n\n';
const body =
  'export const VI_SYLLABLES: string[] = ' +
  JSON.stringify(syllables) +
  ';\n';

writeFileSync('src/lib/viSyllables.ts', header + body, 'utf8');
console.log(`Đã ghi ${syllables.length} tiếng vào src/lib/viSyllables.ts`);
