# Tracing SVG Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm lại bài Tập Viết: bé đồ chữ tiếng Việt theo từng nét trên nền đường mờ, chấm điểm bằng khoảng cách hình học tới nét (SVG `getPointAtLength`) thay cho so pixel — hết lỗi "đồ đúng vẫn báo sai".

**Architecture:** Dữ liệu nét (Hershey Simplex A–Z/0–9 + 7 dấu tiếng Việt) sinh offline vào `src/lib/letterStrokes.ts`. Module chấm điểm thuần `src/lib/tracingScore.ts` (test bằng `tsx`). Widget `StrokeTracer.tsx` render SVG, thu nét bằng Pointer Events, chấm từng nét. `TracingGame.tsx` thay `TracingCanvas` bằng `StrokeTracer`; `App.tsx` không đổi.

**Tech Stack:** React 19, TypeScript (non-strict), Vite 6, Tailwind 4, lucide-react. Sinh dữ liệu bằng Node ESM script. Test đơn vị bằng `tsx` (đã có trong devDependencies). Không thêm thư viện runtime.

**Spec:** `docs/superpowers/specs/2026-06-11-tracing-svg-redesign-design.md`

**Quy ước:** Import nội bộ kèm đuôi `.ts`/`.tsx`. Toạ độ nét nằm trong viewBox `0..100`. Cho tới Task 7, file `TracingGame.tsx` cũ vẫn nguyên và app vẫn build (các file mới chỉ thêm vào, chưa wire).

---

### Task 1: Lấy dữ liệu Hershey Simplex → `scripts/vendor/hershey-base.json`

**Files:**
- Create: `scripts/vendor/hershey-base.json`

Mục tiêu: tạo một file JSON **đã chuẩn hoá shape** cho 36 ký tự `A`–`Z` và `0`–`9`,
dạng `Record<string, [number, number][][]>` — mỗi ký tự = mảng các **nét**, mỗi nét =
mảng điểm `[x, y]` trong hệ toạ độ gốc của Hershey (chưa scale về 100). Đây là bước
"thu thập" tách biệt khỏi bước "biến đổi xác định" (Task 2).

- [ ] **Step 1: Tìm & lấy bộ Hershey Roman Simplex (public domain)**

Dùng WebSearch/WebFetch tìm bộ dữ liệu Hershey "rowmans"/"Roman Simplex" dạng JSON
hoặc `.jhf` (public domain — gốc từ US NBS, Dr. A.V. Hershey). Trích đúng 36 ký tự
`A`–`Z`, `0`–`9`. Chuyển về shape `{ "A": [[[x,y],...], ...], ... }` (char → nét → điểm),
ghi ra `scripts/vendor/hershey-base.json`.

Nếu KHÔNG lấy được dữ liệu public-domain nào: **báo BLOCKED** (đừng bịa toạ độ) —
controller sẽ chuyển sang phương án vẽ tay skeleton.

- [ ] **Step 2: Kiểm tra cấu trúc**

Run: `node -e "const d=require('./scripts/vendor/hershey-base.json'); const k=Object.keys(d); console.log('keys', k.length); console.log('A strokes', d.A.length); console.log('A first pt', d.A[0][0]); const need=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789']; console.log('missing', need.filter(c=>!d[c]))"`
Expected: `keys 36`, `missing []`, và in được toạ độ điểm đầu của `A` (xác nhận shape `[x,y]`). Ghi lại khoảng giá trị x,y quan sát được (phục vụ Task 2).

- [ ] **Step 3: Commit**

```bash
git add scripts/vendor/hershey-base.json
git commit -m "data: vendor Hershey Simplex base glyphs (A-Z, 0-9)"
```

---

### Task 2: Script sinh dữ liệu → `src/lib/letterStrokes.ts` (36 ký tự gốc)

**Files:**
- Create: `scripts/genLetterStrokes.mjs`
- Create: `src/lib/letterStrokes.ts` (do script sinh ra)

- [ ] **Step 1: Viết `scripts/genLetterStrokes.mjs`**

