export interface TrigramData {
  name: string;
  symbol: string;
  element: string;
  attribute: string;
  binary: number;
}

// 八卦: binary order (0-7) following the Fu Xi sequence
export const TRIGRAMS: TrigramData[] = [
  { name: '坤', symbol: '☷', element: '土', attribute: '地', binary: 0 },
  { name: '震', symbol: '☳', element: '木', attribute: '雷', binary: 1 },
  { name: '坎', symbol: '☵', element: '水', attribute: '水', binary: 2 },
  { name: '兑', symbol: '☱', element: '金', attribute: '泽', binary: 3 },
  { name: '艮', symbol: '☶', element: '土', attribute: '山', binary: 4 },
  { name: '离', symbol: '☲', element: '火', attribute: '火', binary: 5 },
  { name: '巽', symbol: '☴', element: '木', attribute: '风', binary: 6 },
  { name: '乾', symbol: '☰', element: '金', attribute: '天', binary: 7 },
];

export function trigramFromBinary(n: number): TrigramData {
  return TRIGRAMS[n] ?? TRIGRAMS[0];
}

// lines[0..2] = bottom three (lower trigram)
// value as binary: line0*4 + line1*2 + line2
export function linesToLowerTrigram(lines: number[]): TrigramData {
  const val = lines[0] * 4 + lines[1] * 2 + lines[2];
  return trigramFromBinary(val);
}

// lines[3..5] = top three (upper trigram)
export function linesToUpperTrigram(lines: number[]): TrigramData {
  const val = lines[3] * 4 + lines[4] * 2 + lines[5];
  return trigramFromBinary(val);
}
