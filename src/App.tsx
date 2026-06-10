/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import type { GameMode, GameSettings, Question } from './types.ts';
import { playSound, speakText } from './lib/audio.ts';
import {
  generateComparison,
  generateCounting,
  generateLetterRecognition,
  generateMath,
  generateMissingNumber,
  generatePattern,
  generateSequence
} from './lib/questions.ts';
import NameEntryScreen from './components/NameEntryScreen.tsx';
import StartScreen from './components/StartScreen.tsx';
import EndScreen from './components/EndScreen.tsx';
import GameHUD from './components/GameHUD.tsx';
import FeedbackOverlay from './components/FeedbackOverlay.tsx';
import MathGame from './components/games/MathGame.tsx';
import CountingGame from './components/games/CountingGame.tsx';
import TracingGame from './components/games/TracingGame.tsx';
import PatternGame from './components/games/PatternGame.tsx';
import SequenceGame from './components/games/SequenceGame.tsx';
import ComparisonGame from './components/games/ComparisonGame.tsx';
import MissingNumberGame from './components/games/MissingNumberGame.tsx';
import LetterRecognitionGame from './components/games/LetterRecognitionGame.tsx';

const NAME_STORAGE_KEY = 'childName';

const loadChildName = (): string => {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

const saveChildName = (name: string) => {
  try {
    localStorage.setItem(NAME_STORAGE_KEY, name);
  } catch {
    // localStorage bị chặn (private mode) — tên chỉ sống trong phiên
  }
};

export default function App() {
  const [childName, setChildName] = useState(loadChildName);
  const [editingName, setEditingName] = useState(false);

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
  const [settings, setSettings] = useState<GameSettings>({
    mathRange: 10,
    mathOperator: '+',
    sequenceRange: 20,
    comparisonRange: 20,
    missingNumberRange: 20
  });

  const handleNameSubmit = (name: string) => {
    saveChildName(name);
    setChildName(name);
    setEditingName(false);
    speakText(`Xin chào ${name}! Cùng học nào!`);
  };

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

  const generateQuestionForMode = useCallback((selectedMode: GameMode): Question | null => {
    if (selectedMode === 'math') return generateMath(settings.mathRange, settings.mathOperator);
    if (selectedMode === 'numbers') return generateCounting(childName);
    if (selectedMode === 'pattern') return generatePattern(childName);
    if (selectedMode === 'sequence') return generateSequence(settings.sequenceRange);
    if (selectedMode === 'comparison') return generateComparison(settings.comparisonRange, childName);
    if (selectedMode === 'missing_number') return generateMissingNumber(settings.missingNumberRange, childName);
    if (selectedMode === 'letter_recognition') return generateLetterRecognition(childName);
    return null;
  }, [settings, childName]);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setTimeLeft(30);
    const newQuestion = generateQuestionForMode(mode);

    if (newQuestion) {
      setQuestion(newQuestion);
      speakText(newQuestion.text);
    }
    // In letters mode, we don't auto-next
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
      speakText(`${childName} muốn tập viết chữ nào`);
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
      speakText(`Đúng rồi! ${childName} giỏi quá!`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(nextQuestion, 2000);
    } else {
      setFeedback('wrong');
      setWrongCount(prev => prev + 1);
      playSound('wrong');
      speakText('Chưa đúng rồi!');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handleTracingComplete = () => {
    setTotalCount(prev => prev + 1);
    setScore(prev => prev + 1);
    setFeedback('correct');
    playSound('correct');
    speakText(`${childName} giỏi quá!`);
    confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => {
      setFeedback(null);
      setShowLetterPicker(true);
      speakText(`${childName} muốn tập viết chữ nào tiếp theo`);
    }, 2000);
  };

  const handleTracingFail = () => {
    setFeedback('wrong');
    setWrongCount(prev => prev + 1);
    playSound('wrong');
    speakText('Thử lại nhé!');
    setTimeout(() => setFeedback(null), 1500);
  };

  const handleSelectLetter = (letter: string) => {
    setCurrentLetter(letter);
    setShowLetterPicker(false);
    speakText(`${childName} tập viết chữ ${letter}`);
  };

  const handleRequestPicker = () => {
    setShowLetterPicker(true);
    speakText(`${childName} muốn tập viết chữ nào`);
  };

  const renderGameBody = () => {
    if (!question && mode !== 'letters') return null;
    const disabled = feedback === 'correct';

    switch (mode) {
      case 'letters':
        return (
          <TracingGame
            name={childName}
            currentLetter={currentLetter}
            showPicker={showLetterPicker}
            onSelectLetter={handleSelectLetter}
            onRequestPicker={handleRequestPicker}
            onComplete={handleTracingComplete}
            onFail={handleTracingFail}
          />
        );
      case 'math':
        return <MathGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'numbers':
        return <CountingGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'pattern':
        return <PatternGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'sequence':
        return <SequenceGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'comparison':
        return <ComparisonGame question={question!} solved={disabled} onAnswer={handleAnswer} />;
      case 'missing_number':
        return <MissingNumberGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'letter_recognition':
        return <LetterRecognitionGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      default:
        return null;
    }
  };

  const renderPlaying = () => (
    <div className="w-full max-w-2xl">
      <GameHUD
        totalCount={totalCount}
        wrongCount={wrongCount}
        score={score}
        timeLeft={mode === 'letters' ? null : timeLeft}
        onExit={resetToHome}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={mode === 'letters' ? (showLetterPicker ? 'picker' : currentLetter) : (question?.text ?? '') + (question?.visual?.length || '')}
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.1, x: -20 }}
          className="bg-white rounded-3xl p-8 shadow-xl border-4 border-purple-200 text-center relative overflow-hidden min-h-[550px] flex flex-col items-center justify-center"
        >
          <FeedbackOverlay
            feedback={feedback}
            correctMessage={`Đúng rồi! ${childName} giỏi quá! 🌟`}
            wrongMessage={mode === 'letters' ? `${childName} viết chưa đúng rồi!` : `Sai rồi, ${childName} chọn lại nhé!`}
          />
          {renderGameBody()}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const needsName = !childName || editingName;

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col items-center justify-center p-4 font-sans selection:bg-pink-200" id="app-container">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 w-full flex flex-col items-center">
        {needsName ? (
          <NameEntryScreen initialName={childName} onSubmit={handleNameSubmit} />
        ) : (
          <>
            {gameState === 'start' && (
              <StartScreen
                name={childName}
                settings={settings}
                onSettingsChange={(patch) => setSettings(prev => ({ ...prev, ...patch }))}
                onStart={startGame}
                onChangeName={() => setEditingName(true)}
              />
            )}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'end' && (
              <EndScreen
                name={childName}
                score={score}
                totalCount={totalCount}
                wrongCount={wrongCount}
                onHome={resetToHome}
                onReplay={() => startGame(mode)}
              />
            )}
          </>
        )}
      </main>

      <footer className="mt-12 text-blue-400 font-medium flex items-center gap-2">
        <span>Học mà chơi, chơi mà học</span>
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
      </footer>
    </div>
  );
}
