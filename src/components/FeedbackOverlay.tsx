import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Frown } from 'lucide-react';

interface FeedbackOverlayProps {
  feedback: 'correct' | 'wrong' | null;
  correctMessage: string;
  wrongMessage: string;
}

export default function FeedbackOverlay({ feedback, correctMessage, wrongMessage }: FeedbackOverlayProps) {
  return (
    <AnimatePresence>
      {feedback === 'correct' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/90 text-white z-20"
        >
          <CheckCircle2 size={120} className="mb-4" />
          <h2 className="text-4xl font-bold">{correctMessage}</h2>
        </motion.div>
      )}
      {feedback === 'wrong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/90 text-white z-20"
        >
          <Frown size={120} className="mb-4" />
          <h2 className="text-4xl font-bold">{wrongMessage}</h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
