import { useState } from 'react';
import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';

interface NameEntryScreenProps {
  initialName: string;
  onSubmit: (name: string) => void;
}

export default function NameEntryScreen({ initialName, onSubmit }: NameEntryScreenProps) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  const submit = () => {
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6 p-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-yellow-300 w-full max-w-md"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-7xl"
      >
        🐘
      </motion.div>
      <h1 className="text-4xl font-bold text-pink-500 drop-shadow-sm">Chào mừng bé! 🌟</h1>
      <p className="text-lg text-blue-600 font-medium">Tên của bé là gì nào?</p>
      <input
        value={name}
        maxLength={20}
        autoFocus
        onChange={(e) => setName(e.target.value.replace(/[-+=<>?]/g, ''))}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit(); }}
        placeholder="Nhập tên bé..."
        className="w-full text-center text-3xl font-bold text-purple-700 bg-purple-50 border-4 border-purple-200 rounded-2xl px-6 py-4 outline-none focus:border-purple-400 placeholder:text-purple-300 placeholder:text-2xl"
      />
      <button
        onClick={submit}
        disabled={!trimmed}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xl shadow-lg transition-all border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Rocket size={24} />
        Bắt đầu học!
      </button>
    </motion.div>
  );
}
