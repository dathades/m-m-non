/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import type { ClassLevel, GameMode, GameSettings, Question } from './types.ts';
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
import { generateFirstLetter } from './lib/syllables.ts';
import { generateSpellingRound, type SpellingRound } from './lib/spelling.ts';
import EntryScreen from './components/EntryScreen.tsx';
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
import FirstLetterGame from './components/games/FirstLetterGame.tsx';
import SpellingGame from './components/games/SpellingGame.tsx';
import FractionGame from './components/games/FractionGame.tsx';
import MeasurementGame from './components/games/MeasurementGame.tsx';
import ExitConfirm from './components/ExitConfirm.tsx';

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

const CLASS_STORAGE_KEY = 'childClass';

const loadChildClass = (): ClassLevel | '' => {
  try {
    const v = localStorage.getItem(CLASS_STORAGE_KEY);
    return v === 'mam_non' || v === 'lop_4' ? v : '';
  } catch {
    return '';
  }
};

const saveChildClass = (level: ClassLevel) => {
  try {
    localStorage.setItem(CLASS_STORAGE_KEY, level);
  } catch {
    // localStorage bị chặn (private mode) — lớp chỉ sống trong phiên
  }
};

export default function App() {
  const [childName, setChildName] = useState(loadChildName);
  const [childClass, setChildClass] = useState<ClassLevel | ''>(loadChildClass);
  const [editingSetup, setEditingSetup] = useState(false);

  const [mode, setMode] = useState<GameMode>('math');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [spellingRound, setSpellingRound] = useState<SpellingRound | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentLetter, setCurrentLetter] = useState('A');
  const [showLetterPicker, setShowLetterPicker] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    mathRange: 10,
    mathOperator: '+',
    sequenceRange: 20,
    comparisonRange: 20,
    missingNumberRange: 20
  });

  const handleSetupSubmit = (name: string, level: ClassLevel) => {
    saveChildName(name);
    saveChildClass(level);
    setChildName(name);
    setChildClass(level);
    setEditingSetup(false);
    speakText(`Xin chào ${name}! Cùng học nào!`);
  };

  const resetToHome = () => {
    setGameState('start');
    setQuestion(null);
    setSpellingRound(null);
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
    if (selectedMode === 'first_letter') return generateFirstLetter();
    return null;
  }, [settings, childName]);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setTimeLeft(30);

    if (mode === 'spelling') {
      const round = generateSpellingRound();
      setSpellingRound(round);
      speakText(round.syllable);
      return;
    }

    const newQuestion = generateQuestionForMode(mode);
    if (newQuestion) {
      setQuestion(newQuestion);
      speakText(newQuestion.text);
    }
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
    } else if (selectedMode === 'spelling') {
      const round = generateSpellingRound();
      setSpellingRound(round);
      speakText(round.syllable);
    } else if (selectedMode === 'fractions' || selectedMode === 'measurement') {
      // FractionGame/MeasurementGame tự quản đề/đồng hồ/điểm — không sinh Question ở đây
    } else {
      const firstQuestion = generateQuestionForMode(selectedMode);
      if (firstQuestion) {
        setQuestion(firstQuestion);
        speakText(firstQuestion.text);
      }
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && !question && mode !== 'letters' && mode !== 'spelling' && mode !== 'fractions' && mode !== 'measurement') {
      nextQuestion();
    }
  }, [gameState, question, mode, nextQuestion]);

  useEffect(() => {
    let timer: number;
    if (gameState === 'playing' && timeLeft > 0 && !feedback && mode !== 'letters' && mode !== 'fractions' && mode !== 'measurement') {
      timer = window.setInterval(() => {
        if (document.hidden) return;
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing' && mode !== 'letters' && mode !== 'fractions' && mode !== 'measurement') {
      setGameState('end');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, feedback, mode]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    window.history.pushState({ game: true }, '');
    const onPop = () => setShowExitConfirm(true);
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('popstate', onPop);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [gameState]);

  const stayInGame = () => {
    setShowExitConfirm(false);
    window.history.pushState({ game: true }, '');
  };
  const leaveGame = () => {
    setShowExitConfirm(false);
    resetToHome();
  };

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

  const handleSpellingComplete = () => {
    setTotalCount((prev) => prev + 1);
    setScore((prev) => prev + 1);
    setFeedback('correct');
    playSound('correct');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setTimeout(nextQuestion, 2500);
  };

  const handleSpellingWrong = () => {
    setWrongCount((prev) => prev + 1);
    playSound('wrong');
  };

  const renderGameBody = () => {
    if (!question && mode !== 'letters' && mode !== 'spelling') return null;
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
      case 'first_letter':
        return <FirstLetterGame question={question!} disabled={disabled} onAnswer={handleAnswer} />;
      case 'spelling':
        return spellingRound ? (
          <SpellingGame
            round={spellingRound}
            disabled={feedback === 'correct'}
            onComplete={handleSpellingComplete}
            onWrong={handleSpellingWrong}
          />
        ) : null;
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
          key={
            mode === 'letters'
              ? (showLetterPicker ? 'picker' : currentLetter)
              : mode === 'spelling'
              ? (spellingRound?.syllable ?? '')
              : (question?.text ?? '') + (question?.visual?.length || '')
          }
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

  const needsSetup = !childName || !childClass || editingSetup;

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col items-center justify-center p-4 font-sans selection:bg-pink-200" id="app-container">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 w-full flex flex-col items-center">
        {needsSetup ? (
          <EntryScreen initialName={childName} initialClass={childClass} onSubmit={handleSetupSubmit} />
        ) : (
          <>
            {gameState === 'start' && (
              <StartScreen
                name={childName}
                settings={settings}
                onSettingsChange={(patch) => setSettings(prev => ({ ...prev, ...patch }))}
                onStart={startGame}
                onChangeName={() => setEditingSetup(true)}
                onChangeClass={() => setEditingSetup(true)}
                level={childClass || 'mam_non'}
              />
            )}
            {gameState === 'playing' && (mode === 'fractions'
              ? <FractionGame onExit={resetToHome} />
              : mode === 'measurement'
              ? <MeasurementGame onExit={resetToHome} />
              : renderPlaying())}
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
      <ExitConfirm open={showExitConfirm} onStay={stayInGame} onLeave={leaveGame} />
    </div>
  );
}
