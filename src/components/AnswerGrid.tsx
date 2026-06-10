type AnswerVariant = 'purple' | 'pattern' | 'rose' | 'amber';

const VARIANT_CLASSES: Record<AnswerVariant, { container: string; button: string }> = {
  purple: {
    container: 'grid grid-cols-2 gap-4 md:gap-6 w-full',
    button: 'py-5 text-4xl font-bold rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border-b-8 border-purple-200'
  },
  pattern: {
    container: 'grid grid-cols-2 md:grid-cols-4 gap-4 w-full',
    button: 'py-6 text-5xl font-bold rounded-2xl bg-white hover:bg-purple-50 text-purple-700 border-b-8 border-purple-200 shadow-md'
  },
  rose: {
    container: 'grid grid-cols-2 md:grid-cols-4 gap-4 w-full',
    button: 'py-6 text-5xl font-bold rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border-b-8 border-rose-200 shadow-md'
  },
  amber: {
    container: 'grid grid-cols-2 gap-6 w-full max-w-md mx-auto',
    button: 'py-10 text-7xl font-black rounded-3xl bg-white hover:bg-amber-50 text-amber-700 border-b-8 border-amber-200 shadow-md'
  }
};

interface AnswerGridProps {
  options: string[];
  onAnswer: (option: string) => void;
  disabled: boolean;
  variant: AnswerVariant;
}

export default function AnswerGrid({ options, onAnswer, disabled, variant }: AnswerGridProps) {
  const classes = VARIANT_CLASSES[variant];
  return (
    <div className={classes.container}>
      {options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => onAnswer(opt)}
          disabled={disabled}
          className={`${classes.button} transition-all active:border-b-0 active:translate-y-2 disabled:opacity-50`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
