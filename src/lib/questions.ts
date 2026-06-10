import type { MathOperator, Question } from '../types.ts';
import { EMOJIS, LETTER_LIST, PATTERN_TYPES } from './constants.ts';

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const generateMath = (range: number, operator: MathOperator): Question => {
  let a, b, ans;
  if (operator === '+') {
    a = Math.floor(Math.random() * (range / 2 + 1));
    b = Math.floor(Math.random() * (range - a + 1));
    ans = a + b;
  } else {
    a = Math.floor(Math.random() * (range - 1)) + 1;
    b = Math.floor(Math.random() * (a + 1));
    ans = a - b;
  }

  const options = new Set<string>();
  options.add(ans.toString());
  // ans = 0: cửa sổ offset [-2,2] chỉ cho ra {0,1,2} — thêm sẵn 1 đáp án nhiễu để vòng lặp luôn kết thúc
  if (ans === 0) options.add('3');
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 5) - 2;
    const fake = Math.max(0, ans + offset);
    options.add(fake.toString());
  }

  return {
    text: `${a} ${operator} ${b} = ?`,
    answer: ans.toString(),
    options: shuffle(Array.from(options))
  };
};

export const generateCounting = (name: string): Question => {
  const num = Math.floor(Math.random() * 10) + 1;
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const visuals = Array(num).fill(emoji);
  const options = new Set<string>();
  options.add(num.toString());
  while (options.size < 4) {
    options.add((Math.floor(Math.random() * 10) + 1).toString());
  }
  return {
    text: `${name} đếm xem có bao nhiêu hình nhé`,
    visual: visuals,
    answer: num.toString(),
    options: shuffle(Array.from(options))
  };
};

export const generatePattern = (name: string): Question => {
  const basePattern = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
  const sequence = [...basePattern];
  const ans = sequence.pop()!;

  const uniqueItems = Array.from(new Set(basePattern));
  const options = [...uniqueItems];

  while (options.length < 4) {
    const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    if (!options.includes(randomEmoji)) {
      options.push(randomEmoji);
    }
  }

  return {
    text: `${name} hãy tìm hình tiếp theo của quy luật nhé!`,
    visual: sequence,
    answer: ans,
    options: shuffle(options)
  };
};

export const generateSequence = (range: number): Question => {
  const num = Math.floor(Math.random() * (range - 1)) + 1; // 1 to range-1
  const isBefore = Math.random() > 0.5;
  const ans = isBefore ? num - 1 : num + 1;

  const options = new Set<string>();
  options.add(ans.toString());
  // ans = 0: cửa sổ offset [-2,2] chỉ cho ra {0,1,2} — thêm sẵn 1 đáp án nhiễu để vòng lặp luôn kết thúc
  if (ans === 0) options.add('3');
  while (options.size < 4) {
    const fake = Math.max(0, ans + (Math.floor(Math.random() * 5) - 2));
    options.add(fake.toString());
  }

  return {
    text: `Số liền ${isBefore ? 'trước' : 'sau'} của số ${num} là số nào`,
    visual: [num.toString()],
    answer: ans.toString(),
    options: shuffle(Array.from(options))
  };
};

export const generateComparison = (range: number, name: string): Question => {
  const a = Math.floor(Math.random() * (range + 1));
  const b = Math.floor(Math.random() * (range + 1));
  let ans = '=';
  if (a < b) ans = '<';
  else if (a > b) ans = '>';

  return {
    text: `${name} hãy so sánh hai số ${a} và ${b} nhé!`,
    visual: [a.toString(), b.toString()],
    answer: ans,
    options: ['<', '=', '>']
  };
};

export const generateMissingNumber = (range: number, name: string): Question => {
  const start = Math.floor(Math.random() * (range - 5)) + 1;
  const step = Math.random() > 0.7 ? 2 : 1; // Sometimes skip by 2
  const sequence = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
  const missingIdx = Math.floor(Math.random() * sequence.length);
  const ans = sequence[missingIdx];

  const visual = sequence.map((n, idx) => idx === missingIdx ? '?' : n.toString());

  const options = new Set<string>();
  options.add(ans.toString());
  while (options.size < 4) {
    const fake = Math.max(0, ans + (Math.floor(Math.random() * 7) - 3));
    options.add(fake.toString());
  }

  return {
    text: `${name} hãy tìm số còn thiếu trong dãy số nhé!`,
    visual: visual,
    answer: ans.toString(),
    options: shuffle(Array.from(options))
  };
};

export const generateLetterRecognition = (name: string): Question => {
  const lettersOnly = LETTER_LIST.filter(l => isNaN(Number(l)));
  const ans = lettersOnly[Math.floor(Math.random() * lettersOnly.length)];

  const options = new Set<string>();
  options.add(ans);
  while (options.size < 4) {
    const fake = lettersOnly[Math.floor(Math.random() * lettersOnly.length)];
    options.add(fake);
  }

  return {
    text: `${name} hãy tìm chữ ${ans} nhé!`,
    answer: ans,
    options: shuffle(Array.from(options))
  };
};
