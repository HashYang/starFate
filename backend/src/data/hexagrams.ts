// 卦名矩阵: hexagramNames[lowerBinary][upperBinary]
// King Wen order (周易) 8×8 grid
// lowerBinary = lower trigram (下卦), upperBinary = upper trigram (上卦)
export const HEXAGRAM_NAMES: string[][] = [
  // upper→  坤(0)   震(1)   坎(2)   兑(3)   艮(4)   离(5)   巽(6)   乾(7)
  /*坤(0)*/ ['坤',   '复',   '师',   '临',   '谦',   '明夷', '升',   '泰'],
  /*震(1)*/ ['豫',   '震',   '解',   '归妹', '小过', '丰',   '恒',   '大壮'],
  /*坎(2)*/ ['比',   '屯',   '坎',   '节',   '蹇',   '既济', '井',   '需'],
  /*兑(3)*/ ['萃',   '随',   '困',   '兑',   '咸',   '革',   '大过', '夬'],
  /*艮(4)*/ ['剥',   '颐',   '蒙',   '损',   '艮',   '贲',   '蛊',   '大畜'],
  /*离(5)*/ ['晋',   '噬嗑', '未济', '睽',   '旅',   '离',   '鼎',   '大有'],
  /*巽(6)*/ ['观',   '益',   '涣',   '中孚', '渐',   '家人', '巽',   '小畜'],
  /*乾(7)*/ ['否',   '无妄', '讼',   '履',   '遁',   '同人', '姤',   '乾'],
];

// King Wen hexagram numbers (1-64) matching the matrix
export const HEXAGRAM_NUMBERS: number[][] = [
  [2,  24, 7,  19, 15, 36, 46, 11],
  [16, 51, 40, 54, 62, 55, 32, 34],
  [8,  3,  29, 60, 39, 63, 48, 5],
  [45, 17, 47, 58, 31, 49, 28, 43],
  [23, 27, 4,  41, 52, 22, 18, 26],
  [35, 21, 64, 38, 56, 30, 50, 14],
  [20, 42, 59, 61, 53, 37, 57, 9],
  [12, 25, 6,  10, 33, 13, 44, 1],
];

export function getHexagramName(lowerBinary: number, upperBinary: number): string {
  return HEXAGRAM_NAMES[lowerBinary]?.[upperBinary] ?? '未知卦';
}

export function getHexagramNumber(lowerBinary: number, upperBinary: number): number {
  return HEXAGRAM_NUMBERS[lowerBinary]?.[upperBinary] ?? 0;
}
