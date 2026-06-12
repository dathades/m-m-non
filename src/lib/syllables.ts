import type { Question } from '../types.ts';

export type Tone = 'không' | 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng';

export interface WordEntry {
  onset: string;    // âm đầu, vd 'c', 'nh'
  rhyme: string;    // vần KHÔNG dấu, vd 'a', 'eo'
  tone: Tone;       // thanh điệu
  syllable: string; // tiếng cuối ĐÃ có dấu, vd 'cá'
  emoji?: string;   // tranh minh hoạ nếu có
}

export const WORDS: WordEntry[] = [
  // Con vật
  { onset: 'c', rhyme: 'a', tone: 'sắc', syllable: 'cá', emoji: '🐟' },
  { onset: 'g', rhyme: 'a', tone: 'huyền', syllable: 'gà', emoji: '🐔' },
  { onset: 'b', rhyme: 'o', tone: 'huyền', syllable: 'bò', emoji: '🐮' },
  { onset: 'd', rhyme: 'ê', tone: 'không', syllable: 'dê', emoji: '🐐' },
  { onset: 'v', rhyme: 'oi', tone: 'không', syllable: 'voi', emoji: '🐘' },
  { onset: 'g', rhyme: 'âu', tone: 'sắc', syllable: 'gấu', emoji: '🐻' },
  { onset: 'm', rhyme: 'eo', tone: 'huyền', syllable: 'mèo', emoji: '🐱' },
  { onset: 'v', rhyme: 'it', tone: 'nặng', syllable: 'vịt', emoji: '🦆' },
  { onset: 'c', rhyme: 'ua', tone: 'không', syllable: 'cua', emoji: '🦀' },
  { onset: 'h', rhyme: 'ô', tone: 'hỏi', syllable: 'hổ', emoji: '🐯' },
  { onset: 'ch', rhyme: 'o', tone: 'sắc', syllable: 'chó', emoji: '🐶' },
  { onset: 'th', rhyme: 'o', tone: 'hỏi', syllable: 'thỏ', emoji: '🐰' },
  { onset: 'kh', rhyme: 'i', tone: 'hỏi', syllable: 'khỉ', emoji: '🐵' },
  { onset: 'r', rhyme: 'ăn', tone: 'sắc', syllable: 'rắn', emoji: '🐍' },
  { onset: 's', rhyme: 'oc', tone: 'sắc', syllable: 'sóc', emoji: '🐿️' },
  { onset: 'ng', rhyme: 'ưa', tone: 'nặng', syllable: 'ngựa', emoji: '🐴' },
  { onset: 'tr', rhyme: 'âu', tone: 'không', syllable: 'trâu', emoji: '🐃' },
  { onset: 'r', rhyme: 'ua', tone: 'huyền', syllable: 'rùa', emoji: '🐢' },
  { onset: 'b', rhyme: 'ươm', tone: 'sắc', syllable: 'bướm', emoji: '🦋' },
  { onset: 'c', rhyme: 'ao', tone: 'sắc', syllable: 'cáo', emoji: '🦊' },
  { onset: 'n', rhyme: 'ai', tone: 'không', syllable: 'nai', emoji: '🦌' },
  { onset: 'c', rhyme: 'ưu', tone: 'huyền', syllable: 'cừu', emoji: '🐑' },
  { onset: 'h', rhyme: 'eo', tone: 'không', syllable: 'heo', emoji: '🐷' },
  { onset: 't', rhyme: 'ôm', tone: 'không', syllable: 'tôm', emoji: '🦐' },
  { onset: 'm', rhyme: 'ưc', tone: 'nặng', syllable: 'mực', emoji: '🦑' },
  // Trái cây & món ăn
  { onset: 'l', rhyme: 'a', tone: 'sắc', syllable: 'lá', emoji: '🍃' },
  { onset: 'nh', rhyme: 'o', tone: 'không', syllable: 'nho', emoji: '🍇' },
  { onset: 'b', rhyme: 'ơ', tone: 'không', syllable: 'bơ', emoji: '🥑' },
  { onset: 'l', rhyme: 'ac', tone: 'nặng', syllable: 'lạc', emoji: '🥜' },
  { onset: 't', rhyme: 'ao', tone: 'sắc', syllable: 'táo', emoji: '🍎' },
  { onset: 'l', rhyme: 'ê', tone: 'không', syllable: 'lê', emoji: '🍐' },
  { onset: 'ch', rhyme: 'uôi', tone: 'sắc', syllable: 'chuối', emoji: '🍌' },
  { onset: 'c', rhyme: 'am', tone: 'không', syllable: 'cam', emoji: '🍊' },
  { onset: 'd', rhyme: 'ưa', tone: 'không', syllable: 'dưa', emoji: '🍉' },
  { onset: 'd', rhyme: 'âu', tone: 'không', syllable: 'dâu', emoji: '🍓' },
  { onset: 'ng', rhyme: 'ô', tone: 'không', syllable: 'ngô', emoji: '🌽' },
  { onset: 'n', rhyme: 'âm', tone: 'sắc', syllable: 'nấm', emoji: '🍄' },
  { onset: 'b', rhyme: 'anh', tone: 'sắc', syllable: 'bánh', emoji: '🍰' },
  { onset: 'k', rhyme: 'eo', tone: 'nặng', syllable: 'kẹo', emoji: '🍬' },
  { onset: 'k', rhyme: 'em', tone: 'không', syllable: 'kem', emoji: '🍦' },
  { onset: 's', rhyme: 'ưa', tone: 'ngã', syllable: 'sữa', emoji: '🥛' },
  // Đồ vật & thiên nhiên
  { onset: 'm', rhyme: 'u', tone: 'ngã', syllable: 'mũ', emoji: '🎩' },
  { onset: 'c', rhyme: 'ơ', tone: 'huyền', syllable: 'cờ', emoji: '🚩' },
  { onset: 'd', rhyme: 'u', tone: 'huyền', syllable: 'dù', emoji: '☂️' },
  { onset: 'x', rhyme: 'e', tone: 'không', syllable: 'xe', emoji: '🚗' },
  { onset: 'nh', rhyme: 'a', tone: 'huyền', syllable: 'nhà', emoji: '🏠' },
  { onset: 'qu', rhyme: 'a', tone: 'huyền', syllable: 'quà', emoji: '🎁' },
  { onset: 'm', rhyme: 'ây', tone: 'không', syllable: 'mây', emoji: '☁️' },
  { onset: 's', rhyme: 'ao', tone: 'không', syllable: 'sao', emoji: '⭐' },
  { onset: 'b', rhyme: 'e', tone: 'sắc', syllable: 'bé', emoji: '👶' }
];

export const ONSETS: string[] = [
  'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n',
  'p', 'r', 's', 't', 'v', 'x', 'ch', 'gh', 'gi', 'kh',
  'ng', 'nh', 'ph', 'qu', 'th', 'tr'
];

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// Lấy `n` phần tử ngẫu nhiên từ `pool`, loại những phần tử trùng với `exclude`.
const pickDistractors = (pool: string[], exclude: string, n: number): string[] =>
  shuffle(pool.filter((p) => p !== exclude)).slice(0, n);

// Bài "Chữ Đầu Tiên": hiện tranh + đọc tiếng (qua text), bé chọn CHỮ CÁI ĐẦU (âm đầu).
// Trả về Question chuẩn để dùng luôn pipeline trắc nghiệm của App.
// text = tiếng để App ĐỌC (không hiển thị chữ — component tự render tranh + câu hỏi).
export function generateFirstLetter(): Question {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const options = shuffle([word.onset, ...pickDistractors(ONSETS, word.onset, 3)]);
  return {
    text: word.syllable,
    visual: word.emoji ? [word.emoji] : [],
    answer: word.onset,
    options
  };
}
