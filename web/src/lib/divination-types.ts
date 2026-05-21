// ── Mode ──

export type DivinationMode = "tarot" | "liuyao" | "lingqian";

// ── Tarot (Western) ──

export interface TarotCard {
  name: string;
  nameCn: string;
  suit: string;
  isReversed: boolean;
  keyword: string;
  meaningLove: string;
  meaningCareer: string;
  meaningWealth: string;
}

export interface TarotReading {
  sessionId: string;
  question: string;
  cards: TarotCard[];
  interpretation: string;
  advice: string;
  score: number;
  spreadName: string;
  archivedId: string;
}

// ── 六爻 (Liu Yao) ──

export interface YaoLine {
  value: 0 | 1;
  moving: boolean;
}

export interface TrigramInfo {
  name: string;
  symbol: string;
  element: string;
  attribute: string;
}

export interface Hexagram {
  lines: YaoLine[];
  upperTrigram: TrigramInfo;
  lowerTrigram: TrigramInfo;
  hexagramName: string;
  hexagramNumber: number;
}

export interface LiuYaoReading {
  sessionId: string;
  question: string;
  hexagram: Hexagram;
  interpretation: string;
  advice: string;
  score: number;
  archivedId: string;
}

// ── 灵签 (Ling Qian) ──

export type LuckLevel = "大吉" | "上吉" | "中吉" | "下下";

export interface FortuneStick {
  number: number;
  level: LuckLevel;
}

export interface LingQianReading {
  sessionId: string;
  question: string;
  stick: FortuneStick;
  poem: string;
  interpretation: string;
  advice: string;
  score: number;
  archivedId: string;
}

// ── Archive ──

export interface ArchiveEntry {
  id: string;
  userId: string;
  type: string;
  question: string;
  readingResult: string;
  aiInterpretation: string;
  aiAdvice: string | null;
  cards: string | null;
  spreadName: string | null;
  score: number;
  predictionStatus: string;
  createdAt: string;
}

export interface ArchivePage {
  items: ArchiveEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── Helpers ──

export function scoreColor(s: number): string {
  if (s >= 80) return "text-gold";
  if (s >= 60) return "text-energy-green";
  if (s >= 40) return "text-mystic-blue";
  return "text-muted";
}

export function scoreBarColor(s: number): string {
  if (s >= 80) return "bg-gold";
  if (s >= 60) return "bg-energy-green";
  if (s >= 40) return "bg-mystic-blue";
  return "bg-muted";
}

export function scoreLabel(s: number): string {
  if (s >= 90) return "极佳";
  if (s >= 80) return "上佳";
  if (s >= 60) return "尚佳";
  if (s >= 40) return "平平";
  return "待机";
}

export function suitColor(suit: string): string {
  switch (suit) {
    case "major": return "text-gold";
    case "cups": return "text-mystic-blue";
    case "wands": return "text-warning-red";
    case "swords": return "text-primary";
    case "pentacles": return "text-energy-green";
    default: return "text-muted";
  }
}

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}个月前`;
}

export function parseReadingResult(entry: ArchiveEntry): {
  score: number;
  interpretation: string;
  advice: string;
} {
  try {
    const r = JSON.parse(entry.readingResult);
    return {
      score: r.score ?? 50,
      interpretation: r.details || entry.aiInterpretation,
      advice: r.advice || entry.aiAdvice || "",
    };
  } catch {
    return {
      score: 50,
      interpretation: entry.aiInterpretation,
      advice: entry.aiAdvice || "",
    };
  }
}

export function luckLevelColor(level: LuckLevel): string {
  switch (level) {
    case "大吉": return "text-warning-red";
    case "上吉": return "text-gold";
    case "中吉": return "text-mystic-blue";
    case "下下": return "text-muted/60";
  }
}

export function luckLevelBg(level: LuckLevel): string {
  switch (level) {
    case "大吉": return "bg-warning-red/10 border-warning-red/20";
    case "上吉": return "bg-gold/10 border-gold/20";
    case "中吉": return "bg-mystic-blue/10 border-mystic-blue/20";
    case "下下": return "bg-muted/10 border-muted/20";
  }
}
