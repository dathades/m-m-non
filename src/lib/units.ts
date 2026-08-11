export interface Unit { label: string; base: number }
export type Chain = Unit[];
export interface Measure { name: string; chains: Chain[] }

export const MEASURES: Measure[] = [
  { name: 'Khối lượng', chains: [[
    { label: 'g', base: 1 }, { label: 'kg', base: 1000 }, { label: 'yến', base: 10000 },
    { label: 'tạ', base: 100000 }, { label: 'tấn', base: 1000000 },
  ]] },
  { name: 'Diện tích', chains: [[
    { label: 'mm²', base: 1 }, { label: 'cm²', base: 100 }, { label: 'dm²', base: 10000 },
    { label: 'm²', base: 1000000 },
  ]] },
  { name: 'Độ dài', chains: [[
    { label: 'mm', base: 1 }, { label: 'cm', base: 10 }, { label: 'dm', base: 100 },
    { label: 'm', base: 1000 }, { label: 'km', base: 1000000 },
  ]] },
  { name: 'Thời gian', chains: [
    [{ label: 'giây', base: 1 }, { label: 'phút', base: 60 }, { label: 'giờ', base: 3600 }, { label: 'ngày', base: 86400 }],
    [{ label: 'năm', base: 1 }, { label: 'thế kỉ', base: 100 }],
  ] },
];

export const UNIT_SPEECH: Record<string, string> = {
  g: 'gam', kg: 'ki lô gam', 'yến': 'yến', 'tạ': 'tạ', 'tấn': 'tấn',
  mm: 'mi li mét', cm: 'xăng ti mét', dm: 'đề xi mét', m: 'mét', km: 'ki lô mét',
  'mm²': 'mi li mét vuông', 'cm²': 'xăng ti mét vuông', 'dm²': 'đề xi mét vuông', 'm²': 'mét vuông',
  'giây': 'giây', 'phút': 'phút', 'giờ': 'giờ', 'ngày': 'ngày', 'năm': 'năm', 'thế kỉ': 'thế kỉ',
};
