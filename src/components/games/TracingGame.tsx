import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Eraser, Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import { LETTER_LIST } from '../../lib/constants.ts';

// Tracing Canvas Component with Verification
const TracingCanvas = ({ letter, onComplete, onFail }: { letter: string, onComplete: () => void, onFail: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const drawGuide = useCallback(() => {
    const canvas = guideCanvasRef.current;
    const userCanvas = canvasRef.current;
    if (!canvas || !userCanvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const userCtx = userCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !userCtx) return;

    // Clear both
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height);

    // Draw guide on BOTH (one for display, one for reference)
    [ctx, userCtx].forEach(c => {
      c.font = 'bold 240px "Inter", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';

      // Create dashed outline effect
      c.setLineDash([10, 10]);
      c.strokeStyle = '#d1d5db'; // Light gray for the dash
      c.lineWidth = 2;
      c.strokeText(letter, canvas.width / 2, canvas.height / 2);

      // Very faint fill to help the child see the shape
      c.fillStyle = '#f9fafb';
      c.fillText(letter, canvas.width / 2, canvas.height / 2);

      // Reset dash for user drawing
      c.setLineDash([]);
    });

    // Reset user drawing style
    userCtx.lineJoin = 'round';
    userCtx.lineCap = 'round';
    userCtx.lineWidth = 25;
    userCtx.strokeStyle = '#ec4899';
  }, [letter]);

  useEffect(() => {
    drawGuide();
  }, [drawGuide]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const verifyTracing = () => {
    const userCanvas = canvasRef.current;
    if (!userCanvas) return;
    const ctx = userCanvas.getContext('2d');
    if (!ctx) return;

    // Create a temporary canvas to draw ONLY the guide for comparison
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = userCanvas.width;
    tempCanvas.height = userCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.font = 'bold 240px "Inter", sans-serif';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = 'black';
    tempCtx.fillText(letter, tempCanvas.width / 2, tempCanvas.height / 2);

    // Also draw a stroke on the guide to make the "hit area" a bit wider
    tempCtx.strokeStyle = 'black';
    tempCtx.lineWidth = 20;
    tempCtx.strokeText(letter, tempCanvas.width / 2, tempCanvas.height / 2);

    const guideData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
    const userData = ctx.getImageData(0, 0, userCanvas.width, userCanvas.height).data;

    let guidePixels = 0;
    let coveredPixels = 0;
    let outsidePixels = 0;

    for (let i = 0; i < guideData.length; i += 4) {
      const isGuide = guideData[i + 3] > 0;
      // Check for pinkish pixels (user drawing) - more lenient than exact match
      const r = userData[i];
      const g = userData[i + 1];
      const b = userData[i + 2];
      const a = userData[i + 3];

      // User color is #ec4899 (236, 72, 153)
      const isUser = a > 50 && r > 200 && g < 100 && b > 120;

      if (isGuide) guidePixels++;
      if (isGuide && isUser) coveredPixels++;
      if (!isGuide && isUser) outsidePixels++;
    }

    const coverage = coveredPixels / guidePixels;
    const accuracy = coveredPixels / (coveredPixels + outsidePixels);

    // More lenient thresholds for kids
    if (coverage > 0.4 && accuracy > 0.3) {
      onComplete();
    } else {
      onFail();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative bg-white rounded-3xl shadow-inner border-4 border-dashed border-purple-200 overflow-hidden">
        {/* Guide Canvas (Background) */}
        <canvas
          ref={guideCanvasRef}
          width={400}
          height={400}
          className="absolute inset-0 pointer-events-none"
        />
        {/* User Drawing Canvas (Foreground) */}
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="relative cursor-crosshair touch-none"
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={drawGuide}
          className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-all"
          title="Xóa để viết lại"
        >
          <Eraser size={24} />
        </button>
        <button
          onClick={() => hasDrawn && verifyTracing()}
          disabled={!hasDrawn}
          className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 transition-all"
        >
          <Check size={24} />
          Hoàn thành
        </button>
      </div>
    </div>
  );
};

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
          {LETTER_LIST.map(l => (
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
        <button
          onClick={onRequestPicker}
          className="text-sm font-bold text-blue-500 hover:underline"
        >
          Đổi chữ khác
        </button>
      </div>
      <TracingCanvas letter={currentLetter} onComplete={onComplete} onFail={onFail} />
    </div>
  );
}