Script đọc `hershey-base.json`, chuẩn hoá **toàn cục** (giữ tỉ lệ tương đối giữa
các chữ): gom tất cả điểm → bbox chung → scale + căn giữa vào viewBox 100×100 với
padding. `FLIP_Y` và `PAD` là hằng tinh chỉnh ở Task 4. Có `OVERRIDES` để thay tay
một glyph nếu Hershey cho ra xấu. Phần dấu tiếng Việt (Task 3) được nối thêm sau.

```js
import { readFileSync, writeFileSync } from 'node:fs';

const PAD = 12;          // lề trong viewBox 100
const FLIP_Y = true;     // Hershey y thường hướng lên; SVG y hướng xuống → lật
const BOX = 100;

// Thay tay glyph xấu (key rỗng = không override). Toạ độ đã ở hệ viewBox 0..100.
const OVERRIDES = {};

// ----- Nét dấu tiếng Việt (viewBox 0..100), đặt ở vùng trên đỉnh chữ -----
// Tinh chỉnh vị trí ở Task 4 bằng trang preview.
const MARKS = {
  breve:      'M 38 14 Q 50 24 62 14',          // ˘  (Ă)
  circumflex: 'M 38 14 L 50 4 L 62 14',         // ^  (Â Ê Ô)
  hornO:      'M 70 22 Q 80 18 78 30',          // móc phải trên O (Ơ)
  hornU:      'M 70 22 Q 80 18 78 30',          // móc phải trên U (Ư)
  barD:       'M 14 52 L 38 52',                // gạch ngang thân D (Đ)
};

// Ghép: chữ gốc + (các) nét dấu
const COMPOSITES = {
  'Ă': ['A', 'breve'],
  'Â': ['A', 'circumflex'],
  'Ê': ['E', 'circumflex'],
  'Ô': ['O', 'circumflex'],
  'Ơ': ['O', 'hornO'],
  'Ư': ['U', 'hornU'],
  'Đ': ['D', 'barD'],
};

const raw = JSON.parse(readFileSync(new URL('./vendor/hershey-base.json', import.meta.url)));

// bbox toàn cục
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const ch of Object.keys(raw)) {
  for (const stroke of raw[ch]) {
    for (const [x, y] of stroke) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
const w = maxX - minX, h = maxY - minY;
const scale = (BOX - 2 * PAD) / Math.max(w, h);
const offX = (BOX - w * scale) / 2;
const offY = (BOX - h * scale) / 2;

const norm = (x, y) => {
  const nx = offX + (x - minX) * scale;
  let ny = offY + (y - minY) * scale;
  if (FLIP_Y) ny = BOX - ny;
  return [Math.round(nx * 100) / 100, Math.round(ny * 100) / 100];
};

const toPath = (stroke) =>
  'M ' + stroke.map(([x, y]) => { const [a, b] = norm(x, y); return `${a} ${b}`; }).join(' L ');

const base = {};
for (const ch of Object.keys(raw)) {
  base[ch] = OVERRIDES[ch] ?? raw[ch].map(toPath);
}

// composites
const all = { ...base };
for (const [ch, parts] of Object.entries(COMPOSITES)) {
  const baseCh = parts[0];
  const markPaths = parts.slice(1).map((m) => MARKS[m]);
  all[ch] = [...base[baseCh], ...markPaths];
}

const ORDER = [...'0123456789', ...'AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY'];
const body = ORDER
  .filter((c) => all[c])
  .map((c) => `  ${JSON.stringify(c)}: ${JSON.stringify(all[c])},`)
  .join('\n');

const out = `// AUTO-GENERATED by scripts/genLetterStrokes.mjs — do not edit by hand.
// Nguồn: Hershey Roman Simplex (public domain) + dấu tiếng Việt tự vẽ.
export type GlyphStrokes = string[];

export const LETTER_STROKES: Record<string, GlyphStrokes> = {
${body}
};

export function getStrokes(letter: string): GlyphStrokes {
  return LETTER_STROKES[letter] ?? [];
}
`;
writeFileSync(new URL('../src/lib/letterStrokes.ts', import.meta.url), out);
console.log('Wrote src/lib/letterStrokes.ts with', Object.keys(all).length, 'glyphs');
```

- [ ] **Step 2: Chạy script**

