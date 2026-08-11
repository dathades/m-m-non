import { motion } from 'motion/react';
import {
  BookOpen,
  CheckCircle2,
  Divide,
  Ruler,
  Gamepad2,
  GraduationCap,
  Hash,
  Pencil,
  RotateCcw,
  Settings2,
  SpellCheck,
  Trophy,
  Type,
  Volume2
} from 'lucide-react';
import type { ClassLevel, GameMode, GameSettings, MathOperator } from '../types.ts';

interface StartScreenProps {
  name: string;
  settings: GameSettings;
  onSettingsChange: (patch: Partial<GameSettings>) => void;
  onStart: (mode: GameMode) => void;
  onChangeName: () => void;
  onChangeClass: () => void;
  level: ClassLevel;
}

export default function StartScreen({ name, settings, onSettingsChange, onStart, onChangeName, onChangeClass, level }: StartScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 p-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-yellow-300 w-full max-w-4xl"
    >
      <h1 className="text-5xl font-bold text-pink-500 mb-2 drop-shadow-sm">{name} Vui Học Tập! 🌟</h1>
      <p className="text-lg text-blue-600 font-medium italic mb-2">"Học mà chơi, chơi mà học"</p>
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={onChangeName}
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors"
        >
          <Pencil size={14} />
          Đổi tên
        </button>
        <button
          onClick={onChangeClass}
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors"
        >
          <GraduationCap size={14} />
          Đổi lớp
        </button>
      </div>

      {level === 'lop_4' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => onStart('fractions')}
            className="group flex flex-col items-center p-6 bg-violet-100 hover:bg-violet-200 rounded-2xl transition-all border-b-8 border-violet-300 active:border-b-0 active:translate-y-2"
          >
            <div className="bg-violet-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
              <Divide size={48} />
            </div>
            <span className="text-2xl font-bold text-violet-700">Phân Số</span>
            <span className="text-sm text-violet-600 mt-2">Toán lớp 4</span>
          </button>
          <button
            onClick={() => onStart('measurement')}
            className="group flex flex-col items-center p-6 bg-teal-100 hover:bg-teal-200 rounded-2xl transition-all border-b-8 border-teal-300 active:border-b-0 active:translate-y-2"
          >
            <div className="bg-teal-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
              <Ruler size={48} />
            </div>
            <span className="text-2xl font-bold text-teal-700">Đo Lường</span>
            <span className="text-sm text-teal-600 mt-2">Toán lớp 4</span>
          </button>
        </div>
      )}
      {level !== 'lop_4' && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Math Card with Settings */}
        <div className="flex flex-col bg-orange-50 rounded-2xl border-4 border-orange-200 p-4 shadow-sm">
          <button
            onClick={() => onStart('math')}
            className="group flex flex-col items-center p-4 bg-orange-100 hover:bg-orange-200 rounded-xl transition-all border-b-4 border-orange-300 active:border-b-0 active:translate-y-1"
          >
            <div className="bg-orange-400 p-3 rounded-full text-white mb-3 group-hover:rotate-12 transition-transform">
              <Gamepad2 size={32} />
            </div>
            <span className="text-xl font-bold text-orange-700">Làm Toán</span>
          </button>

          <div className="mt-4 p-3 bg-white rounded-xl border border-orange-100 text-left">
            <div className="flex items-center gap-2 text-orange-600 font-bold mb-2 text-sm">
              <Settings2 size={16} /> Cài đặt
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Phạm vi:</label>
                <div className="flex gap-2">
                  {[10, 20, 50].map(r => (
                    <button
                      key={r}
                      onClick={() => onSettingsChange({ mathRange: r })}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${settings.mathRange === r ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Phép tính:</label>
                <div className="flex gap-2">
                  {(['+', '-'] as MathOperator[]).map(op => (
                    <button
                      key={op}
                      onClick={() => onSettingsChange({ mathOperator: op })}
                      className={`flex-1 py-1 text-lg font-bold rounded-lg transition-colors ${settings.mathOperator === op ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'}`}
                    >
                      {op === '+' ? 'Cộng' : 'Trừ'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onStart('numbers')}
          className="group flex flex-col items-center p-6 bg-blue-100 hover:bg-blue-200 rounded-2xl transition-all border-b-8 border-blue-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-blue-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <Trophy size={48} />
          </div>
          <span className="text-2xl font-bold text-blue-700">Tập Đếm</span>
          <span className="text-sm text-blue-600 mt-2">Đếm hình vui</span>
        </button>

        <button
          onClick={() => onStart('letters')}
          className="group flex flex-col items-center p-6 bg-green-100 hover:bg-green-200 rounded-2xl transition-all border-b-8 border-green-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-green-400 p-4 rounded-full text-white mb-4 group-hover:-rotate-12 transition-transform">
            <BookOpen size={48} />
          </div>
          <span className="text-2xl font-bold text-green-700">Tập Viết</span>
          <span className="text-sm text-green-600 mt-2">Vẽ theo nét chữ</span>
        </button>

        <button
          onClick={() => onStart('pattern')}
          className="group flex flex-col items-center p-6 bg-purple-100 hover:bg-purple-200 rounded-2xl transition-all border-b-8 border-purple-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-purple-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <RotateCcw size={48} />
          </div>
          <span className="text-2xl font-bold text-purple-700">Quy Luật</span>
          <span className="text-sm text-purple-600 mt-2">Tìm hình tiếp theo</span>
        </button>

        {/* Sequence Card with Settings */}
        <div className="flex flex-col bg-cyan-50 rounded-2xl border-4 border-cyan-200 p-4 shadow-sm">
          <button
            onClick={() => onStart('sequence')}
            className="group flex flex-col items-center p-4 bg-cyan-100 hover:bg-cyan-200 rounded-xl transition-all border-b-4 border-cyan-300 active:border-b-0 active:translate-y-1"
          >
            <div className="bg-cyan-400 p-3 rounded-full text-white mb-3 group-hover:rotate-12 transition-transform">
              <RotateCcw size={32} />
            </div>
            <span className="text-xl font-bold text-cyan-700">Liền Trước/Sau</span>
          </button>

          <div className="mt-4 p-3 bg-white rounded-xl border border-cyan-100 text-left">
            <div className="flex items-center gap-2 text-cyan-600 font-bold mb-2 text-sm">
              <Settings2 size={16} /> Cài đặt
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Phạm vi:</label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map(r => (
                  <button
                    key={r}
                    onClick={() => onSettingsChange({ sequenceRange: r })}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${settings.sequenceRange === r ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Card with Settings */}
        <div className="flex flex-col bg-indigo-50 rounded-2xl border-4 border-indigo-200 p-4 shadow-sm">
          <button
            onClick={() => onStart('comparison')}
            className="group flex flex-col items-center p-4 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-all border-b-4 border-indigo-300 active:border-b-0 active:translate-y-1"
          >
            <div className="bg-indigo-400 p-3 rounded-full text-white mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={32} />
            </div>
            <span className="text-xl font-bold text-indigo-700">So Sánh Số</span>
          </button>

          <div className="mt-4 p-3 bg-white rounded-xl border border-indigo-100 text-left">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2 text-sm">
              <Settings2 size={16} /> Cài đặt
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Phạm vi:</label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map(r => (
                  <button
                    key={r}
                    onClick={() => onSettingsChange({ comparisonRange: r })}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${settings.comparisonRange === r ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Missing Number Card with Settings */}
        <div className="flex flex-col bg-rose-50 rounded-2xl border-4 border-rose-200 p-4 shadow-sm">
          <button
            onClick={() => onStart('missing_number')}
            className="group flex flex-col items-center p-4 bg-rose-100 hover:bg-rose-200 rounded-xl transition-all border-b-4 border-rose-300 active:border-b-0 active:translate-y-1"
          >
            <div className="bg-rose-400 p-3 rounded-full text-white mb-3 group-hover:rotate-12 transition-transform">
              <Hash size={32} />
            </div>
            <span className="text-xl font-bold text-rose-700">Điền Số Còn Thiếu</span>
          </button>

          <div className="mt-4 p-3 bg-white rounded-xl border border-rose-100 text-left">
            <div className="flex items-center gap-2 text-rose-600 font-bold mb-2 text-sm">
              <Settings2 size={16} /> Cài đặt
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Phạm vi:</label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map(r => (
                  <button
                    key={r}
                    onClick={() => onSettingsChange({ missingNumberRange: r })}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${settings.missingNumberRange === r ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onStart('letter_recognition')}
          className="group flex flex-col items-center p-6 bg-amber-100 hover:bg-amber-200 rounded-2xl transition-all border-b-8 border-amber-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-amber-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <Volume2 size={48} />
          </div>
          <span className="text-2xl font-bold text-amber-700">Nhận Biết Chữ</span>
          <span className="text-sm text-amber-600 mt-2">Nghe và chọn chữ</span>
        </button>

        <button
          onClick={() => onStart('spelling')}
          className="group flex flex-col items-center p-6 bg-fuchsia-100 hover:bg-fuchsia-200 rounded-2xl transition-all border-b-8 border-fuchsia-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-fuchsia-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <SpellCheck size={48} />
          </div>
          <span className="text-2xl font-bold text-fuchsia-700">Đánh Vần</span>
          <span className="text-sm text-fuchsia-600 mt-2">Ghép âm thành tiếng</span>
        </button>

        <button
          onClick={() => onStart('first_letter')}
          className="group flex flex-col items-center p-6 bg-teal-100 hover:bg-teal-200 rounded-2xl transition-all border-b-8 border-teal-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-teal-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <Type size={48} />
          </div>
          <span className="text-2xl font-bold text-teal-700">Chữ Đầu Tiên</span>
          <span className="text-sm text-teal-600 mt-2">Chọn chữ cái đầu của tiếng</span>
        </button>
      </div>
      )}
    </motion.div>
  );
}
