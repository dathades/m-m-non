import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface CountingGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function CountingGame({ question, disabled, onAnswer }: CountingGameProps) {
  return (
    <div className="w-full">
      <h3
        className="text-2xl font-bold text-gray-500 mb-6 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
        onClick={() => speakText(question.text)}
      >
        <Volume2 size={24} />
        {question.text}
      </h3>
      <div className="mb-10 flex flex-wrap justify-center gap-4 min-h-[120px] items-center">
        <div className="flex flex-wrap justify-center gap-3 max-w-md">
          {question.visual?.map((v, i) => (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={i}
              className="text-5xl drop-shadow-sm"
            >
              {v}
            </motion.span>
          ))}
        </div>
      </div>
      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="purple" />
    </div>
  );
}
