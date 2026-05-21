import { Solar } from 'lunar-javascript';

// ===== Constants =====

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEM_ELEMENT: number[] = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
const BRANCH_ELEMENT: number[] = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
const ELEMENT_NAMES = ['木', '火', '土', '金', '水'];

// 十二长生
const SHI_ER_CHANG_SHENG = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

// ===== Interfaces =====

export interface Pillar {
  stem: string;
  branch: string;
  stemIndex: number;
  branchIndex: number;
  stemElement: string;
  branchElement: string;
  full: string;
  hiddenStems: string[];
  tenGodStem: string;
  tenGodBranch: string[];
  dishi: string; // 十二长生
}

export interface ShenSha {
  tianyi: string[];     // 天乙贵人
  wenChang: string[];   // 文昌贵人
  taoHua: string[];     // 桃花
  huaGai: string[];     // 华盖
  yiMa: string[];       // 驿马
  guChen: string[];     // 孤辰
}

export interface ElementStrength {
  element: string;
  count: number;
  status: '旺' | '相' | '休' | '囚' | '死'; // 旺相休囚死
  isStrong: boolean;
}

export interface BaziData {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar;
  fiveElements: Record<string, number>;
  elementStrength: ElementStrength[];
  dayStemElement: string;
  nayin: string;
  yongshen: string;
  jishen: string;
  shensha: ShenSha;
}

export interface DaYunPeriod {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  stemIndex: number;
  branchIndex: number;
}

export interface DaYunData {
  startAge: number;
  forward: boolean;
  periods: DaYunPeriod[];
}

export interface FateEngineOutput {
  bazi: BaziData;
  dayun: DaYunData | null;
  currentDayunIndex: number | null;
  liunian: string;
  liunianStemIndex: number;
  liunianBranchIndex: number;
  currentAge: number;
}

// ===== 神煞 =====

function calcShenSha(dayGanIdx: number, dayZhiIdx: number, yearZhiIdx: number): ShenSha {
  // 天乙贵人 based on 日干
  const TIANYI_MAP: Record<number, number[]> = {
    0: [1, 8],  // 甲→丑未
    1: [0, 11], // 乙→子申
    2: [2, 9],  // 丙→亥酉
    3: [9, 2],  // 丁→酉亥
    4: [1, 8],  // 戊→丑未
    5: [0, 11], // 己→子申
    6: [2, 9],  // 庚→亥酉
    7: [9, 2],  // 辛→酉亥
    8: [4, 7],  // 壬→卯巳
    9: [4, 7],  // 癸→卯巳
  };

  // 文昌贵人 based on 日干
  const WENCHANG_MAP = [3, 4, 5, 6, 7, 8, 9, 0, 1, 2]; // 甲→巳, 乙→午, 丙→申, etc.

  // 桃花: 寅午戌→卯, 巳酉丑→午, 申子辰→酉, 亥卯未→子
  const TAOHUA_MAP: Record<number, number> = { 0: 7, 4: 7, 8: 7, 1: 5, 5: 5, 9: 5, 2: 2, 6: 2, 10: 2, 3: 11, 7: 11, 11: 11 };

  // 华盖: 寅午戌→戌, 巳酉丑→丑, 申子辰→辰, 亥卯未→未
  const HUAGAI_MAP: Record<number, number> = { 0: 10, 4: 10, 8: 10, 1: 1, 5: 1, 9: 1, 2: 4, 6: 4, 10: 4, 3: 7, 7: 7, 11: 7 };

  // 驿马: 申子辰→寅, 亥卯未→巳, 寅午戌→申, 巳酉丑→亥
  const YIMA_MAP: Record<number, number> = { 0: 2, 4: 2, 8: 2, 1: 5, 5: 5, 9: 5, 2: 8, 6: 8, 10: 8, 3: 11, 7: 11, 11: 11 };

  // 孤辰: 寅卯辰→辰, 巳午未→未, 申酉戌→戌, 亥子丑→丑
  const GUCHEN_MAP: Record<number, number> = { 2: 4, 3: 4, 4: 4, 5: 7, 6: 7, 7: 7, 8: 10, 9: 10, 10: 10, 11: 1, 0: 1, 1: 1 };

  return {
    tianyi: (TIANYI_MAP[dayGanIdx] || []).map(i => EARTHLY_BRANCHES[i]),
    wenChang: [EARTHLY_BRANCHES[WENCHANG_MAP[dayGanIdx]]],
    taoHua: [EARTHLY_BRANCHES[TAOHUA_MAP[dayZhiIdx] ?? 0]],
    huaGai: [EARTHLY_BRANCHES[HUAGAI_MAP[dayZhiIdx] ?? 0]],
    yiMa: [EARTHLY_BRANCHES[YIMA_MAP[dayZhiIdx] ?? 0]],
    guChen: [EARTHLY_BRANCHES[GUCHEN_MAP[dayZhiIdx] ?? 0]],
  };
}

