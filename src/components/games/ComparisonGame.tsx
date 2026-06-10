import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';

interface ComparisonGameProps {
  question: Question;
  solved: boolean;
  onAnswer: (option: string) => void;
}

export default function ComparisonGame({ question, solved, onAnswer }: ComparisonGameProps) {
  const [draggedSymbol, setDraggedSymbol] = useState<string | null>(null);

  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-8 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>

      <div className="flex items-center justify-center gap-8 mb-12">
        <div className="text-8xl font-black text-blue-600 bg-blue-50 w-32 h-32 flex items-center justify-center rounded-3xl border-4 border-blue-100">
          {question.visual?.[0]}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const symbol = e.dataTransfer.getData('symbol');
            if (!solved && symbol) onAnswer(symbol);
          }}
          className={`w-32 h-32 border-4 border-dashed rounded-3xl flex items-center justify-center text-7xl font-bold transition-all ${solved ? 'bg-green-100 border-green-300 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-300'}`}
        >
          {solved ? question.answer : '?'}
        </div>

        <div className="text-8xl font-black text-pink-600 bg-pink-50 w-32 h-32 flex items-center justify-center rounded-3xl border-4 border-pink-100">
          {question.visual?.[1]}
        </div>
      </div>

      <div className="flex justify-center gap-6">
        {['<', '=', '>'].map((symbol) => (
          <div
            key={symbol}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('symbol', symbol);
              setDraggedSymbol(symbol);
            }}
            onDragEnd={() => setDraggedSymbol(null)}
            onClick={() => !solved && onAnswer(symbol)}
            className={`w-24 h-24 flex items-center justify-center text-5xl font-bold bg-white rounded-2xl border-4 border-purple-200 shadow-lg cursor-grab active:cursor-grabbing hover:bg-purple-50 transition-all ${draggedSymbol === symbol ? 'opacity-50 scale-90' : ''}`}
          >
            {symbol}
          </div>
        ))}
      </div>
      <p className="mt-6 text-gray-400 font-medium italic">Kéo dấu vào ô trống hoặc chạm để chọn nhé!</p>
    </div>
  );
}
