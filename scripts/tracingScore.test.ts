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

// 6) Đồ tới 70% rồi dừng (chưa chạm điểm cuối) → trượt, dù coverage ~0.79.
//    Ngăn kiểu "đồ nửa nét ngắn vẫn đậu" do hành lang R với quá xa.
const upTo70 = line.slice(0, 71); // x=0..70 trên nét 0..100
const r6 = scoreStroke(line, upTo70);
assert.strictEqual(r6.pass, false, 'trace not reaching the end should fail');

// 7) Chỉ chạm hai đầu mút, bỏ giữa → trượt (phần giữa không được phủ)
const endsOnly: Pt[] = [...line.slice(0, 6), ...line.slice(95)];
const r7 = scoreStroke(line, endsOnly);
assert.strictEqual(r7.pass, false, 'touching only the two ends should fail (middle not covered)');

// Nét VÒNG KÍN (đầu ≈ cuối): vòng tròn r=20 quanh (50,50)
const circle: Pt[] = Array.from({ length: 101 }, (_, i) => {
  const a = (i / 100) * 2 * Math.PI;
  return { x: 50 + 20 * Math.cos(a), y: 50 + 20 * Math.sin(a) };
});

// 8) Đồ trọn vòng → đậu
const fullLoop = scoreStroke(circle, circle);
assert.ok(fullLoop.pass, 'full loop trace should pass');

// 9) Đồ nửa vòng → trượt (độ dài nét chỉ ~50% dù đầu/cuối trùng nhau)
const halfLoop = scoreStroke(circle, circle.slice(0, 55));
assert.strictEqual(halfLoop.pass, false, 'half loop should fail (length gate)');

console.log('tracingScore: all assertions passed');
