import { motion } from 'motion/react';
import { Home, PartyPopper, RotateCcw } from 'lucide-react';

interface EndScreenProps {
  name: string;
  score: number;
  totalCount: number;
  wrongCount: number;
  onHome: () => void;
  onReplay: () => void;
}

export default function EndScreen({ name, score, totalCount, wrongCount, onHome, onReplay }: EndScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center p-12 bg-white rounded-3xl shadow-2xl border-4 border-pink-300 w-full max-w-md"
    >
      <PartyPopper size={80} className="mx-auto text-pink-500 mb-6" />
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Hết giờ rồi!</h2>
      <div className="space-y-2 mb-8">
        <div className="text-5xl font-black text-blue-600">{score} Điểm</div>
        <div className="text-lg font-bold text-gray-400">Đã làm: {totalCount} | Sai: {wrongCount}</div>
      </div>
      <p className="text-xl text-gray-600 mb-8">{name} đã làm rất tốt! Muốn chơi lại không</p>

      <div className="flex flex-col gap-4">
        <button
          onClick={onHome}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
        >
          <Home size={24} />
          Trang chủ
        </button>
        <button
          onClick={onReplay}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold shadow-lg transition-all border-b-4 border-pink-700 active:border-b-0 active:translate-y-1"
        >
          <RotateCcw size={24} />
          Chơi lại
        </button>
      </div>
    </motion.div>
  );
}
