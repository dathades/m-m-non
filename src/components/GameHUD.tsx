import { Hash, LogOut, Timer, Trophy, XCircle } from 'lucide-react';

interface GameHUDProps {
  totalCount: number;
  wrongCount: number;
  score: number;
  timeLeft: number | null;
  onExit: () => void;
}

export default function GameHUD({ totalCount, wrongCount, score, timeLeft, onExit }: GameHUDProps) {
  return (
    <div className="flex justify-between items-center mb-6 bg-white/60 p-4 rounded-2xl backdrop-blur-sm shadow-sm">
      <button
        onClick={onExit}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-full font-bold transition-colors"
      >
        <LogOut size={20} />
        <span>Thoát</span>
      </button>

      <div className="flex gap-3">
        <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-full font-bold shadow-sm text-sm">
          <Hash size={16} />
          <span>Tổng: {totalCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-full font-bold shadow-sm text-sm">
          <XCircle size={16} />
          <span>Sai: {wrongCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-400 text-white px-3 py-2 rounded-full font-bold shadow-sm text-sm">
          <Trophy size={16} />
          <span>{score}</span>
        </div>

        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold shadow-sm transition-colors text-sm ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
            <Timer size={16} />
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
