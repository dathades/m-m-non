import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import GameHUD from '../GameHUD.tsx';
import NumberPad from '../NumberPad.tsx';
import Fraction from '../Fraction.tsx';
import { playSound } from '../../lib/audio.ts';
import {
  generateFractionProblem, checkFractionAnswer,
  type FractionProblem, type FractionSkill,
} from '../../lib/fractionProblems.ts';

const QTIME = 30;
const SKILLS: { key: FractionSkill | 'mix'; label: string }[] = [
  { key: 'mix', label: 'Tổng hợp' },
  { key: 'recognize', label: 'Nhận biết' },
  { key: 'simplify', label: 'Rút gọn' },
  { key: 'compare', label: 'So sánh' },
  { key: 'addsub', label: 'Cộng/Trừ' },
  { key: 'muldiv', label: 'Nhân/Chia' },
  { key: 'fracof', label: 'PS của số' },
];

interface FractionGameProps { onExit: () => void }

export default function FractionGame({ onExit }: FractionGameProps) {
  const [skill, setSkill] = useState<FractionSkill | 'mix'>('mix');
  const [problem, setProblem] = useState<FractionProblem>(() => generateFractionProblem('mix'));
  const [num, setNum] = useState('');
  const [den, setDen] = useState('');
  const [val, setVal] = useState('');
  const [active, setActive] = useState<'num' | 'den'>('num');
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QTIME);
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [shake, setShake] = useState(false);
  const [cmpChoice, setCmpChoice] = useState('');

  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const advanceRef = useRef<number | null>(null);

  const startProblem = (sk: FractionSkill | 'mix') => {
    if (advanceRef.current !== null) { clearTimeout(advanceRef.current); advanceRef.current = null; }
    setProblem(generateFractionProblem(sk));
    setNum(''); setDen(''); setVal(''); setActive('num');
    setMsg(null); setTimeLeft(QTIME); setLocked(false); setCmpChoice('');
  };

  // đồng hồ: giảm mỗi giây khi không khoá; TẠM DỪNG khi ẩn tab (document.hidden)
  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [locked, problem]);

  // hết giờ → tính Sai + sang câu mới
  useEffect(() => {
    if (timeLeft === 0 && !lockedRef.current) {
      setLocked(true);
      setWrong((w) => w + 1);
      setTotal((n) => n + 1);
      setMsg({ text: 'Hết giờ! ⏰ (tính là sai)', ok: false });
      playSound('wrong');
      advanceRef.current = window.setTimeout(() => startProblem(skill), 1200);
      return () => { if (advanceRef.current !== null) { clearTimeout(advanceRef.current); advanceRef.current = null; } };
    }
  }, [timeLeft, skill]);

  const finishCorrect = () => {
    setLocked(true);
    setRight((r) => r + 1);
    setTotal((n) => n + 1);
    setMsg({ text: 'Đúng rồi! 🎉', ok: true });
    playSound('correct');
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.7 } });
    advanceRef.current = window.setTimeout(() => startProblem(skill), 850);
  };

  const wrongTry = () => {
    setMsg({ text: 'Chưa đúng, thử lại nhé', ok: false });
    playSound('wrong');
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  };

  const submitAnswer = (input: any) => {
    if (locked) return;
    if (checkFractionAnswer(problem, input)) finishCorrect();
    else wrongTry();
  };

  const onPad = (k: string) => {
    if (locked) return;
    if (k === 'ok') {
      if (problem.answerType === 'integer') { if (val !== '') submitAnswer(parseInt(val, 10)); }
      else if (num !== '' && den !== '') submitAnswer({ num: parseInt(num, 10), den: parseInt(den, 10) });
      return;
    }
    const set = (v: string, s: (x: string) => void) => {
      if (k === 'del') s(v.slice(0, -1));
      else if (v.length < 3) s((v + k).replace(/^0(?=\d)/, ''));
    };
    if (problem.answerType === 'integer') set(val, setVal);
    else if (active === 'num') { set(num, setNum); if (k !== 'del' && num === '') setActive('den'); }
    else set(den, setDen);
  };

  const chooseSkill = (k: FractionSkill | 'mix') => { setSkill(k); startProblem(k); };

  const p = problem;
  const opDisplay = p.op ?? '';
  const cellBase = 'inline-flex flex-col items-center align-middle';
  const cell = (v: string, on: boolean, onClick?: () => void) => (
    <span onClick={onClick} className={`min-w-[60px] min-h-[46px] px-2 flex items-center justify-center border-[3px] rounded-lg text-3xl font-extrabold text-indigo-700 cursor-pointer ${on ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_0_3px_#c7d2fe]' : 'border-indigo-200 bg-white'}`}>
      {v || <span className="text-indigo-200">?</span>}
    </span>
  );

  const fractionInput = (
    <span className={cellBase}>
      {cell(num, active === 'num', () => setActive('num'))}
      <span className="h-[3px] bg-indigo-700 w-[66px] my-1" />
      {cell(den, active === 'den', () => setActive('den'))}
    </span>
  );

  return (
    <div className="w-full max-w-2xl">
      <GameHUD totalCount={total} wrongCount={wrong} score={right} timeLeft={timeLeft} onExit={onExit} />

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {SKILLS.map((s) => (
          <button
            key={s.key}
            onClick={() => chooseSkill(s.key)}
            className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${skill === s.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-500'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200 min-h-[420px] flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-gray-500 mb-6">{p.prompt}</h3>

        <div className={`flex items-center justify-center gap-3 flex-wrap min-h-[120px] ${shake ? 'animate-[wiggle_0.4s]' : ''}`}>
          {p.skill === 'recognize' && (
            <div className="flex gap-1">
              {Array.from({ length: p.total ?? 0 }).map((_, i) => (
                <span key={i} className={`w-7 h-7 rounded border-2 border-indigo-500 ${i < (p.shaded ?? 0) ? 'bg-indigo-500' : ''}`} />
              ))}
            </div>
          )}
          {p.skill === 'compare' && (
            <>
              <Fraction num={p.operands[0].num} den={p.operands[0].den} />
              <span className="min-w-[56px] min-h-[56px] border-[3px] border-dashed border-indigo-200 rounded-xl inline-flex items-center justify-center text-4xl font-extrabold text-indigo-700">{cmpChoice}</span>
              <Fraction num={p.operands[1].num} den={p.operands[1].den} />
            </>
          )}
          {p.skill === 'fracof' && (
            <>
              <Fraction num={p.operands[0].num} den={p.operands[0].den} />
              <span className="text-3xl font-extrabold text-indigo-700">của {p.ofNum}</span>
              <span className="text-4xl font-extrabold">=</span>
              {cell(val, true)}
            </>
          )}
          {(p.skill === 'addsub' || p.skill === 'muldiv') && (
            <>
              <Fraction num={p.operands[0].num} den={p.operands[0].den} />
              <span className="text-4xl font-extrabold text-indigo-500">{opDisplay}</span>
              <Fraction num={p.operands[1].num} den={p.operands[1].den} />
              <span className="text-4xl font-extrabold">=</span>
              {fractionInput}
            </>
          )}
          {p.skill === 'simplify' && (
            <>
              <Fraction num={p.operands[0].num} den={p.operands[0].den} />
              <span className="text-4xl font-extrabold">=</span>
              {fractionInput}
            </>
          )}
        </div>

        <div className="min-h-[28px] mt-3 font-extrabold text-lg" style={{ color: msg?.ok ? '#16a34a' : '#ef4444' }}>{msg?.text ?? ''}</div>

        <div className="mt-4">
          {p.skill === 'recognize' && (
            <div className="grid grid-cols-4 gap-3 max-w-[420px]">
              {p.options!.map((o) => {
                const [n, d] = o.split('/');
                return (
                  <button key={o} onClick={() => submitAnswer(o)} className="border-[3px] border-indigo-200 rounded-2xl bg-white p-3 hover:bg-indigo-50">
                    <Fraction num={n} den={d} size="sm" />
                  </button>
                );
              })}
            </div>
          )}
          {p.skill === 'compare' && (
            <div className="flex gap-3">
              {['<', '=', '>'].map((s) => (
                <button key={s} onClick={() => { setCmpChoice(s); submitAnswer(s); }} className="w-16 h-16 rounded-2xl border-[3px] border-indigo-200 bg-white text-3xl font-extrabold text-indigo-700 hover:bg-indigo-50">{s}</button>
              ))}
            </div>
          )}
          {(p.skill === 'simplify' || p.skill === 'addsub' || p.skill === 'muldiv' || p.skill === 'fracof') && (
            <NumberPad onKey={onPad} />
          )}
        </div>
      </div>
    </div>
  );
}
