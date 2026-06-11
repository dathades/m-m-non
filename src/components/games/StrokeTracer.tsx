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
