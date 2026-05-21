declare module 'lunar-javascript' {
  export class Solar {
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    getEightChar(): EightChar;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
  }

  export class EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYearHideGan(): string[];
    getMonthHideGan(): string[];
    getDayHideGan(): string[];
    getTimeHideGan(): string[];
    getYearWuXing(): string;
    getMonthWuXing(): string;
    getDayWuXing(): string;
    getTimeWuXing(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonthShiShenGan(): string;
    getMonthShiShenZhi(): string[];
    getDayShiShenGan(): string;
    getDayShiShenZhi(): string[];
    getTimeShiShenGan(): string;
    getTimeShiShenZhi(): string[];
    getYearDiShi(): string;
    getMonthDiShi(): string;
    getDayDiShi(): string;
    getTimeDiShi(): string;
    getYearXun(): string;
    getMonthXun(): string;
    getDayXun(): string;
    getTimeXun(): string;
    getYearXunKong(): string;
    getMonthXunKong(): string;
    getDayXunKong(): string;
    getTimeXunKong(): string;
    getTaiYuan(): string;
    getTaiYuanNaYin(): string;
    getTaiXi(): string;
    getTaiXiNaYin(): string;
    getMingGong(): string;
    getMingGongNaYin(): string;
    getShenGong(): string;
    getShenGongNaYin(): string;
    getDayGanIndex(): number;
    getDayZhiIndex(): number;
    getYun(gender: number, sect: number): Yun;
    getLunar(): Lunar;
    getShengXiao(): string;
    getGanZhi(): string;
  }

  export class Yun {
    getGender(): number;
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartHour(): number;
    isForward(): boolean;
    getDaYun(): DaYun[];
    getLunar(): Lunar;
    getStartSolar(): Solar;
  }

  export class DaYun {
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
    getGanZhi(): string;
    getXun(): string;
    getXunKong(): string;
    getIndex(): number;
    getLiuNian(): LiuNian[];
    getLunar(): Lunar;
  }

  export class LiuNian {
    getYear(): number;
    getAge(): number;
    getGanZhi(): string;
    getXun(): string;
    getXunKong(): string;
    getIndex(): number;
    getLunar(): Lunar;
  }
}
