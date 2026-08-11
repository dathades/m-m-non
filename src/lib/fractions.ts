export interface Fraction { num: number; den: number }

export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}

export function simplify(f: Fraction): Fraction {
  const s = f.den < 0 ? -1 : 1;
  const num = f.num * s, den = f.den * s;
  const k = gcd(num, den);
  return { num: num / k, den: den / k };
}

export function add(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
}
export function sub(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
}
export function mul(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.num, den: a.den * b.den });
}
export function divide(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den, den: a.den * b.num });
}

export function compareFrac(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const d = a.num * b.den - b.num * a.den;
  return d < 0 ? -1 : d > 0 ? 1 : 0;
}
export function fracEquals(a: Fraction, b: Fraction): boolean {
  return a.num * b.den === b.num * a.den;
}
export function fractionOfNumber(f: Fraction, n: number): number {
  return (f.num * n) / f.den;
}
