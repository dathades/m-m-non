import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface FirstLetterGameProps {
  question: Question; // text = tiếng để ĐỌC (không hiển thị), visual[0] = emoji, answer = âm đầu
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function FirstLetterGame({ question, disabled, onAnswer }: FirstLetterGameProps) {
  const emoji = question.visual?.[0];

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-6">
        {emoji ? <div className="text-8xl mb-3">{emoji}</div> : null}
        <button
          onClick={() => speakText(question.text)}
          className="flex items-center gap-2 px-5 py-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-full font-bold transition-colors"
        >
          <Volume2 size={20} />
          Nghe lại
        </button>
      </div>

      <h3 className="text-2xl font-bold text-gray-500 mb-6">Tiếng này bắt đầu bằng chữ nào?</h3>

      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="pattern" />
    </div>
  );
}
