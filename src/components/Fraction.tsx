interface FractionProps {
  num: number | string;
  den: number | string;
  size?: 'sm' | 'lg';
}

export default function Fraction({ num, den, size = 'lg' }: FractionProps) {
  const t = size === 'lg' ? 'text-4xl' : 'text-2xl';
  return (
    <span className="inline-flex flex-col items-center font-serif font-bold leading-none align-middle">
      <span className={`px-2 ${t}`}>{num}</span>
      <span className="h-[3px] bg-current w-full min-w-[34px] my-1" />
      <span className={`px-2 ${t}`}>{den}</span>
    </span>
  );
}
