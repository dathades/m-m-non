/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Timer, 
  RotateCcw, 
  CheckCircle2, 
  Frown, 
  PartyPopper,
  Gamepad2,
  BookOpen,
  Home,
  LogOut,
  Settings2,
  Eraser,
  Check,
  Hash,
  XCircle,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Types
type GameMode = 'math' | 'numbers' | 'letters' | 'pattern' | 'sequence' | 'comparison' | 'missing_number' | 'letter_recognition';
type MathOperator = '+' | '-';

interface Question {
  text: string;
  visual?: string[]; 
  image?: string;    
  grid?: string[];   // For find_diff mode
  answer: string;
  options: string[];
}

const EMOJIS = [
  '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕',
  '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔',
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴', '🛹', '🚏', '🛤️', '⚓', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🚁', '🚠', '🚟', '🛰️', '🚀', '🛸'
];
const PATTERN_TYPES = [
  // ABAB Patterns
  ['🍎', '🍏', '🍎', '🍏'],
  ['🐱', '🐶', '🐱', '🐶'],
  ['🚗', '🚲', '🚗', '🚲'],
  ['🍦', '🧁', '🍦', '🧁'],
  ['🎈', '🎊', '🎈', '🎊'],
  ['🦁', '🐯', '🦁', '🐯'],
  ['🐼', '🐨', '🐼', '🐨'],
  ['⚽', '🏀', '⚽', '🏀'],
  ['🍔', '🍕', '🍔', '🍕'],
  ['🍩', '🍪', '🍩', '🍪'],
  ['🍉', '🍍', '🍉', '🍍'],
  ['🐘', '🦒', '🐘', '🦒'],
  ['✈️', '🚁', '✈️', '🚁'],
  ['🍓', '🍒', '🍓', '🍒'],
  ['🐢', '🐍', '🐢', '🐍'],
  ['🚜', '🚒', '🚜', '🚒'],
  ['🍌', '🍇', '🍌', '🍇'],
  ['🦓', '🐆', '🦓', '🐆'],
  ['🚢', '⛵', '🚢', '⛵'],
  ['🥭', '🥥', '🥭', '🥥'],

  // AABAAB Patterns
  ['🍎', '🍎', '🍏', '🍎', '🍎', '🍏'],
  ['🐱', '🐱', '🐶', '🐱', '🐱', '🐶'],
  ['🚗', '🚗', '🚲', '🚗', '🚗', '🚲'],
  ['🦁', '🦁', '🐯', '🦁', '🦁', '🐯'],
  ['🍉', '🍉', '🍍', '🍉', '🍉', '🍍'],
  ['🐘', '🐘', '🦒', '🐘', '🐘', '🦒'],
  ['✈️', '✈️', '🚁', '✈️', '✈️', '🚁'],
  ['🍓', '🍓', '🍒', '🍓', '🍓', '🍒'],
  ['🐢', '🐢', '🐍', '🐢', '🐢', '🐍'],
  ['🚜', '🚜', '🚒', '🚜', '🚜', '🚒'],

  // ABCABC Patterns
  ['🍎', '🍏', '🍐', '🍎', '🍏', '🍐'],
  ['🐱', '🐶', '🐭', '🐱', '🐶', '🐭'],
  ['🚗', '🚲', '🛵', '🚗', '🚲', '🛵'],
  ['🍦', '🧁', '🍩', '🍦', '🧁', '🍩'],
  ['🦁', '🐯', '🦊', '🦁', '🐯', '🦊'],
  ['🍉', '🍍', '🍌', '🍉', '🍍', '🍌'],
  ['🐘', '🦒', '🦓', '🐘', '🦒', '🦓'],
  ['✈️', '🚁', '🚀', '✈️', '🚁', '🚀'],
  ['🍓', '🍒', '🍇', '🍓', '🍒', '🍇'],
  ['🐢', '🐍', '🦎', '🐢', '🐍', '🦎'],
  ['🚜', '🚒', '🚑', '🚜', '🚒', '🚑'],

  // ABBABB Patterns
  ['🍎', '🍏', '🍏', '🍎', '🍏', '🍏'],
  ['🐱', '🐶', '🐶', '🐱', '🐶', '🐶'],
  ['🚗', '🚲', '🚲', '🚗', '🚲', '🚲'],
  ['🍉', '🍍', '🍍', '🍉', '🍍', '🍍'],
  ['🐘', '🦒', '🦒', '🐘', '🦒', '🦒'],
  ['✈️', '🚁', '🚁', '✈️', '🚁', '🚁'],
  ['🍓', '🍒', '🍒', '🍓', '🍒', '🍒'],
  ['🐢', '🐍', '🐍', '🐢', '🐍', '🐍'],
  ['🚜', '🚒', '🚒', '🚜', '🚒', '🚒'],
  ['🦁', '🐯', '🐯', '🦁', '🐯', '🐯'],

  // Complex Patterns
  ['🐶', '🐱', '🐭', '🐹', '🐶', '🐱', '🐭', '🐹'],
  ['🚗', '🚕', '🚙', '🚌', '🚗', '🚕', '🚙', '🚌'],
  ['🍎', '🍊', '🍋', '🍌', '🍎', '🍊', '🍋', '🍌'],
  ['🦁', '🐯', '🦒', '🐘', '🦁', '🐯', '🦒', '🐘'],
  ['✈️', '🚢', '🚂', '🚁', '✈️', '🚢', '🚂', '🚁'],
];
const LETTER_LIST = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y'
];

