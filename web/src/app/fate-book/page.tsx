"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { fateBook, archive } from "@/lib/api";

// ===== Types =====

interface FateBookDetails {
  pillarAnalysis?: Record<string, { title: string; text: string }>;
  hiddenStemAnalysis?: Record<string, string>;
  elementAnalysis?: { analysis: string; strongElement: string; weakElement: string; suggestion: string };
  tenGodAnalysis?: { mainCombination: string; careerIndication: string; personalityFromGods: string };
  deepDive?: {
    career: { suitable: string; path: string; timing: string };
    wealth: { pattern: string; timing: string; advice: string };
    love: { pattern: string; timing: string; compatibility: string };
  };
  shenshaAnalysis?: { tianyi: string; wenChang: string; taoHua: string; huaGai: string };
  lifeCurve?: { description: string; peakAge: string; lowAge: string };
  keyYears?: Array<{ year: number; type: string; text: string }>;
  monthlyFortune?: Array<{ month: number; score: number; highlight: string }>;
}

interface BaziData {
  yearPillar: any;
  monthPillar: any;
  dayPillar: any;
  hourPillar: any;
  fiveElements: Record<string, number>;
  elementStrength?: Array<{ element: string; count: number; status: string; isStrong: boolean }>;
  dayStemElement: string;
  nayin: string;
  yongshen: string;
  jishen: string;
  shensha?: { tianyi: string[]; wenChang: string[]; taoHua: string[]; huaGai: string[]; yiMa: string[]; guChen: string[] };
}

interface Dimension {
  name: string;
  score: number;
  level: string;
  description: string;
  advice: string;
}

interface DayunPeriod {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
}

interface DayunInterpretation {
  period: string;
  text: string;
}

interface FateBookData {
  id: string;
  userId: string;
  baziData: BaziData;
  dayunData: { startAge: number; forward: boolean; periods: DayunPeriod[] };
  pattern?: string;
  summary: string;
  personality?: string;
  dimensions: Dimension[];
  dayunInterpretation: DayunInterpretation[];
  liunian: { liunian: string; text: string } | null;
  advice?: string;
  details?: FateBookDetails | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Constants =====

const ELEMENT_COLORS: Record<string, string> = {
  "木": "bg-emerald-400/70",
  "火": "bg-rose-400/70",
  "土": "bg-amber-400/70",
  "金": "bg-stone-300/70",
  "水": "bg-sky-400/70",
};

const ELEMENT_BG: Record<string, string> = {
  "木": "bg-emerald-400/10",
  "火": "bg-rose-400/10",
  "土": "bg-amber-400/10",
  "金": "bg-stone-300/10",
  "水": "bg-sky-400/10",
};

const SHENSHA_INFO: Record<string, { label: string; icon: string; desc: string }> = {
  tianyi: { label: "天乙贵人", icon: "✦", desc: "贵人相助，逢凶化吉" },
  wenChang: { label: "文昌贵人", icon: "✧", desc: "聪明好学，文采出众" },
  taoHua: { label: "桃花", icon: "♡", desc: "人际关系好，异性缘佳" },
  huaGai: { label: "华盖", icon: "◇", desc: "孤独清高，有艺术天赋" },
  yiMa: { label: "驿马", icon: "♢", desc: "奔波变动，适合远方发展" },
  guChen: { label: "孤辰", icon: "△", desc: "独立自强，内心丰富" },
};

const DISHI_NAMES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];

const SECTION_INDICATORS = ["八字排盘", "命格总论", "四柱详解", "专项分析", "大运流年"];

// ===== Page =====