Run: `node scripts/genLetterStrokes.mjs`
Expected: in `Wrote src/lib/letterStrokes.ts with 43 glyphs` (36 gốc + 7 dấu).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/genLetterStrokes.mjs src/lib/letterStrokes.ts
git commit -m "feat: generate letterStrokes from Hershey data + Vietnamese marks"
```

---

### Task 3: Xác nhận phủ đủ `LETTER_LIST`

**Files:**
- Verify only (đọc `src/lib/constants.ts` `LETTER_LIST` và `src/lib/letterStrokes.ts`).

- [ ] **Step 1: Kiểm tra mọi ký tự trong LETTER_LIST đều có nét**

Run: `node -e "const {LETTER_STROKES}=await import('./src/lib/letterStrokes.ts').catch(()=>({}));" 2>$null; npx tsx -e "import {getStrokes} from './src/lib/letterStrokes.ts'; const LETTER_LIST=['0','1','2','3','4','5','6','7','8','9','A','Ă','Â','B','C','D','Đ','E','Ê','G','H','I','K','L','M','N','O','Ô','Ơ','P','Q','R','S','T','U','Ư','V','X','Y']; const miss=LETTER_LIST.filter(c=>getStrokes(c).length===0); console.log('missing', miss); if(miss.length) process.exit(1);"`
Expected: `missing []`, exit 0. (39 ký tự của LETTER_LIST đều có ≥1 nét.)

- [ ] **Step 2: Nếu thiếu ký tự** — thêm vào `OVERRIDES`/`MARKS`/`COMPOSITES` trong `scripts/genLetterStrokes.mjs`, chạy lại `node scripts/genLetterStrokes.mjs`, lặp lại Step 1. Khi đủ, commit:

```bash
git add scripts/genLetterStrokes.mjs src/lib/letterStrokes.ts
git commit -m "fix: ensure full LETTER_LIST coverage in letterStrokes"
```

(Nếu Step 1 đã pass ngay, bỏ qua Step 2 — không tạo commit rỗng.)

---

### Task 4: Trang preview trực quan + chỉnh nét xấu (cổng kiểm tra mắt thường)

**Files:**
- Create: `scripts/previewLetters.mjs`
- Create: `scripts/preview.html` (do script sinh; KHÔNG commit)

- [ ] **Step 1: Viết `scripts/previewLetters.mjs`**

Sinh `scripts/preview.html` hiển thị cả 39 ký tự (mỗi ô 1 SVG vẽ các nét), để mở bằng trình duyệt và soi mắt.

```js
import { readFileSync, writeFileSync } from 'node:fs';

const ts = readFileSync(new URL('../src/lib/letterStrokes.ts', import.meta.url), 'utf8');
const json = JSON.parse(ts.slice(ts.indexOf('{'), ts.indexOf('};') + 1).replace(/,\s*}$/, '}'));

const LETTER_LIST = ['0','1','2','3','4','5','6','7','8','9','A','Ă','Â','B','C','D','Đ','E','Ê','G','H','I','K','L','M','N','O','Ô','Ơ','P','Q','R','S','T','U','Ư','V','X','Y'];