// Sound Effects
const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3'
};

const playSound = (type: 'correct' | 'wrong') => {
  const audio = new Audio(SOUNDS[type]);
  audio.play().catch(() => {
    // Ignore errors if browser blocks autoplay
  });
};

const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  
  // Stop any current speech
  window.speechSynthesis.cancel();
  
  // Prepare text for better speech (especially for math)
  let spokenText = text;
  spokenText = spokenText.replace(/\+/g, ' cộng ');
  spokenText = spokenText.replace(/-/g, ' trừ ');
  spokenText = spokenText.replace(/=/g, ' bằng ');
  spokenText = spokenText.replace(/\?/g, ' mấy ');
  spokenText = spokenText.replace(/>/g, ' lớn hơn ');
  spokenText = spokenText.replace(/</g, ' bé hơn ');

  // Small delay to ensure cancel has finished
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.toLowerCase().includes('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, 100);
};

// Initial voice load for some browsers
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}

// Tracing Canvas Component with Verification
const TracingCanvas = ({ letter, onComplete, onFail }: { letter: string, onComplete: () => void, onFail: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const drawGuide = useCallback(() => {
    const canvas = guideCanvasRef.current;
    const userCanvas = canvasRef.current;
    if (!canvas || !userCanvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const userCtx = userCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !userCtx) return;

    // Clear both
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height);

    // Draw guide on BOTH (one for display, one for reference)
    [ctx, userCtx].forEach(c => {
      c.font = 'bold 320px "Inter", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      
      // Create dashed outline effect
      c.setLineDash([10, 10]);
      c.strokeStyle = '#d1d5db'; // Light gray for the dash
      c.lineWidth = 2;
      c.strokeText(letter, canvas.width / 2, canvas.height / 2);
      
      // Very faint fill to help Voi see the shape
      c.fillStyle = '#f9fafb';
      c.fillText(letter, canvas.width / 2, canvas.height / 2);
      
      // Reset dash for user drawing
      c.setLineDash([]);
    });

    // Reset user drawing style
    userCtx.lineJoin = 'round';
    userCtx.lineCap = 'round';
    userCtx.lineWidth = 25;
    userCtx.strokeStyle = '#ec4899';
  }, [letter]);

  useEffect(() => {
    drawGuide();
  }, [drawGuide]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const verifyTracing = () => {
    const userCanvas = canvasRef.current;
    if (!userCanvas) return;
    const ctx = userCanvas.getContext('2d');
    if (!ctx) return;

    // Create a temporary canvas to draw ONLY the guide for comparison
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = userCanvas.width;
    tempCanvas.height = userCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.font = 'bold 320px "Inter", sans-serif';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = 'black';
    tempCtx.fillText(letter, tempCanvas.width / 2, tempCanvas.height / 2);

    const guideData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
    const userData = ctx.getImageData(0, 0, userCanvas.width, userCanvas.height).data;

    let guidePixels = 0;
    let coveredPixels = 0;
    let outsidePixels = 0;

    for (let i = 0; i < guideData.length; i += 4) {
      const isGuide = guideData[i + 3] > 0;
      const isUser = userData[i] === 236 && userData[i + 1] === 72 && userData[i + 2] === 153; // #ec4899

      if (isGuide) guidePixels++;
      if (isGuide && isUser) coveredPixels++;
      if (!isGuide && isUser) outsidePixels++;
    }

    const coverage = coveredPixels / guidePixels;
    const accuracy = coveredPixels / (coveredPixels + outsidePixels);

    // If Voi covered 50% of the letter and didn't draw too much outside
    if (coverage > 0.5 && accuracy > 0.6) {
      onComplete();
    } else {
      onFail();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative bg-white rounded-3xl shadow-inner border-4 border-dashed border-purple-200 overflow-hidden">
        {/* Guide Canvas (Background) */}
        <canvas
          ref={guideCanvasRef}
          width={400}
          height={400}
          className="absolute inset-0 pointer-events-none"
        />
        {/* User Drawing Canvas (Foreground) */}
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="relative cursor-crosshair touch-none"
        />
      </div>
      <div className="flex gap-4">
        <button 
          onClick={drawGuide}
          className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-all"
          title="Xóa để viết lại"
        >
          <Eraser size={24} />
        </button>
        <button 
          onClick={() => hasDrawn && verifyTracing()}
          disabled={!hasDrawn}
          className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 transition-all"
        >
          <Check size={24} />
          Hoàn thành
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [mode, setMode] = useState<GameMode>('math');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [currentLetter, setCurrentLetter] = useState('A');
  const [showLetterPicker, setShowLetterPicker] = useState(false);

  // Math Settings
  const [mathRange, setMathRange] = useState(10);
  const [mathOperator, setMathOperator] = useState<MathOperator>('+');

  // Sequence Settings
  const [sequenceRange, setSequenceRange] = useState(20);

  // Comparison Settings
  const [comparisonRange, setComparisonRange] = useState(20);
  const [draggedSymbol, setDraggedSymbol] = useState<string | null>(null);

  // Missing Number Settings
  const [missingNumberRange, setMissingNumberRange] = useState(20);

  const resetToHome = () => {
    setGameState('start');
    setQuestion(null);
    setScore(0);
    setWrongCount(0);
    setTotalCount(0);
    setFeedback(null);
    setTimeLeft(30);
    setShowLetterPicker(false);
  };

  const generateMath = useCallback((): Question => {
    let a, b, ans;
    if (mathOperator === '+') {
      a = Math.floor(Math.random() * (mathRange / 2 + 1));
      b = Math.floor(Math.random() * (mathRange - a + 1));
      ans = a + b;
    } else {
      a = Math.floor(Math.random() * (mathRange - 1)) + 1;
      b = Math.floor(Math.random() * (a + 1));
      ans = a - b;
    }

    const options = new Set<string>();
    options.add(ans.toString());
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 5) - 2;
      const fake = Math.max(0, ans + offset);
      options.add(fake.toString());
    }

    return {
      text: `${a} ${mathOperator} ${b} = ?`,
      answer: ans.toString(),
      options: Array.from(options).sort(() => Math.random() - 0.5)
    };
  }, [mathRange, mathOperator]);

  const generateNumbers = (): Question => {
    const num = Math.floor(Math.random() * 10) + 1;
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const visuals = Array(num).fill(emoji);
    const options = new Set<string>();
    options.add(num.toString());
    while (options.size < 4) {
      options.add((Math.floor(Math.random() * 10) + 1).toString());
    }
    return {
      text: `Voi đếm xem có bao nhiêu hình nhé?`,
      visual: visuals,
      answer: num.toString(),
      options: Array.from(options).sort(() => Math.random() - 0.5)
    };
  };

  const generatePattern = (): Question => {
    const basePattern = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
    const sequence = [...basePattern];
    const ans = sequence.pop()!;
    
    // Get unique items from the pattern for options
    const uniqueItems = Array.from(new Set(basePattern));
    const options = [...uniqueItems];
    
    // Add some random emojis if we don't have enough options
    while (options.length < 4) {
      const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      if (!options.includes(randomEmoji)) {
        options.push(randomEmoji);
      }
    }

    return {
      text: "Voi hãy tìm hình tiếp theo của quy luật nhé!",
      visual: sequence,
      answer: ans,
      options: options.sort(() => Math.random() - 0.5)
    };
  };

  const generateSequence = useCallback((): Question => {
    const num = Math.floor(Math.random() * (sequenceRange - 1)) + 1; // 1 to range-1
    const isBefore = Math.random() > 0.5;
    const ans = isBefore ? num - 1 : num + 1;
    
    const options = new Set<string>();
    options.add(ans.toString());
    while (options.size < 4) {
      const fake = Math.max(0, ans + (Math.floor(Math.random() * 5) - 2));
      options.add(fake.toString());
    }

    return {
      text: `Số liền ${isBefore ? 'trước' : 'sau'} của số ${num} là số nào?`,
      answer: ans.toString(),
      options: Array.from(options).sort(() => Math.random() - 0.5)
    };
  }, [sequenceRange]);

  const generateComparison = useCallback((): Question => {
    const a = Math.floor(Math.random() * (comparisonRange + 1));
    const b = Math.floor(Math.random() * (comparisonRange + 1));
    let ans = '=';
    if (a < b) ans = '<';
    else if (a > b) ans = '>';

    return {
      text: `Voi hãy so sánh hai số ${a} và ${b} nhé!`,
      visual: [a.toString(), b.toString()],
      answer: ans,
      options: ['<', '=', '>']
    };
  }, [comparisonRange]);

  const generateMissingNumber = useCallback((): Question => {
    const start = Math.floor(Math.random() * (missingNumberRange - 5)) + 1;
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
      text: "Voi hãy tìm số còn thiếu trong dãy số nhé!",
      visual: visual,
      answer: ans.toString(),
      options: Array.from(options).sort(() => Math.random() - 0.5)
    };
  }, [missingNumberRange]);

  const generateLetterRecognition = useCallback((): Question => {
    const lettersOnly = LETTER_LIST.filter(l => isNaN(Number(l)));
    const ans = lettersOnly[Math.floor(Math.random() * lettersOnly.length)];
    
    const options = new Set<string>();
    options.add(ans);
    while (options.size < 4) {
      const fake = lettersOnly[Math.floor(Math.random() * lettersOnly.length)];
      options.add(fake);
    }

    return {
      text: `Voi hãy tìm chữ ${ans} nhé!`,
      answer: ans,
      options: Array.from(options).sort(() => Math.random() - 0.5)
    };
  }, []);

  const generateQuestionForMode = useCallback((selectedMode: GameMode): Question | null => {
    if (selectedMode === 'math') return generateMath();
    if (selectedMode === 'numbers') return generateNumbers();
    if (selectedMode === 'pattern') return generatePattern();
    if (selectedMode === 'sequence') return generateSequence();
    if (selectedMode === 'comparison') return generateComparison();
    if (selectedMode === 'missing_number') return generateMissingNumber();
    if (selectedMode === 'letter_recognition') return generateLetterRecognition();
    return null;
  }, [generateMath, generateNumbers, generatePattern, generateSequence, generateComparison, generateMissingNumber, generateLetterRecognition]);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setTimeLeft(30);
    const newQuestion = generateQuestionForMode(mode);
    
    if (newQuestion) {
      setQuestion(newQuestion);
      speakText(newQuestion.text);
    }
    // In letters mode, we don't auto-next, Voi picks or we stay
  }, [mode, generateQuestionForMode]);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setScore(0);
    setWrongCount(0);
    setTotalCount(0);
    setGameState('playing');
    setFeedback(null);
    setTimeLeft(30);
    setQuestion(null);
    
    if (selectedMode === 'letters') {
      setCurrentLetter('A');
      setShowLetterPicker(true);
      speakText("Voi muốn tập viết chữ nào?");
    } else {
      const firstQuestion = generateQuestionForMode(selectedMode);
      if (firstQuestion) {
        setQuestion(firstQuestion);
        speakText(firstQuestion.text);
      }
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && !question && mode !== 'letters') {
      // This is a fallback, but startGame should handle the first one
      nextQuestion();
    }
  }, [gameState, question, mode, nextQuestion]);

  useEffect(() => {
    let timer: number;
    if (gameState === 'playing' && timeLeft > 0 && !feedback && mode !== 'letters') {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing' && mode !== 'letters') {
      setGameState('end');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, feedback, mode]);

  const handleAnswer = (selected: string) => {
    if (feedback === 'correct') return;
    
    setTotalCount(prev => prev + 1);
    if (selected === question?.answer) {
      setFeedback('correct');
      setScore(prev => prev + 1);
      playSound('correct');
      speakText("Đúng rồi!");
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(nextQuestion, 2000);
    } else {
      setFeedback('wrong');
      setWrongCount(prev => prev + 1);
      playSound('wrong');
      speakText("Chưa đúng rồi!");
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handleTracingComplete = () => {
    setTotalCount(prev => prev + 1);
    setScore(prev => prev + 1);
    setFeedback('correct');
    playSound('correct');
    speakText("Giỏi quá!");
    confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => {
      setFeedback(null);
      setShowLetterPicker(true);
      speakText("Voi muốn tập viết chữ nào tiếp theo?");
    }, 2000);
  };

  const handleTracingFail = () => {
    setFeedback('wrong');
    setWrongCount(prev => prev + 1);
    playSound('wrong');
    speakText("Thử lại nhé!");
    setTimeout(() => setFeedback(null), 1500);
  };

  const renderStartScreen = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 p-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-yellow-300 w-full max-w-4xl"
    >
      <h1 className="text-5xl font-bold text-pink-500 mb-2 drop-shadow-sm">Voi Vui Học Tập! 🌟</h1>
      <p className="text-lg text-blue-600 font-medium italic mb-6">"Học mà chơi, chơi mà học"</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Math Card with Settings */}
        <div className="flex flex-col bg-orange-50 rounded-2xl border-4 border-orange-200 p-4 shadow-sm">
          <button 
            onClick={() => startGame('math')}
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
                      onClick={() => setMathRange(r)}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${mathRange === r ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'}`}
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
                      onClick={() => setMathOperator(op)}
                      className={`flex-1 py-1 text-lg font-bold rounded-lg transition-colors ${mathOperator === op ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'}`}
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
          onClick={() => startGame('numbers')}
          className="group flex flex-col items-center p-6 bg-blue-100 hover:bg-blue-200 rounded-2xl transition-all border-b-8 border-blue-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-blue-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <Trophy size={48} />
          </div>
          <span className="text-2xl font-bold text-blue-700">Tập Đếm</span>
          <span className="text-sm text-blue-600 mt-2">Đếm hình vui</span>
        </button>

        <button 
          onClick={() => startGame('letters')}
          className="group flex flex-col items-center p-6 bg-green-100 hover:bg-green-200 rounded-2xl transition-all border-b-8 border-green-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-green-400 p-4 rounded-full text-white mb-4 group-hover:-rotate-12 transition-transform">
            <BookOpen size={48} />
          </div>
          <span className="text-2xl font-bold text-green-700">Tập Viết</span>
          <span className="text-sm text-green-600 mt-2">Vẽ theo nét chữ</span>
        </button>

        <button 
          onClick={() => startGame('pattern')}
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
            onClick={() => startGame('sequence')}
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
                    onClick={() => setSequenceRange(r)}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${sequenceRange === r ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-700'}`}
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
            onClick={() => startGame('comparison')}
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
                    onClick={() => setComparisonRange(r)}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${comparisonRange === r ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}
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
            onClick={() => startGame('missing_number')}
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
                    onClick={() => setMissingNumberRange(r)}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${missingNumberRange === r ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => startGame('letter_recognition')}
          className="group flex flex-col items-center p-6 bg-amber-100 hover:bg-amber-200 rounded-2xl transition-all border-b-8 border-amber-300 active:border-b-0 active:translate-y-2"
        >
          <div className="bg-amber-400 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform">
            <Volume2 size={48} />
          </div>
          <span className="text-2xl font-bold text-amber-700">Nhận Biết Chữ</span>
          <span className="text-sm text-amber-600 mt-2">Nghe và chọn chữ</span>
        </button>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="w-full max-w-2xl">
      <div className="flex justify-between items-center mb-6 bg-white/60 p-4 rounded-2xl backdrop-blur-sm shadow-sm">
        <button 
          onClick={resetToHome}
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
          
          {mode !== 'letters' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold shadow-sm transition-colors text-sm ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
              <Timer size={16} />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode === 'letters' ? (showLetterPicker ? 'picker' : currentLetter) : (question?.text + (question?.visual?.length || '') + (question?.grid?.length || ''))}
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.1, x: -20 }}
          className="bg-white rounded-3xl p-8 shadow-xl border-4 border-purple-200 text-center relative overflow-hidden min-h-[550px] flex flex-col items-center justify-center"
        >
          {/* Feedback Overlays */}
          <AnimatePresence>
            {feedback === 'correct' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/90 text-white z-20"
              >
                <CheckCircle2 size={120} className="mb-4" />
                <h2 className="text-4xl font-bold">Đúng rồi! Giỏi quá! 🌟</h2>
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
                <h2 className="text-4xl font-bold">{mode === 'letters' ? 'Voi viết chưa đúng rồi!' : 'Sai rồi, Voi chọn lại nhé!'}</h2>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'letters' ? (
            showLetterPicker ? (
              <div className="w-full">
                <h3 
                  className="text-2xl font-bold text-purple-600 mb-6 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
                  onClick={() => speakText("Voi muốn tập viết chữ nào?")}
                >
                  <Volume2 size={24} />
                  Voi muốn tập viết chữ nào?
                </h3>
                <div className="grid grid-cols-5 md:grid-cols-7 gap-3 max-h-[400px] overflow-y-auto p-2">
                  {LETTER_LIST.map(l => (
                    <button
                      key={l}
                      onClick={() => {
                        setCurrentLetter(l);
                        setShowLetterPicker(false);
                        speakText(`Voi tập viết chữ ${l}`);
                      }}
                      className="aspect-square flex items-center justify-center text-2xl font-bold bg-purple-50 hover:bg-purple-200 text-purple-700 rounded-xl border-b-4 border-purple-200 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 
                    className="text-2xl font-bold text-purple-600 cursor-pointer hover:opacity-80 flex items-center gap-2"
                    onClick={() => speakText(`Voi tập viết chữ ${currentLetter}`)}
                  >
                    <Volume2 size={24} />
                    Voi tập viết chữ: {currentLetter}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowLetterPicker(true);
                      speakText("Voi muốn tập viết chữ nào?");
                    }}
                    className="text-sm font-bold text-blue-500 hover:underline"
                  >
                    Đổi chữ khác
                  </button>
                </div>
                <TracingCanvas 
                  letter={currentLetter} 
                  onComplete={handleTracingComplete} 
                  onFail={handleTracingFail}
                />
              </div>
            )
          ) : mode === 'pattern' ? (
            <div className="w-full">
              <h3 
                className="text-2xl font-bold text-gray-500 mb-8 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
                onClick={() => question && speakText(question.text)}
              >
                <Volume2 size={24} />
                {question?.text}
              </h3>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12 items-center min-h-[120px]">
                {question?.visual?.map((emoji, idx) => (
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {question?.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    disabled={feedback === 'correct'}
                    className="py-6 text-5xl font-bold rounded-2xl bg-white hover:bg-purple-50 text-purple-700 border-b-8 border-purple-200 transition-all active:border-b-0 active:translate-y-2 disabled:opacity-50 shadow-md"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : mode === 'comparison' ? (
            <div className="w-full">
              <h3 
                className="text-2xl font-bold text-gray-500 mb-8 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
                onClick={() => question && speakText(question.text)}
              >
                <Volume2 size={24} />
                {question?.text}
              </h3>
              
              <div className="flex items-center justify-center gap-8 mb-12">
                <div className="text-8xl font-black text-blue-600 bg-blue-50 w-32 h-32 flex items-center justify-center rounded-3xl border-4 border-blue-100">
                  {question?.visual?.[0]}
                </div>
                
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const symbol = e.dataTransfer.getData('symbol');
                    handleAnswer(symbol);
                  }}
                  className={`w-32 h-32 border-4 border-dashed rounded-3xl flex items-center justify-center text-7xl font-bold transition-all ${feedback === 'correct' ? 'bg-green-100 border-green-300 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-300'}`}
                >
                  {feedback === 'correct' ? question?.answer : '?'}
                </div>

                <div className="text-8xl font-black text-pink-600 bg-pink-50 w-32 h-32 flex items-center justify-center rounded-3xl border-4 border-pink-100">
                  {question?.visual?.[1]}
                </div>
              </div>

              <div className="flex justify-center gap-6">
                {['<', '=', '>'].map((symbol) => (
                  <div
                    key={symbol}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('symbol', symbol);
                      setDraggedSymbol(symbol);
                    }}
                    onDragEnd={() => setDraggedSymbol(null)}
                    onClick={() => handleAnswer(symbol)}
                    className={`w-24 h-24 flex items-center justify-center text-5xl font-bold bg-white rounded-2xl border-4 border-purple-200 shadow-lg cursor-grab active:cursor-grabbing hover:bg-purple-50 transition-all ${draggedSymbol === symbol ? 'opacity-50 scale-90' : ''}`}
                  >
                    {symbol}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-gray-400 font-medium italic">Kéo dấu vào ô trống hoặc chạm để chọn nhé!</p>
            </div>
          ) : mode === 'missing_number' ? (
            <div className="w-full">
              <h3 
                className="text-2xl font-bold text-gray-500 mb-8 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
                onClick={() => question && speakText(question.text)}
              >
                <Volume2 size={24} />
                {question?.text}
              </h3>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12 items-center min-h-[120px]">
                {question?.visual?.map((val, idx) => (
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {question?.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    disabled={feedback === 'correct'}
                    className="py-6 text-5xl font-bold rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border-b-8 border-rose-200 transition-all active:border-b-0 active:translate-y-2 disabled:opacity-50 shadow-md"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : mode === 'letter_recognition' ? (
            <div className="w-full">
              <div className="flex flex-col items-center justify-center mb-12">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => question && speakText(question.text)}
                  className="w-48 h-48 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg border-8 border-amber-200 mb-6"
                >
                  <div className="flex flex-col items-center">
                    <Volume2 size={80} />
                    <span className="text-sm font-bold mt-2">Bấm để nghe</span>
                  </div>
                </motion.button>
                <h3 className="text-3xl font-bold text-gray-600">Nghe và chọn chữ nhé!</h3>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full max-w-md mx-auto">
                {question?.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    disabled={feedback === 'correct'}
                    className="py-10 text-7xl font-black rounded-3xl bg-white hover:bg-amber-50 text-amber-700 border-b-8 border-amber-200 transition-all active:border-b-0 active:translate-y-2 disabled:opacity-50 shadow-md"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <h3 
                className="text-2xl font-bold text-gray-500 mb-6 cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
                onClick={() => question && speakText(question.text)}
              >
                <Volume2 size={24} />
                {question?.text}
              </h3>
              <div className="mb-10 flex flex-wrap justify-center gap-4 min-h-[120px] items-center">
                {(mode === 'math' || mode === 'sequence') && (
                  <div className="text-7xl font-black text-purple-600">
                    {mode === 'math' ? question?.text.split('=')[0] : question?.text.split('là')[0].replace('Số liền trước của số ', '').replace('Số liền sau của số ', '')}
                  </div>
                )}
                {mode === 'numbers' && question?.visual && (
                  <div className="flex flex-wrap justify-center gap-3 max-w-md">
                    {question.visual.map((v, i) => (
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
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
                {question?.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    disabled={feedback === 'correct'}
                    className="py-5 text-4xl font-bold rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border-b-8 border-purple-200 transition-all active:border-b-0 active:translate-y-2 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const renderEndScreen = () => (
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
      <p className="text-xl text-gray-600 mb-8">Voi đã làm rất tốt! Muốn chơi lại không?</p>
      
      <div className="flex flex-col gap-4">
        <button 
          onClick={resetToHome}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
        >
          <Home size={24} />
          Trang chủ
        </button>
        <button 
          onClick={() => startGame(mode)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold shadow-lg transition-all border-b-4 border-pink-700 active:border-b-0 active:translate-y-1"
        >
          <RotateCcw size={24} />
          Chơi lại
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col items-center justify-center p-4 font-sans selection:bg-pink-200" id="app-container">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 w-full flex flex-col items-center">
        {gameState === 'start' && renderStartScreen()}
        {gameState === 'playing' && renderGame()}
        {gameState === 'end' && renderEndScreen()}
      </main>

      <footer className="mt-12 text-blue-400 font-medium flex items-center gap-2">
        <span>Học mà chơi, chơi mà học</span>
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
      </footer>
    </div>
  );
}