// ===== 五行旺衰 (旺相休囚死) =====

function calcElementStrength(fiveElements: Record<string, number>, monthBranchIndex: number): ElementStrength[] {
  // Season determination by month branch:
  // 寅卯辰=春木, 巳午未=夏火, 申酉戌=秋金, 亥子丑=冬水
  // 辰未戌丑=土旺月
  const seasonOrder = [
    { season: 'spring', elements: ['木', '火', '土', '金', '水'], status: ['旺', '相', '死', '囚', '休'] },
    { season: 'summer', elements: ['火', '土', '金', '水', '木'], status: ['旺', '相', '死', '囚', '休'] },
    { season: 'autumn', elements: ['金', '水', '木', '火', '土'], status: ['旺', '相', '死', '囚', '休'] },
    { season: 'winter', elements: ['水', '木', '火', '土', '金'], status: ['旺', '相', '死', '囚', '休'] },
  ];

  let seasonIdx: number;
  if ([2, 3, 4].includes(monthBranchIndex)) seasonIdx = 0; // 春
  else if ([5, 6, 7].includes(monthBranchIndex)) seasonIdx = 1; // 夏
  else if ([8, 9, 10].includes(monthBranchIndex)) seasonIdx = 2; // 秋
  else seasonIdx = 3; // 冬

  // 土 special: 辰(4)未(7)戌(10)丑(1) are 土旺月
  // In these months, 土 is 旺
  const earthMonths = [4, 7, 10, 1];
  if (earthMonths.includes(monthBranchIndex)) {
    return ELEMENT_NAMES.map((elem, i) => {
      const count = fiveElements[elem] || 0;
      let status: '旺' | '相' | '休' | '囚' | '死';
      if (elem === '土') status = '旺';
      else if (elem === '金') status = '相';  // 土生金
      else if (elem === '火') status = '休';  // 火生土
      else if (elem === '木') status = '囚';  // 木克土
      else status = '死';                     // 土克水
      return { element: elem, count, status, isStrong: status === '旺' || status === '相' };
    });
  }

  const season = seasonOrder[seasonIdx];
  return ELEMENT_NAMES.map((elem, i) => {
    const count = fiveElements[elem] || 0;
    const idx = season.elements.indexOf(elem);
    const status = (season.status[idx] || '休') as '旺' | '相' | '休' | '囚' | '死';
    return { element: elem, count, status, isStrong: status === '旺' || status === '相' };
  });
}

// ===== 用神忌神 =====

function calcYongShenJiShen(dayStemIndex: number, monthBranchIndex: number): { yongshen: string; jishen: string } {
  const dayElem = Math.floor(dayStemIndex / 2);
  const monthElem = BRANCH_ELEMENT[monthBranchIndex];
  const isInSeason = dayElem === monthElem;
  const monthIsEarth = monthElem === 2;

  const isStrong = dayElem === 2
    ? monthIsEarth || monthElem === 1
    : isInSeason;

  const yongElem = isStrong
    ? (dayElem + 2) % 5
    : (dayElem + 4) % 5;

  const jiElem = isStrong
    ? (dayElem + 4) % 5
    : (dayElem + 2) % 5;

  return {
    yongshen: ELEMENT_NAMES[yongElem],
    jishen: ELEMENT_NAMES[jiElem],
  };
}

