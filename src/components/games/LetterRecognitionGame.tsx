import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface LetterRecognitionGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function LetterRecognitionGame({ question, disabled, onAnswer }: LetterRecognitionGameProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center mb-12">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => speakText(question.text)}
          className="w-48 h-48 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg border-8 border-amber-200 mb-6"
        >
          <div className="flex flex-col items-center">
            <Volume2 size={80} />
            <span className="text-sm font-bold mt-2">Bấm để nghe</span>
          </div>
        </motion.button>
        <h3 className="text-3xl font-bold text-gray-600">Nghe và chọn chữ nhé!</h3>
      </div>

      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="amber" />
    </div>
  );
}
