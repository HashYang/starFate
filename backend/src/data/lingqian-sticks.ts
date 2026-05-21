export type LuckLevel = '大吉' | '上吉' | '中吉' | '下下';

export interface StickData {
  number: number;
  level: LuckLevel;
}

// 100 fortune sticks with weighted distribution:
// 大吉 15%, 上吉 25%, 中吉 35%, 下下 25%
export const STICKS: StickData[] = [
  // 大吉 (15 sticks)  — auspicious numbers
  { number: 3, level: '大吉' }, { number: 7, level: '大吉' }, { number: 9, level: '大吉' },
  { number: 11, level: '大吉' }, { number: 15, level: '大吉' }, { number: 21, level: '大吉' },
  { number: 24, level: '大吉' }, { number: 33, level: '大吉' }, { number: 36, level: '大吉' },
  { number: 42, level: '大吉' }, { number: 55, level: '大吉' }, { number: 63, level: '大吉' },
  { number: 72, level: '大吉' }, { number: 88, level: '大吉' }, { number: 99, level: '大吉' },
  // 上吉 (25 sticks)
  { number: 1, level: '上吉' }, { number: 5, level: '上吉' }, { number: 8, level: '上吉' },
  { number: 13, level: '上吉' }, { number: 17, level: '上吉' }, { number: 18, level: '上吉' },
  { number: 22, level: '上吉' }, { number: 25, level: '上吉' }, { number: 28, level: '上吉' },
  { number: 31, level: '上吉' }, { number: 34, level: '上吉' }, { number: 37, level: '上吉' },
  { number: 41, level: '上吉' }, { number: 44, level: '上吉' }, { number: 48, level: '上吉' },
  { number: 51, level: '上吉' }, { number: 54, level: '上吉' }, { number: 58, level: '上吉' },
  { number: 61, level: '上吉' }, { number: 66, level: '上吉' }, { number: 71, level: '上吉' },
  { number: 75, level: '上吉' }, { number: 81, level: '上吉' }, { number: 91, level: '上吉' },
  { number: 96, level: '上吉' },
  // 中吉 (35 sticks)
  { number: 2, level: '中吉' }, { number: 4, level: '中吉' }, { number: 6, level: '中吉' },
  { number: 10, level: '中吉' }, { number: 12, level: '中吉' }, { number: 14, level: '中吉' },
  { number: 16, level: '中吉' }, { number: 19, level: '中吉' }, { number: 20, level: '中吉' },
  { number: 23, level: '中吉' }, { number: 26, level: '中吉' }, { number: 29, level: '中吉' },
  { number: 32, level: '中吉' }, { number: 35, level: '中吉' }, { number: 38, level: '中吉' },
  { number: 40, level: '中吉' }, { number: 43, level: '中吉' }, { number: 45, level: '中吉' },
  { number: 47, level: '中吉' }, { number: 50, level: '中吉' }, { number: 52, level: '中吉' },
  { number: 56, level: '中吉' }, { number: 59, level: '中吉' }, { number: 62, level: '中吉' },
  { number: 65, level: '中吉' }, { number: 68, level: '中吉' }, { number: 70, level: '中吉' },
  { number: 73, level: '中吉' }, { number: 76, level: '中吉' }, { number: 78, level: '中吉' },
  { number: 82, level: '中吉' }, { number: 85, level: '中吉' }, { number: 87, level: '中吉' },
  { number: 92, level: '中吉' }, { number: 95, level: '中吉' },
  // 下下 (25 sticks)
  { number: 27, level: '下下' }, { number: 30, level: '下下' }, { number: 39, level: '下下' },
  { number: 46, level: '下下' }, { number: 49, level: '下下' }, { number: 53, level: '下下' },
  { number: 57, level: '下下' }, { number: 60, level: '下下' }, { number: 64, level: '下下' },
  { number: 67, level: '下下' }, { number: 69, level: '下下' }, { number: 74, level: '下下' },
  { number: 77, level: '下下' }, { number: 79, level: '下下' }, { number: 80, level: '下下' },
  { number: 83, level: '下下' }, { number: 84, level: '下下' }, { number: 86, level: '下下' },
  { number: 89, level: '下下' }, { number: 90, level: '下下' }, { number: 93, level: '下下' },
  { number: 94, level: '下下' }, { number: 97, level: '下下' }, { number: 98, level: '下下' },
  { number: 100, level: '下下' },
];

export function pickRandomStick(): StickData {
  return STICKS[Math.floor(Math.random() * STICKS.length)];
}

export function getStickLevelClass(level: LuckLevel): string {
  switch (level) {
    case '大吉': return 'text-warning-red';
    case '上吉': return 'text-gold';
    case '中吉': return 'text-mystic-blue';
    case '下下': return 'text-muted/60';
  }
}
