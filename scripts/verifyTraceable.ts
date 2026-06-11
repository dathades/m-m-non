// Throwaway verification: với CẢ 39 chữ trong LETTER_LIST, mô phỏng "đồ chuẩn"
// từng nét (lấy mẫu hình học như StrokeTracer) rồi chấm bằng scoreStroke.
// Mục tiêu: chứng minh "đồ đúng -> ĐẬU" cho mọi chữ, và "đồ bậy/đồ nửa -> TRƯỢT".
import { LETTER_STROKES } from '../src/lib/letterStrokes.ts';
import { scoreStroke, type Pt } from '../src/lib/tracingScore.ts';

const LETTER_LIST = ['0','1','2','3','4','5','6','7','8','9','A','Ă','Â','B','C','D','Đ','E','Ê','G','H','I','K','L','M','N','O','Ô','Ơ','P','Q','R','S','T','U','Ư','V','X','Y'];

// Phân giải path 'd' (chỉ dùng M, L, Q — đúng những lệnh letterStrokes sinh ra) thành polyline dày.
function pathToPolyline(d: string): Pt[] {
  const toks = d.match(/[MLQ]|-?\d*\.?\d+/g) || [];
  let i = 0;
  let cur: Pt = { x: 0, y: 0 };
  const pts: Pt[] = [];
  const SUB = 24;
  const pushLine = (a: Pt, b: Pt) => {
    for (let k = 1; k <= SUB; k++) pts.push({ x: a.x + (b.x - a.x) * (k / SUB), y: a.y + (b.y - a.y) * (k / SUB) });
  };
  const pushQuad = (a: Pt, c: Pt, b: Pt) => {
    for (let k = 1; k <= SUB; k++) {
      const t = k / SUB, mt = 1 - t;
      pts.push({
        x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
        y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y
      });
    }
  };
  while (i < toks.length) {
    const cmd = toks[i++];
    if (cmd === 'M') { cur = { x: +toks[i++], y: +toks[i++] }; pts.push(cur); }
    else if (cmd === 'L') { const b = { x: +toks[i++], y: +toks[i++] }; pushLine(cur, b); cur = b; }
    else if (cmd === 'Q') { const c = { x: +toks[i++], y: +toks[i++] }; const b = { x: +toks[i++], y: +toks[i++] }; pushQuad(cur, c, b); cur = b; }
  }
  return pts;
}

// Lấy mẫu đều theo độ dài cung -> 101 điểm (mô phỏng getPointAtLength của StrokeTracer)
function arcSample(poly: Pt[], n = 101): Pt[] {
  if (poly.length < 2) return poly.slice();
  const cum = [0];
  for (let k = 1; k < poly.length; k++) {
    const dx = poly[k].x - poly[k - 1].x, dy = poly[k].y - poly[k - 1].y;
    cum.push(cum[k - 1] + Math.hypot(dx, dy));
  }
  const total = cum[cum.length - 1];
  if (total === 0) return [poly[0]];
  const out: Pt[] = [];
  let seg = 1;
  for (let s = 0; s <= n; s++) {
    const target = (s / n) * total;
    while (seg < poly.length - 1 && cum[seg] < target) seg++;
    const a = poly[seg - 1], b = poly[seg];
    const segLen = cum[seg] - cum[seg - 1] || 1;
    const f = (target - cum[seg - 1]) / segLen;
    out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
  }
  return out;
}

// Nhiễu xác định (≤ ~4 đơn vị < R=9) -> "đồ chuẩn nhưng tay trẻ con hơi run"
const noisy = (pts: Pt[]): Pt[] => pts.map((p, i) => ({ x: p.x + 4 * Math.sin(i * 1.3), y: p.y + 4 * Math.cos(i * 0.7) }));
const shifted = (pts: Pt[]): Pt[] => pts.map((p) => ({ x: p.x + 25, y: p.y }));
const half = (pts: Pt[]): Pt[] => pts.slice(0, Math.floor(pts.length * 0.55));

let failGood = 0, failBadOff = 0, failBadHalf = 0, total = 0;
const problems: string[] = [];

for (const ch of LETTER_LIST) {
  const strokes = LETTER_STROKES[ch];
  if (!strokes || strokes.length === 0) { problems.push(`${ch}: KHÔNG có nét`); continue; }
  strokes.forEach((d, si) => {
    total++;
    const samples = arcSample(pathToPolyline(d));
    // 1) đồ chuẩn (có nhiễu nhẹ) -> phải ĐẬU
    if (!scoreStroke(samples, noisy(samples)).pass) {
      failGood++;
      const r = scoreStroke(samples, noisy(samples));
      problems.push(`${ch} nét ${si}: ĐỒ ĐÚNG MÀ TRƯỢT (cover=${r.coverage.toFixed(2)} track=${r.onTrack.toFixed(2)}, ${d})`);
    }
    // 2) đồ lệch xa -> phải TRƯỢT
    if (scoreStroke(samples, shifted(samples)).pass) { failBadOff++; problems.push(`${ch} nét ${si}: đồ LỆCH mà vẫn đậu`); }
    // 3) đồ nửa nét -> phải TRƯỢT
    if (scoreStroke(samples, half(samples)).pass) { failBadHalf++; problems.push(`${ch} nét ${si}: đồ NỬA mà vẫn đậu`); }
  });
}

console.log(`Tổng số nét kiểm: ${total} (qua ${LETTER_LIST.length} chữ)`);
console.log(`Đồ-đúng-mà-trượt: ${failGood}  | đồ-lệch-vẫn-đậu: ${failBadOff} | đồ-nửa-vẫn-đậu: ${failBadHalf}`);
if (problems.length) { console.log('--- VẤN ĐỀ ---'); for (const p of problems) console.log(' -', p); process.exit(1); }
console.log('OK: mọi chữ đồ chuẩn đều ĐẬU, đồ lệch/đồ nửa đều TRƯỢT.');
