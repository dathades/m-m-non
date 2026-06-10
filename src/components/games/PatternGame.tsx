import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { Question } from '../../types.ts';
import AnswerGrid from '../AnswerGrid.tsx';

interface PatternGameProps {
  question: Question;
  disabled: boolean;
  onAnswer: (option: string) => void;
}

export default function PatternGame({ question, disabled, onAnswer }: PatternGameProps) {
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
        {question.visual?.map((emoji, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="text-6xl bg-purple-50 w-24 h-24 flex items-center justify-center rounded-2xl border-2 border-purple-100 shadow-sm"
          >
            {emoji}
          </motion.div>
        ))}
        <div className="w-24 h-24 border-4 border-dashed border-purple-300 rounded-2xl flex items-center justify-center text-4xl text-purple-300 animate-pulse">
          ?
        </div>
      </div>

      <AnswerGrid options={question.options} onAnswer={onAnswer} disabled={disabled} variant="pattern" />
    </div>
  );
}