// ===== Main =====

export function calculateFate(
  birthDate: Date,
  birthHour: number,
  birthMinute: number,
  gender: 'male' | 'female' | null,
): FateEngineOutput {
  const solar = Solar.fromYmdHms(
    birthDate.getFullYear(),
    birthDate.getMonth() + 1,
    birthDate.getDate(),
    birthHour,
    birthMinute,
    0,
  );
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  // ---- Stem/Branch indices ----
  const findIndex = (arr: string[], v: string | undefined) =>
    v && v.length > 0 ? arr.indexOf(v) : -1;

  const yearGan = ec.getYearGan();
  const yearZhi = ec.getYearZhi();
  const monthGan = ec.getMonthGan();
  const monthZhi = ec.getMonthZhi();
  const dayGan = ec.getDayGan();
  const dayZhi = ec.getDayZhi();
  const timeGan = ec.getTimeGan();
  const timeZhi = ec.getTimeZhi();

  const yearGanIdx = findIndex(HEAVENLY_STEMS, yearGan);
  const yearZhiIdx = findIndex(EARTHLY_BRANCHES, yearZhi);
  const monthGanIdx = findIndex(HEAVENLY_STEMS, monthGan);
  const monthZhiIdx = findIndex(EARTHLY_BRANCHES, monthZhi);
  const dayGanIdx = findIndex(HEAVENLY_STEMS, dayGan);
  const dayZhiIdx = findIndex(EARTHLY_BRANCHES, dayZhi);
  const timeGanIdx = findIndex(HEAVENLY_STEMS, timeGan);
  const timeZhiIdx = findIndex(EARTHLY_BRANCHES, timeZhi);

  const safeGet = <T>(fn: () => T): T | undefined => {
    try { return fn(); } catch { return undefined; }
  };

  function getPillar(
    gan: string | undefined, zhi: string | undefined,
    ganIdx: number, zhiIdx: number,
    getSG: () => string | undefined,
    getSZ: () => string[] | undefined,
    getHides: () => string[] | undefined,
    getDiShi: () => string | undefined,
  ): Pillar {
    const hides = safeGet(() => getHides()) || [];
    const tenGodBranch = safeGet(() => getSZ()) || [];
    const tenGodStem = safeGet(() => getSG()) || '';
    const dishi = safeGet(() => getDiShi()) || '';
    return {
      stem: gan || '', branch: zhi || '',
      stemIndex: ganIdx, branchIndex: zhiIdx,
      stemElement: ganIdx >= 0 ? ELEMENT_NAMES[STEM_ELEMENT[ganIdx]] : '',
      branchElement: zhiIdx >= 0 ? ELEMENT_NAMES[BRANCH_ELEMENT[zhiIdx]] : '',
      full: (gan || '') + (zhi || ''),
      hiddenStems: hides,
      tenGodStem,
      tenGodBranch,
      dishi,
    };
  }

  const yearPillar = getPillar(yearGan, yearZhi, yearGanIdx, yearZhiIdx,
    () => ec.getYearShiShenGan(), () => ec.getYearShiShenZhi(), () => ec.getYearHideGan(), () => ec.getYearDiShi());
  const monthPillar = getPillar(monthGan, monthZhi, monthGanIdx, monthZhiIdx,
    () => ec.getMonthShiShenGan(), () => ec.getMonthShiShenZhi(), () => ec.getMonthHideGan(), () => ec.getMonthDiShi());
  const dayPillar = getPillar(dayGan, dayZhi, dayGanIdx, dayZhiIdx,
    () => ec.getDayShiShenGan(), () => ec.getDayShiShenZhi(), () => ec.getDayHideGan(), () => ec.getDayDiShi());
  const hourPillar = getPillar(timeGan, timeZhi, timeGanIdx, timeZhiIdx,
    () => ec.getTimeShiShenGan(), () => ec.getTimeShiShenZhi(), () => ec.getTimeHideGan(), () => ec.getTimeDiShi());

  // ---- Five elements ----
  const fiveElements: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const countElem = (idx: number) => {
    if (idx >= 0) {
      const e = idx < 10 ? STEM_ELEMENT[idx] : BRANCH_ELEMENT[idx - 10];
      fiveElements[ELEMENT_NAMES[e]]++;
    }
  };
  countElem(yearGanIdx); countElem(yearZhiIdx);
  countElem(monthGanIdx); countElem(monthZhiIdx);
  countElem(dayGanIdx); countElem(dayZhiIdx);
  countElem(timeGanIdx); countElem(timeZhiIdx);

  const dayStemElement = dayGanIdx >= 0 ? ELEMENT_NAMES[STEM_ELEMENT[dayGanIdx]] : '';
  const nayin = ec.getYearNaYin() || '';
  const { yongshen, jishen } = calcYongShenJiShen(dayGanIdx, monthZhiIdx);

  // ---- 神煞 ----
  const shensha = calcShenSha(dayGanIdx, dayZhiIdx, yearZhiIdx);

  // ---- 五行旺衰 ----
  const elementStrength = calcElementStrength(fiveElements, monthZhiIdx);

  // ---- DaYun ----
  let dayunResult: DaYunData | null = null;
  let currentDayunIndex: number | null = null;
  let liunianGanZhi = '';
  let liunianStemIndex = -1;
  let liunianBranchIndex = -1;
  const currentYear = new Date().getFullYear();

  if (gender) {
    const genderCode = gender === 'male' ? 1 : 0;
    const yun = ec.getYun(genderCode, 1);
    const dayuns = yun.getDaYun();

    const periods: DaYunPeriod[] = [];
    for (let i = 1; i < dayuns.length; i++) {
      const dy = dayuns[i];
      const gz = dy.getGanZhi();
      periods.push({
        ganZhi: gz,
        startYear: dy.getStartYear(),
        endYear: dy.getEndYear(),
        startAge: dy.getStartAge(),
        endAge: dy.getEndAge(),
        stemIndex: gz.length >= 2 ? HEAVENLY_STEMS.indexOf(gz[0]) : -1,
        branchIndex: gz.length >= 2 ? EARTHLY_BRANCHES.indexOf(gz[1]) : -1,
      });
      if (currentYear >= dy.getStartYear() && currentYear <= dy.getEndYear()) {
        currentDayunIndex = i - 1;
      }
    }

    dayunResult = {
      startAge: yun.getStartYear(),
      forward: typeof yun.isForward === 'function' ? yun.isForward() : true,
      periods,
    };

    if (currentDayunIndex !== null) {
      const currentDY = dayuns[currentDayunIndex + 1];
      try {
        const lns = currentDY.getLiuNian();
        for (const ln of lns) {
          if (ln.getYear() === currentYear) {
            liunianGanZhi = ln.getGanZhi();
            if (liunianGanZhi.length >= 2) {
              liunianStemIndex = HEAVENLY_STEMS.indexOf(liunianGanZhi[0]);
              liunianBranchIndex = EARTHLY_BRANCHES.indexOf(liunianGanZhi[1]);
            }
            break;
          }
        }
      } catch { /* liunian not available */ }
    }
  }

  const birthThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
  const currentAge = currentYear - birthDate.getFullYear() - (new Date() < birthThisYear ? 1 : 0);

  return {
    bazi: {
      yearPillar, monthPillar, dayPillar, hourPillar,
      fiveElements, elementStrength, dayStemElement, nayin, yongshen, jishen,
      shensha,
    },
    dayun: dayunResult,
    currentDayunIndex,
    liunian: liunianGanZhi,
    liunianStemIndex,
    liunianBranchIndex,
    currentAge,
  };
}