export default function FateBookPage() {
  const router = useRouter();

  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FateBookData | null>(null);
  const [recentDivinations, setRecentDivinations] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [deepDiveTab, setDeepDiveTab] = useState<string>("career");

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const uid = localStorage.getItem("userId");
    if (!token || !uid) {
      router.replace("/login");
      return;
    }
    setUserId(uid);
    setAuthReady(true);
  }, [router]);

  // Fetch data
  useEffect(() => {
    if (!authReady || !userId) return;
    setLoading(true);

    Promise.all([
      fateBook.get(userId).catch(() => null),
      archive.list(userId, 1).catch(() => ({ items: [] })),
    ]).then(([fb, ar]) => {
      if (fb) setData(fb);
      if (ar && ar.items) setRecentDivinations(ar.items.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [authReady, userId]);

  // Generate fate book
  const handleGenerate = async () => {
    if (!userId || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await fateBook.generate(userId);
      setData(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("生成失败，请稍后再试");
    } finally {
      setGenerating(false);
    }
  };

  // Scroll spy for sections
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      let active = 0;
      sectionRefs.current.forEach((ref, i) => {
        if (ref && ref.offsetTop <= scrollY) active = i;
      });
      setActiveSection(active);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data]);

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  };

  // ===== Render =====

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-breathe text-muted text-sm tracking-wider">加载中...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="animate-pulse text-muted/40 text-sm tracking-widest">加载命书...</div>
        </div>
        <BottomNav />
      </>
    );
  }

  // ---- Empty / Generate ----
  if (!data) {
    return (
      <>
        <div className="min-h-screen bg-bg">
          <div className="px-4 pt-16 pb-28 max-w-lg mx-auto space-y-8">
            <div className="text-center space-y-4 pt-8">
              <div className="w-20 h-20 mx-auto text-primary/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="w-full h-full">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-2xl font-thin tracking-[0.15em] text-foreground/85">命书</h1>
              <p className="text-sm text-muted/50 tracking-wider leading-relaxed max-w-xs mx-auto">
                基于你的生辰八字，通过真实算法排盘与 AI 深度解读，生成一份属于你的完整命理报告。
              </p>
            </div>

            <div className="space-y-3 bg-surface/40 rounded-2xl p-5 border border-surface-light/50">
              <div className="flex items-center gap-3 text-xs text-muted/60">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                <span>八字排盘 — 四柱八字/五行旺衰/神煞</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted/60">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                <span>命格总论 — 格局/十神/五行生克</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted/60">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                <span>四柱详解 — 逐柱分析/藏干/地势</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted/60">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                <span>专项分析 — 事业/财运/感情深度解读</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted/60">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                <span>大运流年 — 未来 30 年运势/流月</span>
              </div>
            </div>

            {error && (
              <div className="text-center text-xs text-rose-400/80 bg-rose-400/5 rounded-xl py-2">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 text-sm tracking-widest
                hover:bg-primary/15 disabled:opacity-40 transition-all"
            >
              {generating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  生成中...
                </span>
              ) : (
                "生成我的命书"
              )}
            </button>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  const bazi = data.baziData;
  const details = data.details || {};
  const pillars = [bazi.yearPillar, bazi.monthPillar, bazi.dayPillar, bazi.hourPillar];
  const dims = data.dimensions || [];
  const dayunList = data.dayunData?.periods || [];
  const dayunInterp = data.dayunInterpretation || [];

  const shensha = bazi.shensha;
  const elementStrength = bazi.elementStrength;
  const monthlyFortune = details.monthlyFortune || [];
  const keyYears = details.keyYears || [];
  const deepDive = details.deepDive;

  // Determine current dayun index for highlighting
  const currentYear = new Date().getFullYear();
  const currentDayunIdx = dayunList.findIndex(p => currentYear >= p.startYear && currentYear <= p.endYear);

  return (
    <>
      <div className="min-h-screen bg-bg">
        {/* Sticky section nav */}
        <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-xl border-b border-surface-light/30">
          <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-center gap-4 overflow-x-auto">
            {SECTION_INDICATORS.map((label, i) => (
              <button
                key={label}
                onClick={() => scrollToSection(i)}
                className={`text-xs tracking-widest whitespace-nowrap transition-colors ${
                  activeSection === i
                    ? "text-primary"
                    : "text-muted/40 hover:text-muted/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-28 max-w-lg mx-auto space-y-10">
          {/* ========== Section 1: 八字排盘 ========== */}
          <div ref={(el) => { sectionRefs.current[0] = el; }}>
            <SectionTitle>八字排盘</SectionTitle>

            {/* Four Pillars */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {["年柱", "月柱", "日柱", "时柱"].map((label, i) => {
                const p = pillars[i];
                if (!p) return null;
                return (
                  <div key={label} className="bg-surface/60 rounded-xl border border-surface-light/40 text-center py-3">
                    <div className="text-[10px] text-muted/40 tracking-widest mb-1.5">{label}</div>
                    <div className="text-lg font-light tracking-[0.2em] text-foreground/85">{p.stem}{p.branch}</div>
                    <div className="text-[10px] text-muted/40 mt-1">
                      {p.stemElement} {p.branchElement}
                    </div>
                    <div className="text-[10px] text-muted/30 mt-0.5">
                      {p.tenGodStem}
                    </div>
                    <div className="text-[9px] text-muted/20 mt-0.5">
                      {p.dishi || ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Element Strength Tags */}
            {elementStrength && elementStrength.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {elementStrength.map((es) => (
                  <span
                    key={es.element}
                    className={`text-[10px] px-2 py-0.5 rounded-full tracking-wider ${
                      es.isStrong
                        ? "bg-emerald-400/10 text-emerald-400/70 border border-emerald-400/20"
                        : es.status === "死"
                        ? "bg-rose-400/8 text-rose-400/50 border border-rose-400/15"
                        : "bg-surface/60 text-muted/50 border border-surface-light/30"
                    }`}
                  >
                    {es.element}{es.status}
                  </span>
                ))}
              </div>
            )}

            {/* Five Elements */}
            <div className="bg-surface/40 rounded-2xl p-4 border border-surface-light/30 mb-4">
              <div className="text-xs text-muted/40 tracking-widest mb-3">五行分布</div>
              {Object.entries(bazi.fiveElements).map(([elem, count]) => {
                const strength = elementStrength?.find(es => es.element === elem);
                return (
                  <div key={elem} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="w-6 text-center text-xs">{elem}</span>
                    <div className="flex-1 h-5 rounded-full bg-surface/70 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${ELEMENT_COLORS[elem] || "bg-muted/30"}`}
                        style={{ width: `${Math.min(100, (count / 4) * 100)}%` }}
                      />
                    </div>
                    <span className="w-4 text-right text-xs text-muted/50">{count}</span>
                    {strength && (
                      <span className={`text-[10px] w-6 text-right ${
                        strength.isStrong ? "text-emerald-400/60" : "text-muted/30"
                      }`}>
                        {strength.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Nayin + 日主 + 用神忌神 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-surface/40 rounded-xl border border-surface-light/30 text-center py-3">
                <div className="text-[10px] text-muted/40 tracking-widest mb-1">纳音</div>
                <div className="text-sm text-foreground/80">{bazi.nayin}</div>
              </div>
              <div className="bg-surface/40 rounded-xl border border-surface-light/30 text-center py-3">
                <div className="text-[10px] text-muted/40 tracking-widest mb-1">日主</div>
                <div className="text-sm text-foreground/80">{bazi.dayStemElement}</div>
              </div>
              <div className="bg-surface/40 rounded-xl border border-surface-light/30 text-center py-3">
                <div className="text-[10px] text-muted/40 tracking-widest mb-1">用神</div>
                <div className="text-sm text-emerald-400/90">{bazi.yongshen}</div>
              </div>
            </div>
            <div className="bg-surface/40 rounded-xl border border-surface-light/30 text-center py-3 mb-4">
              <div className="text-[10px] text-muted/40 tracking-widest mb-1">忌神</div>
              <div className="text-sm text-rose-400/70">{bazi.jishen}</div>
            </div>

            {/* 神煞 Cards */}
            {shensha && (
              <div className="bg-surface/40 rounded-2xl p-4 border border-surface-light/30 mb-4">
                <div className="text-xs text-muted/40 tracking-widest mb-3">神煞</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(SHENSHA_INFO).map(([key, info]) => {
                    const values = shensha[key as keyof typeof shensha] as string[] | undefined;
                    if (!values || values.length === 0) return null;
                    return (
                      <div key={key} className="bg-surface/60 rounded-xl p-2.5 text-center border border-surface-light/20">
                        <div className="text-sm mb-0.5">{info.icon}</div>
                        <div className="text-[9px] text-muted/40 tracking-wider">{info.label}</div>
                        <div className="text-[11px] text-foreground/70 font-light tracking-wider mt-0.5">
                          {values.join(' ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dishi Table */}
            {(() => {
              const pillarDishi = [bazi.yearPillar.dishi, bazi.monthPillar.dishi, bazi.dayPillar.dishi, bazi.hourPillar.dishi].filter(Boolean);
              if (pillarDishi.length < 4) return null;
              return (
                <div className="bg-surface/40 rounded-2xl p-4 border border-surface-light/30">
                  <div className="text-xs text-muted/40 tracking-widest mb-3">十二长生 · 地势</div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    {["年柱", "月柱", "日柱", "时柱"].map((label, i) => (
                      <div key={label}>
                        <div className="text-muted/30 mb-1">{label}</div>
                        <div className="text-foreground/70">{pillarDishi[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="border-t border-surface-light/20" />

          {/* ========== Section 2: 命格总论 ========== */}
          <div ref={(el) => { sectionRefs.current[1] = el; }}>
            <SectionTitle>命格总论</SectionTitle>

            {data.pattern && (
              <div className="text-center mb-5">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs tracking-wider text-primary/80">
                  {data.pattern}
                </span>
              </div>
            )}

            {/* Summary */}
            {data.summary && (
              <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mb-4">
                <p className="text-sm text-foreground/70 leading-relaxed tracking-wider whitespace-pre-line">
                  {data.summary}
                </p>
              </div>
            )}

            {/* Personality */}
            {data.personality && (
              <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mb-6">
                <div className="text-xs text-muted/40 tracking-widest mb-3">性格画像</div>
                <p className="text-sm text-foreground/70 leading-relaxed tracking-wider whitespace-pre-line">
                  {data.personality}
                </p>
              </div>
            )}

            {/* TenGod Analysis */}
            {details.tenGodAnalysis && (
              <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mb-4">
                <div className="text-xs text-primary/50 tracking-widest mb-3">十神组合</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-muted/40 tracking-wider mb-1">格局</div>
                    <p className="text-sm text-foreground/70 leading-relaxed">{details.tenGodAnalysis.mainCombination}</p>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted/40 tracking-wider mb-1">事业特征</div>
                    <p className="text-sm text-foreground/70 leading-relaxed">{details.tenGodAnalysis.careerIndication}</p>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted/40 tracking-wider mb-1">性格体现</div>
                    <p className="text-sm text-foreground/70 leading-relaxed">{details.tenGodAnalysis.personalityFromGods}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Element Analysis */}
            {details.elementAnalysis && (
              <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mb-6">
                <div className="text-xs text-amber-400/50 tracking-widest mb-3">五行生克</div>
                <p className="text-sm text-foreground/70 leading-relaxed tracking-wider mb-3">
                  {details.elementAnalysis.analysis}
                </p>
                <div className="flex flex-wrap gap-3 text-[11px]">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400/70 border border-emerald-400/15">
                    最旺: {details.elementAnalysis.strongElement}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-rose-400/8 text-rose-400/60 border border-rose-400/15">
                    最弱: {details.elementAnalysis.weakElement}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-sky-400/8 text-sky-400/60 border border-sky-400/15">
                    {details.elementAnalysis.suggestion}
                  </span>
                </div>
              </div>
            )}

            {/* 4 Dimension Cards */}
            <div className="grid grid-cols-2 gap-3">
              {dims.map((d) => (
                <DimensionCard key={d.name} dim={d} />
              ))}
            </div>
          </div>

          <div className="border-t border-surface-light/20" />

          {/* ========== Section 3: 四柱详解 ========== */}
          <div ref={(el) => { sectionRefs.current[2] = el; }}>
            <SectionTitle>四柱详解</SectionTitle>

            <div className="space-y-3">
              {["年柱", "月柱", "日柱", "时柱"].map((label, i) => {
                const p = pillars[i];
                if (!p) return null;
                const pillarKey = label === "年柱" ? "year" : label === "月柱" ? "month" : label === "日柱" ? "day" : "hour";
                const pillarAnalysis = details.pillarAnalysis?.[pillarKey];
                const hiddenStemText = details.hiddenStemAnalysis?.[pillarKey];
                const isExpanded = expandedPillar === pillarKey;

                return (
                  <div
                    key={pillarKey}
                    className="bg-surface/40 rounded-2xl border border-surface-light/30 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedPillar(isExpanded ? null : pillarKey)}
                      className="w-full flex items-center gap-4 p-4 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-sm font-light text-primary/70">
                        {p.stem}{p.branch}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted/40 tracking-widest">{label}</div>
                        <div className="text-xs text-muted/50 mt-0.5 truncate">
                          {p.stemElement}{p.branchElement} · {p.tenGodStem} · {p.dishi}
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-muted/30 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-surface-light/20 pt-3">
                        {/* Basic data */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-surface/50 rounded-lg p-2">
                            <span className="text-muted/40">天干 </span>
                            <span className="text-foreground/70">{p.stem}</span>
                            <span className="text-muted/30 ml-1">({p.stemElement})</span>
                          </div>
                          <div className="bg-surface/50 rounded-lg p-2">
                            <span className="text-muted/40">地支 </span>
                            <span className="text-foreground/70">{p.branch}</span>
                            <span className="text-muted/30 ml-1">({p.branchElement})</span>
                          </div>
                          <div className="bg-surface/50 rounded-lg p-2">
                            <span className="text-muted/40">十神 </span>
                            <span className="text-foreground/70">{i === 2 ? "日主" : p.tenGodStem}</span>
                          </div>
                          <div className="bg-surface/50 rounded-lg p-2">
                            <span className="text-muted/40">地势 </span>
                            <span className="text-foreground/70">{p.dishi || "-"}</span>
                          </div>
                          <div className="bg-surface/50 rounded-lg p-2 col-span-2">
                            <span className="text-muted/40">藏干 </span>
                            <span className="text-foreground/70">
                              {p.hiddenStems && p.hiddenStems.length > 0
                                ? p.hiddenStems.join("、")
                                : "无"
                              }
                            </span>
                          </div>
                        </div>

                        {/* AI pillar analysis */}
                        {pillarAnalysis && (
                          <div>
                            <div className="text-[11px] text-primary/50 tracking-wider mb-1">{pillarAnalysis.title}</div>
                            <p className="text-xs text-foreground/60 leading-relaxed">{pillarAnalysis.text}</p>
                          </div>
                        )}

                        {/* Hidden stem analysis */}
                        {hiddenStemText && (
                          <div>
                            <div className="text-[11px] text-amber-400/50 tracking-wider mb-1">藏干分析</div>
                            <p className="text-xs text-foreground/60 leading-relaxed">{hiddenStemText}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-surface-light/20" />

          {/* ========== Section 4: 专项分析 ========== */}
          <div ref={(el) => { sectionRefs.current[3] = el; }}>
            <SectionTitle>专项深度分析</SectionTitle>

            {deepDive ? (
              <>
                {/* Tabs */}
                <div className="flex gap-1 bg-surface/60 rounded-xl p-1 mb-4 border border-surface-light/30">
                  {[
                    { key: "career", label: "事业" },
                    { key: "wealth", label: "财运" },
                    { key: "love", label: "感情" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setDeepDiveTab(tab.key)}
                      className={`flex-1 py-2 text-xs tracking-wider rounded-lg transition-all ${
                        deepDiveTab === tab.key
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted/40 hover:text-muted/70"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {deepDiveTab === "career" && deepDive.career && (
                  <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">💼</span>
                      <span className="text-xs text-muted/40 tracking-widest">事业运势</span>
                    </div>
                    <div className="space-y-3">
                      <DetailRow label="适合行业" text={deepDive.career.suitable} />
                      <DetailRow label="发展路径" text={deepDive.career.path} />
                      <DetailRow label="黄金期" text={deepDive.career.timing} />
                    </div>
                  </div>
                )}

                {deepDiveTab === "wealth" && deepDive.wealth && (
                  <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">💰</span>
                      <span className="text-xs text-muted/40 tracking-widest">财运分析</span>
                    </div>
                    <div className="space-y-3">
                      <DetailRow label="财运类型" text={deepDive.wealth.pattern} />
                      <DetailRow label="财运周期" text={deepDive.wealth.timing} />
                      <DetailRow label="理财建议" text={deepDive.wealth.advice} />
                    </div>
                  </div>
                )}

                {deepDiveTab === "love" && deepDive.love && (
                  <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">❤️</span>
                      <span className="text-xs text-muted/40 tracking-widest">感情运势</span>
                    </div>
                    <div className="space-y-3">
                      <DetailRow label="感情模式" text={deepDive.love.pattern} />
                      <DetailRow label="婚恋时机" text={deepDive.love.timing} />
                      <DetailRow label="适合类型" text={deepDive.love.compatibility} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-surface/40 rounded-2xl p-8 border border-surface-light/30 text-center">
                <div className="text-xs text-muted/30 tracking-wider">暂无数据</div>
              </div>
            )}
          </div>

          <div className="border-t border-surface-light/20" />

          {/* ========== Section 5: 大运流年 ========== */}
          <div ref={(el) => { sectionRefs.current[4] = el; }}>
            <SectionTitle>大运流年</SectionTitle>

            {/* Dayun Timeline */}
            {dayunList.length > 0 && (
              <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mb-5">
                <div className="text-xs text-muted/40 tracking-widest mb-4">大运走势</div>
                <div className="space-y-1">
                  {dayunList.map((p, i) => {
                    const isCurrent = i === currentDayunIdx;
                    return (
                      <div key={i} className={`flex items-center gap-3 text-xs py-0.5 ${isCurrent ? "bg-primary/5 -mx-3 px-3 rounded-lg" : ""}`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isCurrent ? "bg-primary shadow-sm shadow-primary/30" : "bg-surface-light"}`} />
                        <span className={`w-20 tracking-wider ${isCurrent ? "text-foreground/85 font-medium" : "text-muted/50"}`}>
                          {p.ganZhi}
                        </span>
                        <span className={`${isCurrent ? "text-foreground/60" : "text-muted/30"}`}>
                          {p.startAge}-{p.endAge}岁
                        </span>
                        <span className={`text-[10px] ${isCurrent ? "text-foreground/50" : "text-muted/20"}`}>
                          {p.startYear}-{p.endYear}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Life Curve */}
            {details.lifeCurve && (
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl p-5 border border-primary/10 mb-5">
                <div className="text-xs text-primary/50 tracking-widest mb-3">一生运势曲线</div>
                <p className="text-sm text-foreground/70 leading-relaxed tracking-wider mb-3">
                  {details.lifeCurve.description}
                </p>
                <div className="flex gap-3 text-[11px]">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400/70">
                    ↑ 高峰 {details.lifeCurve.peakAge}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400/70">
                    ↓ 低谷 {details.lifeCurve.lowAge}
                  </span>
                </div>
              </div>
            )}

            {/* Key Years */}
            {keyYears.length > 0 && (
              <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mb-5">
                <div className="text-xs text-muted/40 tracking-widest mb-3">关键年份</div>
                <div className="space-y-2">
                  {keyYears.map((ky, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`text-xs font-mono w-14 shrink-0 pt-0.5 ${
                        ky.type === "换运" ? "text-amber-400/70" : "text-primary/60"
                      }`}>
                        {ky.year}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                        ky.type === "换运" ? "bg-amber-400/10 text-amber-400/60" :
                        ky.type === "流年" ? "bg-primary/8 text-primary/60" :
                        "bg-surface/60 text-muted/50"
                      }`}>
                        {ky.type}
                      </span>
                      <span className="text-xs text-foreground/60 leading-relaxed">{ky.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Fortune Grid */}
            {monthlyFortune.length === 12 && (
              <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mb-5">
                <div className="text-xs text-muted/40 tracking-widest mb-3">流月运势 · {new Date().getFullYear()}</div>
                <div className="grid grid-cols-4 gap-2">
                  {monthlyFortune.map((mf) => {
                    const scoreColor =
                      mf.score >= 70 ? "text-emerald-400/70" :
                      mf.score >= 50 ? "text-amber-400/70" :
                      "text-rose-400/60";
                    const barColor =
                      mf.score >= 70 ? "bg-emerald-400/40" :
                      mf.score >= 50 ? "bg-amber-400/40" :
                      "bg-rose-400/30";
                    return (
                      <div key={mf.month} className="bg-surface/60 rounded-xl p-2 border border-surface-light/20 text-center">
                        <div className="text-[9px] text-muted/30 tracking-wider mb-1">{mf.month}月</div>
                        <div className={`text-xs font-light ${scoreColor}`}>{mf.score}</div>
                        <div className="h-1 rounded-full bg-surface/70 mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${mf.score}%` }} />
                        </div>
                        <div className="text-[8px] text-muted/30 mt-1 leading-tight line-clamp-2">{mf.highlight}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dayun Interpretations */}
            {dayunInterp.map((di, i) => (
              <div key={i} className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mb-3">
                <div className="text-xs text-primary/60 tracking-wider mb-2">{di.period}</div>
                <p className="text-sm text-foreground/70 leading-relaxed tracking-wider">
                  {di.text}
                </p>
              </div>
            ))}

            {/* Liunian */}
            {data.liunian && (
              <div className="bg-surface/40 rounded-2xl p-5 border border-surface-light/30 mt-5">
                <div className="text-xs text-muted/40 tracking-widest mb-1">当前流年</div>
                <div className="text-lg font-light tracking-[0.2em] text-foreground/85 mb-2">
                  {data.liunian.liunian}
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed tracking-wider whitespace-pre-line">
                  {data.liunian.text}
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          {recentDivinations.length > 0 && <div className="border-t border-surface-light/20" />}

          {/* ===== 占卜关联 ===== */}
          {recentDivinations.length > 0 && (
            <div>
              <SectionTitle>占卜关联</SectionTitle>
              <div className="space-y-2">
                {recentDivinations.map((item: any, i: number) => {
                  const typeLabel = item.type === "tarot" ? "塔罗" : item.type === "liuyao" ? "六爻" : item.type === "lingqian" ? "灵签" : item.type;
                  return (
                    <div key={item.id || i} className="bg-surface/40 rounded-xl p-4 border border-surface-light/30 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center text-xs text-primary/60">
                        {item.type === "tarot" ? "🃏" : item.type === "liuyao" ? "☰" : "🔮"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted/50 tracking-wider mb-0.5">{typeLabel}</div>
                        <div className="text-sm text-foreground/70 truncate">{item.question || "占卜"}</div>
                      </div>
                      <div className="text-[10px] text-muted/30 shrink-0">
                        {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== 人生建议 ========== */}
          <div>
            <SectionTitle>人生建议</SectionTitle>

            {/* Shensha Guidance */}
            {details.shenshaAnalysis && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                {details.shenshaAnalysis.tianyi && (
                  <div className="bg-surface/40 rounded-xl p-4 border border-surface-light/30">
                    <div className="text-xs text-muted/40 tracking-widest mb-1">✦ 天乙贵人</div>
                    <p className="text-[11px] text-foreground/60 leading-relaxed">{details.shenshaAnalysis.tianyi}</p>
                  </div>
                )}
                {details.shenshaAnalysis.wenChang && (
                  <div className="bg-surface/40 rounded-xl p-4 border border-surface-light/30">
                    <div className="text-xs text-muted/40 tracking-widest mb-1">✧ 文昌贵人</div>
                    <p className="text-[11px] text-foreground/60 leading-relaxed">{details.shenshaAnalysis.wenChang}</p>
                  </div>
                )}
                {details.shenshaAnalysis.taoHua && (
                  <div className="bg-surface/40 rounded-xl p-4 border border-surface-light/30">
                    <div className="text-xs text-muted/40 tracking-widest mb-1">♡ 桃花</div>
                    <p className="text-[11px] text-foreground/60 leading-relaxed">{details.shenshaAnalysis.taoHua}</p>
                  </div>
                )}
                {details.shenshaAnalysis.huaGai && (
                  <div className="bg-surface/40 rounded-xl p-4 border border-surface-light/30">
                    <div className="text-xs text-muted/40 tracking-widest mb-1">◇ 华盖</div>
                    <p className="text-[11px] text-foreground/60 leading-relaxed">{details.shenshaAnalysis.huaGai}</p>
                  </div>
                )}
              </div>
            )}

            {/* Advice */}
            {data.advice && (
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl p-5 border border-primary/10">
                <div className="text-xs text-primary/50 tracking-widest mb-3">综合建议</div>
                <p className="text-sm text-foreground/70 leading-relaxed tracking-wider italic">
                  {data.advice}
                </p>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <div className="text-center pb-8">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2.5 rounded-xl bg-surface/60 border border-surface-light/40 text-xs text-muted/50 tracking-wider
                hover:text-muted/70 hover:bg-surface/80 transition-all disabled:opacity-40"
            >
              {generating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-muted/30 border-t-muted/70 animate-spin" />
                  刷新中
                </span>
              ) : (
                "刷新命书"
              )}
            </button>
            <div className="text-[10px] text-muted/20 tracking-widest mt-2">
              版本 {data.version}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

// ===== Sub-components =====

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-base font-light tracking-[0.15em] text-foreground/80 mb-5">
      {children}
    </h2>
  );
}

function DimensionCard({ dim }: { dim: Dimension }) {
  const scoreColor =
    dim.score >= 80 ? "text-emerald-400/90" :
    dim.score >= 60 ? "text-amber-400/80" :
    "text-rose-400/70";

  const levelColor =
    dim.level === "上等" ? "bg-emerald-400/10 text-emerald-400/70" :
    dim.level === "中等" ? "bg-amber-400/10 text-amber-400/70" :
    "bg-rose-400/10 text-rose-400/70";

  return (
    <div className="bg-surface/40 rounded-2xl p-4 border border-surface-light/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted/50 tracking-wider">{dim.name}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full tracking-wider ${levelColor}`}>
          {dim.level}
        </span>
      </div>
      <div className={`text-2xl font-light tracking-wider mb-2 ${scoreColor}`}>
        {dim.score}
      </div>
      <p className="text-xs text-foreground/60 leading-relaxed tracking-wider mb-2">
        {dim.description}
      </p>
      {dim.advice && (
        <p className="text-[11px] text-muted/40 leading-relaxed tracking-wider">
          💡 {dim.advice}
        </p>
      )}
    </div>
  );
}

function DetailRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted/40 tracking-wider mb-1">{label}</div>
      <p className="text-sm text-foreground/70 leading-relaxed">{text}</p>
    </div>
  );
}
