import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface MissingNumberGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function MissingNumberGame({ question, disabled, onAnswer }: MissingNumberGameProps) {
  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-8 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>

      <div className="flex flex-wrap justify-center gap-4 mb-12 items-center min-h-[120px]">
        {question.visual?.map((val, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`text-6xl w-24 h-24 flex items-center justify-center rounded-2xl border-4 shadow-sm font-black ${val === '?' ? 'border-dashed border-rose-300 text-rose-300 animate-pulse' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
          >
            {val}
          </motion.div>
        ))}
      </div>

      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="rose" />
    </div>
  );
}
