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
