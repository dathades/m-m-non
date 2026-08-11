interface NumberPadProps {
  onKey: (k: string) => void; // '0'..'9' | 'del' | 'ok'
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];

export default function NumberPad({ onKey }: NumberPadProps) {
  const label = (k: string) => (k === 'del' ? '⌫' : k === 'ok' ? '✓' : k);
  return (
    <div className="grid grid-cols-3 gap-2 w-[220px]">
      {KEYS.map((k) => (
        <button
          key={k}
          onClick={() => onKey(k)}
          className={`h-14 rounded-xl border-2 text-2xl font-extrabold transition-colors ${
            k === 'ok'
              ? 'bg-green-500 text-white border-green-600'
              : k === 'del'
              ? 'bg-red-50 text-red-500 border-red-200'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          {label(k)}
        </button>
      ))}
    </div>
  );
}
