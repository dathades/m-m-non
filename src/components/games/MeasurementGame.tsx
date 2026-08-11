import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import GameHUD from '../GameHUD.tsx';
import NumberPad from '../NumberPad.tsx';
import { playSound, speakText, SAY } from '../../lib/audio.ts';
import {
  generateMeasurementProblem, checkMeasurementAnswer, verbalizeMeasurementProblem,
  type MeasurementProblem, type MeasureSkill,
} from '../../lib/measurementProblems.ts';

const QTIME = 30;
const SKILLS: { key: MeasureSkill | 'mix'; label: string }[] = [
  { key: 'mix', label: 'Tổng hợp' },
  { key: 'convert', label: 'Đổi đơn vị' },
  { key: 'compare', label: 'So sánh' },
  { key: 'compound', label: 'Đổi ghép' },
];

interface MeasurementGameProps { onExit: () => void }

export default function MeasurementGame({ onExit }: MeasurementGameProps) {
  const [skill, setSkill] = useState<MeasureSkill | 'mix'>('mix');
  const [problem, setProblem] = useState<MeasurementProblem>(() => generateMeasurementProblem('mix'));
  const [val, setVal] = useState('');
  const [cmpChoice, setCmpChoice] = useState('');
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QTIME);
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [shake, setShake] = useState(false);

  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const advanceRef = useRef<number | null>(null);

  const startProblem = (sk: MeasureSkill | 'mix') => {
    if (advanceRef.current !== null) { clearTimeout(advanceRef.current); advanceRef.current = null; }
    setProblem(generateMeasurementProblem(sk));
    setVal(''); setCmpChoice(''); setMsg(null); setTimeLeft(QTIME); setLocked(false);
  };

  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [locked, problem]);

  useEffect(() => {
    if (timeLeft === 0 && !lockedRef.current) {
      setLocked(true);
      setWrong((w) => w + 1);
      setTotal((n) => n + 1);
      setMsg({ text: 'Hết giờ! ⏰ (tính là sai)', ok: false });
      playSound('wrong');
      speakText(SAY.timeout);
      advanceRef.current = window.setTimeout(() => startProblem(skill), 1500);
      return () => { if (advanceRef.current !== null) { clearTimeout(advanceRef.current); advanceRef.current = null; } };
    }
  }, [timeLeft, skill]);

  useEffect(() => { speakText(verbalizeMeasurementProblem(problem)); }, [problem]);

  const finishCorrect = () => {
    setLocked(true);
    setRight((r) => r + 1);
    setTotal((n) => n + 1);
    setMsg({ text: 'Đúng rồi! 🎉', ok: true });
    playSound('correct');
    speakText(SAY.correct);
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.7 } });
    advanceRef.current = window.setTimeout(() => startProblem(skill), 1800);
  };

  const wrongTry = () => {
    setMsg({ text: 'Chưa đúng, thử lại nhé', ok: false });
    playSound('wrong');
    speakText(SAY.retry);
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  };

  const submit = (input: number | string) => {
    if (locked) return;
    if (checkMeasurementAnswer(problem, input)) finishCorrect();
    else wrongTry();
  };

  const onPad = (k: string) => {
    if (locked) return;
    if (k === 'ok') { if (val !== '') submit(parseInt(val, 10)); return; }
    if (k === 'del') { setVal((v) => v.slice(0, -1)); return; }
    setVal((v) => (v.length < 7 ? (v + k).replace(/^0(?=\d)/, '') : v));
  };

  const chooseSkill = (k: MeasureSkill | 'mix') => { setSkill(k); startProblem(k); };

  const p = problem;

  return (
    <div className="w-full max-w-2xl">
      <GameHUD totalCount={total} wrongCount={wrong} score={right} timeLeft={timeLeft} onExit={onExit} />

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {SKILLS.map((s) => (
          <button
            key={s.key}
            onClick={() => chooseSkill(s.key)}
            className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${skill === s.key ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-500'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={() => speakText(verbalizeMeasurementProblem(problem))}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 text-teal-700 font-bold text-sm hover:bg-teal-200"
        >
          🔊 Nghe lại
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-teal-200 min-h-[420px] flex flex-col items-center justify-center">
        <div className="text-sm font-bold text-slate-400 mb-1">{p.measure}</div>
        <h3 className="text-xl font-bold text-gray-500 mb-6">{p.prompt}</h3>

        <div className={`flex items-center justify-center gap-3 flex-wrap min-h-[90px] text-3xl font-extrabold text-slate-700 ${shake ? 'animate-[wiggle_0.4s]' : ''}`}>
          {p.answerType === 'choice3' ? (
            <>
              <span>{p.left}</span>
              <span className="min-w-[56px] min-h-[56px] border-[3px] border-dashed border-teal-200 rounded-xl inline-flex items-center justify-center text-teal-700">{cmpChoice}</span>
              <span>{p.right}</span>
            </>
          ) : (
            <>
              <span>{p.parts}</span>
              <span>=</span>
              <span className="min-w-[78px] min-h-[52px] px-3 inline-flex items-center justify-center border-[3px] border-teal-200 rounded-xl bg-white text-teal-700">
                {val || <span className="text-teal-200">?</span>}
              </span>
              <span className="text-teal-600 text-2xl">{p.toUnit}</span>
            </>
          )}
        </div>

        <div className="min-h-[28px] mt-3 font-extrabold text-lg" style={{ color: msg?.ok ? '#16a34a' : '#ef4444' }}>{msg?.text ?? ''}</div>

        <div className="mt-4">
          {p.answerType === 'choice3' ? (
            <div className="flex gap-3">
              {['<', '=', '>'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setCmpChoice(s); submit(s); }}
                  className="w-16 h-16 rounded-2xl border-[3px] border-teal-200 bg-white text-3xl font-extrabold text-teal-700 hover:bg-teal-50"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <NumberPad onKey={onPad} />
          )}
        </div>
      </div>
    </div>
  );
}
