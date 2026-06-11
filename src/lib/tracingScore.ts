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
export const LENGTH_PASS = 0.6; // độ dài nét bé vẽ phải ≥ 60% độ dài nét mẫu

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

const pathLength = (pts: Pt[]): number => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.sqrt(dist2(pts[i], pts[i - 1]));
  return len;
};

export function scoreStroke(
  samplePoints: Pt[],
  userPoints: Pt[],
  radius: number = TRACE_RADIUS,
  coverPass: number = COVER_PASS,
  trackPass: number = TRACK_PASS,
  lengthPass: number = LENGTH_PASS
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

  // Phải chạm gần CẢ điểm đầu và điểm cuối của nét (không ép chiều — đầu/cuối hoán đổi
  // được). Nếu không, với nét NGẮN, hành lang R "với" tới các điểm mẫu phía trước khiến
  // đồ nửa nét vẫn đạt coverage cao -> đậu oan. Yêu cầu chạm hai đầu chặn kiểu đó lại.
  const first = samplePoints[0];
  const last = samplePoints[samplePoints.length - 1];
  const reachedEnds = minDist2ToSet(first, userPoints) <= r2 && minDist2ToSet(last, userPoints) <= r2;

  // Với nét VÒNG KÍN (O, U, G…) điểm đầu ≈ điểm cuối nên check hai đầu vô hiệu:
  // bé đồ nửa vòng vẫn "chạm hai đầu". Thêm điều kiện độ dài nét bé vẽ phải đủ.
  const sampleLen = pathLength(samplePoints);
  const userLen = pathLength(userPoints);
  const lengthRatio = sampleLen === 0 ? 1 : userLen / sampleLen;

  const coverage = visited / samplePoints.length;
  const onTrack = near / userPoints.length;
  return {
    coverage,
    onTrack,
    pass: coverage >= coverPass && onTrack >= trackPass && reachedEnds && lengthRatio >= lengthPass
  };
}