const cell = (c) => {
  const paths = (json[c] || []).map((d, i) =>
    `<path d="${d}" fill="none" stroke="${['#7c3aed','#db2777','#0891b2','#ea580c'][i%4]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return `<div style="text-align:center"><svg viewBox="0 0 100 100" width="120" height="120" style="border:1px solid #ddd;background:#fff"><rect x="0" y="0" width="100" height="100" fill="none"/>${paths}</svg><div style="font:14px sans-serif">${c} (${(json[c]||[]).length} nét)</div></div>`;
};

const html = `<!doctype html><meta charset="utf-8"><body style="display:flex;flex-wrap:wrap;gap:8px;background:#f8fafc">${LETTER_LIST.map(cell).join('')}</body>`;
writeFileSync(new URL('./preview.html', import.meta.url), html);
console.log('Wrote scripts/preview.html — open it in a browser');
```

- [ ] **Step 2: Sinh & mở preview**

Run: `node scripts/previewLetters.mjs`
Rồi mở `scripts/preview.html` trong trình duyệt (báo người dùng mở giúp nếu cần).
Expected: 39 ô, mỗi ô là một chữ/số **đọc được**, nét nằm gọn trong ô, các nét nhiều màu nối đúng hình; dấu của Ă Â Đ Ê Ô Ơ Ư nằm đúng vị trí (mũ/breve trên đỉnh, móc góc phải trên, gạch ngang giữa thân D).

- [ ] **Step 3: Chỉnh nét chưa đạt**

Với glyph bị lật/lệch/sai tỉ lệ: chỉnh `FLIP_Y`/`PAD` (toàn cục) hoặc thêm `OVERRIDES[c]` (một glyph) trong `scripts/genLetterStrokes.mjs`. Với dấu lệch: chỉnh `MARKS`. Sau mỗi lần: `node scripts/genLetterStrokes.mjs && node scripts/previewLetters.mjs`, mở lại preview. Lặp tới khi cả 39 ô đạt.

- [ ] **Step 4: Bỏ qua preview.html khỏi git & commit**

Thêm dòng `scripts/preview.html` vào `.gitignore`. Rồi:

```bash
git add .gitignore scripts/previewLetters.mjs scripts/genLetterStrokes.mjs src/lib/letterStrokes.ts
git commit -m "chore: letter preview harness; tune glyph/mark geometry"
```

---

### Task 5: Module chấm điểm thuần `src/lib/tracingScore.ts` (TDD)

**Files:**
- Create: `scripts/tracingScore.test.ts`
- Create: `src/lib/tracingScore.ts`

- [ ] **Step 1: Viết test trước**

```ts
import assert from 'node:assert';
import { scoreStroke, type Pt } from '../src/lib/tracingScore.ts';

const line: Pt[] = Array.from({ length: 101 }, (_, i) => ({ x: i, y: 50 }));

// 1) Đồ trùng khít nét → đậu, phủ & bám ~1
const perfect = scoreStroke(line, line);
assert.ok(perfect.pass, 'perfect trace should pass');
assert.ok(perfect.coverage > 0.95, 'coverage high');
assert.ok(perfect.onTrack > 0.95, 'onTrack high');

// 2) Không vẽ gì → trượt
const empty = scoreStroke(line, []);
assert.strictEqual(empty.pass, false);
assert.strictEqual(empty.coverage, 0);

// 3) Vẽ xa hẳn nét (cách 40 đơn vị) → bám 0, trượt
const farAway: Pt[] = line.map((p) => ({ x: p.x, y: p.y + 40 }));
const far = scoreStroke(line, farAway);
assert.strictEqual(far.onTrack, 0, 'all user points off track');
assert.strictEqual(far.pass, false);

// 4) Chỉ đồ nửa nét → phủ ~0.5 → trượt (ngưỡng 0.75)
const half = scoreStroke(line, line.slice(0, 50));
assert.ok(half.coverage < 0.6, 'half coverage');
assert.strictEqual(half.pass, false);

// 5) Nhiễu nhẹ trong hành lang (lệch ≤6 < R=9) → vẫn đậu
const noisy: Pt[] = line.map((p, i) => ({ x: p.x, y: p.y + (i % 2 ? 6 : -6) }));
const ok = scoreStroke(line, noisy);
assert.ok(ok.pass, 'small noise within corridor should pass');

console.log('tracingScore: all assertions passed');
```

- [ ] **Step 2: Chạy test → phải FAIL**

Run: `npx tsx scripts/tracingScore.test.ts`
Expected: FAIL — không import được `../src/lib/tracingScore.ts` (chưa tồn tại).

- [ ] **Step 3: Viết `src/lib/tracingScore.ts`**

```ts
export interface Pt {
  x: number;
  y: number;
}

export interface StrokeScore {
  coverage: number; // 0..1: tỉ lệ điểm mẫu của nét được bé đi qua
  onTrack: number;  // 0..1: tỉ lệ mực bé nằm sát nét
  pass: boolean;
}

export const TRACE_RADIUS = 9; // đơn vị viewBox 0..100 (hành lang rộng ~18)
export const COVER_PASS = 0.75;
export const TRACK_PASS = 0.7;

const dist2 = (a: Pt, b: Pt): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

const minDist2ToSet = (p: Pt, set: Pt[]): number => {
  let best = Infinity;
  for (const q of set) {
    const d = dist2(p, q);
    if (d < best) best = d;
  }
  return best;
};

export function scoreStroke(
  samplePoints: Pt[],
  userPoints: Pt[],
  radius: number = TRACE_RADIUS,
  coverPass: number = COVER_PASS,
  trackPass: number = TRACK_PASS
): StrokeScore {
  if (samplePoints.length === 0 || userPoints.length === 0) {
    return { coverage: 0, onTrack: 0, pass: false };
  }
  const r2 = radius * radius;

  let visited = 0;
  for (const s of samplePoints) {
    if (minDist2ToSet(s, userPoints) <= r2) visited++;
  }
  let near = 0;
  for (const u of userPoints) {
    if (minDist2ToSet(u, samplePoints) <= r2) near++;
  }

  const coverage = visited / samplePoints.length;
  const onTrack = near / userPoints.length;
  return { coverage, onTrack, pass: coverage >= coverPass && onTrack >= trackPass };
}
```

- [ ] **Step 4: Chạy test → phải PASS**

Run: `npx tsx scripts/tracingScore.test.ts`
Expected: `tracingScore: all assertions passed`, exit 0.

- [ ] **Step 5: Lint + commit**

Run: `npm run lint` → exit 0.

```bash
git add scripts/tracingScore.test.ts src/lib/tracingScore.ts
git commit -m "feat: pure per-stroke tracing score with tsx unit test"
```

---

### Task 6: Widget `src/components/games/StrokeTracer.tsx`

**Files:**
- Create: `src/components/games/StrokeTracer.tsx`

- [ ] **Step 1: Viết file**

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';
import { getStrokes } from '../../lib/letterStrokes.ts';
import { scoreStroke, type Pt } from '../../lib/tracingScore.ts';

const SAMPLES = 100;
const VIEWBOX = 100;
const DEMO_DURATION = 1600; // ms cho sao chạy hết 1 nét

interface StrokeTracerProps {
  letter: string;
  onComplete: () => void;
  onFail: () => void;
}

export default function StrokeTracer({ letter, onComplete, onFail }: StrokeTracerProps) {
  const strokes = getStrokes(letter);
  const svgRef = useRef<SVGSVGElement>(null);
  const measureRef = useRef<SVGPathElement>(null);
  const [current, setCurrent] = useState(0);
  const [userPoints, setUserPoints] = useState<Pt[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [demoPos, setDemoPos] = useState<Pt | null>(null);

  // Đổi chữ → về nét đầu (phòng thủ; parent cũng remount bằng key)
  useEffect(() => {
    setCurrent(0);
    setUserPoints([]);
    setDrawing(false);
  }, [letter]);

  // Sao chạy mẫu dọc nét hiện tại (ẩn khi bé đang vẽ)
  useEffect(() => {
    if (drawing || current >= strokes.length) {
      setDemoPos(null);
      return;
    }
    const path = measureRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const frac = ((t - start) % DEMO_DURATION) / DEMO_DURATION;
      const p = path.getPointAtLength(frac * total);
      setDemoPos({ x: p.x, y: p.y });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, letter, drawing, strokes.length]);

  const toSvg = useCallback((clientX: number, clientY: number): Pt | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (current >= strokes.length) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toSvg(e.clientX, e.clientY);
    setDrawing(true);
    setUserPoints(p ? [p] : []);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const p = toSvg(e.clientX, e.clientY);
    if (p) setUserPoints((prev) => [...prev, p]);
  };

  const onPointerUp = () => {
    if (!drawing) return;
    setDrawing(false);
    const path = measureRef.current;
    if (!path) {
      setUserPoints([]);
      return;
    }
    const total = path.getTotalLength();
    const samples: Pt[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const p = path.getPointAtLength((i / SAMPLES) * total);
      samples.push({ x: p.x, y: p.y });
    }
    const result = scoreStroke(samples, userPoints);
    setUserPoints([]);
    if (result.pass) {
      const next = current + 1;
      if (next >= strokes.length) {
        onComplete();
      } else {
        setCurrent(next);
      }
    } else {
      onFail();
    }
  };

  if (strokes.length === 0) {
    return <div className="text-gray-400 font-bold p-8">Chữ này chưa có dữ liệu nét.</div>;
  }

  const userPathD = userPoints.length
    ? 'M ' + userPoints.map((p) => `${p.x} ${p.y}`).join(' L ')
    : '';

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative bg-white rounded-3xl shadow-inner border-4 border-dashed border-purple-200 overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          width={400}
          height={400}
          className="touch-none cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Nét tương lai (rất mờ) */}
          {strokes.map((d, i) =>
            i > current ? (
              <path key={`f${i}`} d={d} fill="none" stroke="#f3e8ff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            ) : null
          )}
          {/* Nét đã xong (đậm nhạt) */}
          {strokes.map((d, i) =>
            i < current ? (
              <path key={`d${i}`} d={d} fill="none" stroke="#c4b5fd" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            ) : null
          )}
          {/* Nét hiện tại (gạch mờ) + path đo */}
          <path
            ref={measureRef}
            d={strokes[current]}
            fill="none"
            stroke="#a78bfa"
            strokeWidth={4}
            strokeDasharray="2 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Mực bé */}
          {userPathD ? (
            <path d={userPathD} fill="none" stroke="#ec4899" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {/* Sao mẫu */}
          {demoPos && !drawing ? <circle cx={demoPos.x} cy={demoPos.y} r={4} fill="#f59e0b" /> : null}
        </svg>
      </div>
      <button
        onClick={() => setUserPoints([])}
        className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-all"
        title="Xoá để viết lại"
      >
        <Eraser size={24} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exit 0. (Nếu báo `React` không dùng: vì JSX dùng `React.PointerEvent` trong chữ ký nên cứ giữ `import React`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/games/StrokeTracer.tsx
git commit -m "feat: StrokeTracer SVG widget - stroke-by-stroke tracing with demo"
```

---

### Task 7: Wire vào `TracingGame.tsx`, bỏ `TracingCanvas`

**Files:**
- Modify: `src/components/games/TracingGame.tsx` (thay toàn bộ nội dung)

Nội dung mới: giữ nguyên picker + header (đọc giọng nói theo `name`), bỏ toàn bộ
`TracingCanvas` cũ, dùng `<StrokeTracer>`. Props `TracingGameProps` không đổi (App giữ nguyên).

- [ ] **Step 1: Thay toàn bộ `src/components/games/TracingGame.tsx`**

```tsx
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import { LETTER_LIST } from '../../lib/constants.ts';
import StrokeTracer from './StrokeTracer.tsx';

interface TracingGameProps {
  name: string;
  currentLetter: string;
  showPicker: boolean;
  onSelectLetter: (letter: string) => void;
  onRequestPicker: () => void;
  onComplete: () => void;
  onFail: () => void;
}

export default function TracingGame({
  name,
  currentLetter,
  showPicker,
  onSelectLetter,
  onRequestPicker,
  onComplete,
  onFail
}: TracingGameProps) {
  if (showPicker) {
    return (
      <div className="w-full">
        <h3
          className="text-2xl font-bold text-purple-600 mb-6 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
          onClick={() => speakText(`${name} muốn tập viết chữ nào`)}
        >
          <Volume2 size={24} />
          {name} muốn tập viết chữ nào
        </h3>
        <div className="grid grid-cols-5 md:grid-cols-7 gap-3 max-h-[400px] overflow-y-auto p-2">
          {LETTER_LIST.map((l) => (
            <button
              key={l}
              onClick={() => onSelectLetter(l)}
              className="aspect-square flex items-center justify-center text-2xl font-bold bg-purple-50 hover:bg-purple-200 text-purple-700 rounded-xl border-b-4 border-purple-200 active:border-b-0 active:translate-y-1 transition-all"
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3
          className="text-2xl font-bold text-purple-600 cursor-pointer hover:opacity-80 flex items-center gap-2"
          onClick={() => speakText(`${name} tập viết chữ ${currentLetter}`)}
        >
          <Volume2 size={24} />
          {name} tập viết chữ: {currentLetter}
        </h3>
        <button onClick={onRequestPicker} className="text-sm font-bold text-blue-500 hover:underline">
          Đổi chữ khác
        </button>
      </div>
      <StrokeTracer key={currentLetter} letter={currentLetter} onComplete={onComplete} onFail={onFail} />
    </div>
  );
}
```

- [ ] **Step 2: Lint + build**

Run: `npm run lint` → exit 0.
Run: `npm run build` → success (xác nhận `TracingCanvas` đã gỡ không để lại tham chiếu chết).

- [ ] **Step 3: Commit**

```bash
git add src/components/games/TracingGame.tsx
git commit -m "feat: TracingGame uses StrokeTracer, remove pixel-based TracingCanvas"
```

---

### Task 8: Kiểm chứng thủ công toàn luồng

**Files:** không sửa (chạy app).

- [ ] **Step 1: Dev server**

Run: `npm run dev` (background)
Expected: Vite ready tại `http://localhost:3000`.

- [ ] **Step 2: Checklist trong trình duyệt**

Vào app → (nhập tên nếu cần) → Tập Viết:
1. Picker đọc "… muốn tập viết chữ nào"; chọn vài chữ gồm cả dấu (Ă, Đ, Ơ, Ư) và số.
2. Mỗi chữ: nét hiện tại hiện gạch mờ + **sao cam chạy đúng chiều**; nét tương lai rất mờ.
3. Đồ **bám nét** → nét chuyển sang "đã xong", tự sang nét kế; đồ **scribble lệch xa** → tính 1 sai (số "Sai" tăng) + cho làm lại nét đó.
4. Đồ xong **nét cuối** → pháo giấy + cộng điểm + đọc "… giỏi quá!" + về picker.
5. Nút "Xoá để viết lại" (Eraser) xoá mực nét đang vẽ, không tụt nét.
6. Trên thiết bị cảm ứng/giả lập touch: kéo vẽ được, trang không cuộn khi vẽ.
7. Không còn nút "Hoàn thành" cũ; HUD vẫn ẩn đồng hồ ở chế độ Tập Viết.

- [ ] **Step 3: Nếu ngưỡng quá dễ/khó**

Chỉnh `COVER_PASS`/`TRACK_PASS`/`TRACE_RADIUS` trong `src/lib/tracingScore.ts`, chạy lại `npx tsx scripts/tracingScore.test.ts` (đảm bảo test vẫn pass), thử lại trong app. Commit nếu có đổi:

```bash
git add src/lib/tracingScore.ts
git commit -m "tune: tracing pass thresholds from manual testing"
```

- [ ] **Step 4: Dừng dev server.**

---

## Self-Review (đã chạy)

**1. Spec coverage:**
- Bỏ canvas pixel → SVG hình học: Task 6 ✓.
- Dữ liệu Hershey A–Z/0–9 + 7 dấu tiếng Việt, sinh offline, không lib runtime: Task 1–3 ✓.
- Phủ đủ 39 ký tự LETTER_LIST: Task 3 ✓.
- Đồ từng nét có sao mẫu, xong nét 1 mới sang nét 2: Task 6 (state `current`, demo rAF) ✓.
- Độ chặt vừa phải + tính sai khi lệch: Task 5 ngưỡng 0.75/0.70/R=9, Task 6 gọi `onFail` ✓.
- Chấm bằng phủ + bám, không ép chiều: Task 5 `scoreStroke` ✓.
- Component StrokeTracer + TracingGame wire, App không đổi: Task 6–7 ✓.
- Lỗi/biên (chữ thiếu nét, getScreenCTM null, vẽ rỗng, đổi chữ remount, Eraser): Task 6 ✓.
- Kiểm chứng lint/build/manual + test thuần: Task 5, 7, 8 ✓.

**2. Placeholder scan:** Task 1 ("tìm bộ dữ liệu public-domain") là bước thu thập có verify cụ thể (đếm 36 key, in toạ độ) + lối thoát BLOCKED — không phải TODO mơ hồ. Task 4 tinh chỉnh hình học là cổng kiểm tra mắt thường có quy trình lặp rõ ràng, không phải "handle edge cases".

**3. Type consistency:** `Pt` định nghĩa ở `tracingScore.ts` (Task 5), import lại ở StrokeTracer (Task 6). `getStrokes`/`GlyphStrokes` ở `letterStrokes.ts` (Task 2) dùng ở Task 3/6. `scoreStroke(samplePoints, userPoints)` chữ ký Task 5 khớp lời gọi Task 6. Props `TracingGameProps` Task 7 trùng khít interface App đang truyền (name/currentLetter/showPicker/onSelectLetter/onRequestPicker/onComplete/onFail) — App.tsx không cần đổi.
