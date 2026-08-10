import { useEffect, useState, type ReactNode } from 'react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../../lib/audio.ts';
import type { SpellingRound, SpellStepOption } from '../../lib/spelling.ts';

interface SpellingGameProps {
  round: SpellingRound;
  disabled: boolean;
  onComplete: () => void;
  onWrong: () => void;
}

export default function SpellingGame({ round, disabled, onComplete, onWrong }: SpellingGameProps) {
  const [step, setStep] = useState(0); // 0=âm đầu, 1=vần, 2=dấu, 3=xong
  const [wrongValue, setWrongValue] = useState<string | null>(null);

  // reset khi đổi tiếng
  useEffect(() => {
    setStep(0);
    setWrongValue(null);
  }, [round.syllable]);

  const steps = [
    { title: 'Tiếng này bắt đầu bằng âm nào?', options: round.onsetOptions, answer: round.onset, spoken: round.onsetReading },
    { title: 'Vần của tiếng này là gì?', options: round.rhymeOptions, answer: round.rhyme, spoken: round.rhyme },
    { title: 'Tiếng này có dấu gì?', options: round.toneOptions, answer: round.tone, spoken: round.syllable },
  ];

  const handlePick = (opt: SpellStepOption) => {
    if (disabled || step > 2) return;
    const current = steps[step];
    if (opt.value === current.answer) {
      speakText(current.spoken);
      const next = step + 1;
      setStep(next);
      if (next > 2) finish();
    } else {
      setWrongValue(opt.value);
      onWrong();
      setTimeout(() => setWrongValue(null), 500);
    }
  };

  const finish = () => {
    // đọc cả chuỗi rồi báo hoàn thành
    const seq = round.hasTone
      ? [round.onsetReading, round.rhyme, round.blend, round.toneLabel, round.syllable]
      : [round.onsetReading, round.rhyme, round.blend];
    let i = 0;
    const speakNext = () => {
      if (i >= seq.length) {
        onComplete();
        return;
      }
      speakText(seq[i]);
      i += 1;
      setTimeout(speakNext, 850);
    };
    speakNext();
  };

  const done = step > 2;

  return (
    <div className="w-full">
      {/* chuỗi đánh vần: chỉ hiện khi xong */}
      {done && (
        <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
          <ChainTile big={round.onset} read={round.onsetReading} />
          <Op>+</Op>
          <ChainTile big={round.rhyme} read={round.rhyme} />
          <Op>→</Op>
          <ChainTile big={round.blend} read={round.blend} />
          {round.hasTone && (
            <>
              <Op>+</Op>
              <ChainTile big="dấu" read={round.toneLabel} />
              <Op>→</Op>
              <ChainTile big={round.syllable} read={round.syllable} highlight />
            </>
          )}
        </div>
      )}

      {/* tiếng cần đánh vần */}
      <div className="flex flex-col items-center mb-6">
        <div className="font-spell text-7xl font-bold text-purple-700 mb-3">{round.syllable}</div>
        <button
          onClick={() => speakText(round.syllable)}
          className="flex items-center gap-2 px-5 py-2 bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-700 rounded-full font-bold transition-colors"
        >
          <Volume2 size={20} />
          Nghe lại
        </button>
      </div>

      {!done && (
        <>
          <h3 className="text-2xl font-bold text-gray-500 mb-6">{steps[step].title}</h3>
          <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
            {steps[step].options.map((opt, i) => (
              <button
                key={`${step}-${opt.value}-${i}`}
                onClick={() => handlePick(opt)}
                disabled={disabled}
                className={`flex flex-col items-center justify-center rounded-2xl border-4 p-3 min-h-[92px] transition-all
                  ${wrongValue === opt.value ? 'border-red-400 bg-red-50 animate-[wiggle_0.4s]' : 'border-gray-200 bg-white hover:border-indigo-300 hover:-translate-y-1'}`}
              >
                <span className="font-spell text-4xl font-bold text-indigo-700 leading-none min-h-[40px]">{opt.display}</span>
                <span className="text-sm text-gray-400 mt-1 min-h-[16px]">{opt.reading}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChainTile({ big, read, highlight }: { big: string; read: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border-4 px-3 py-2 text-center ${highlight ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'}`}>
      <div className="font-spell text-3xl font-bold leading-none">{big}</div>
      <div className="text-xs text-gray-400 mt-1">{read}</div>
    </div>
  );
}

function Op({ children }: { children: ReactNode }) {
  return <div className="text-2xl text-purple-300 font-extrabold">{children}</div>;
}
