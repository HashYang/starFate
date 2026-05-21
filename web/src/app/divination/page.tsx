"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { readings, archive } from "@/lib/api";
import type { ArchiveEntry, ArchivePage, DivinationMode, YaoLine, FortuneStick } from "@/lib/divination-types";
import { scoreColor, scoreBarColor, scoreLabel, relativeTime, suitColor, parseReadingResult } from "@/lib/divination-types";
import LiuYaoDrawing from "@/components/divination/liuyao-drawing";
import LingQianDrawing from "@/components/divination/lingqian-drawing";
import LiuYaoResult from "@/components/divination/liuyao-result";
import LingQianResult from "@/components/divination/lingqian-result";

// ── Types ──

type Step = "ask" | "drawing" | "result" | "history";

// ── Constants ──

const SPREADS = [
  { id: "single", name: "单牌指引", count: 1, desc: "一张牌快速指引" },
  { id: "three", name: "三牌展开", count: 3, desc: "过去-现在-未来" },
  { id: "celtic", name: "凯尔特十字", count: 10, desc: "全面深度分析" },
];

const ATMOSPHERE_TEXT = [
  "正在洗牌...",
  "牌灵正在苏醒...",
  "命运之轮开始转动...",
  "能量正在汇聚...",
  "宇宙在低语...",
];

const MODE_TABS: { key: DivinationMode; label: string }[] = [
  { key: "tarot", label: "塔罗占卜" },
  { key: "liuyao", label: "六爻占卜" },
  { key: "lingqian", label: "灵签占卜" },
];

const HISTORY_TABS: { key: DivinationMode | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "tarot", label: "塔罗" },
  { key: "liuyao", label: "六爻" },
  { key: "lingqian", label: "灵签" },
];

function typeLabel(type: string): string {
  switch (type) {
    case "tarot": return "塔罗占卜";
    case "liuyao": return "六爻占卜";
    case "lingqian": return "灵签占卜";
    default: return type;
  }
}

// ── Card Back SVG ──

function CardBackSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" className={className}>
      <rect x="2" y="2" width="116" height="176" rx="6" fill="#fefcf9" stroke="#e8d0c0" strokeWidth="1.5" />
      <rect x="6" y="6" width="108" height="168" rx="4" fill="none" stroke="#e8d0c0" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="20" fill="none" stroke="#c4835a" strokeWidth="0.5" opacity="0.4" />
      <circle cx="60" cy="60" r="14" fill="none" stroke="#c4835a" strokeWidth="0.3" opacity="0.3" />
      <path d="M60 42 L63 55 L77 55 L66 63 L70 77 L60 68 L50 77 L54 63 L43 55 L57 55 Z" fill="#c4835a" opacity="0.15" />
      <path d="M90 130 A12 12 0 1 0 102 118 A14 14 0 1 1 90 130 Z" fill="#c4835a" opacity="0.12" />
      <circle cx="18" cy="18" r="3" fill="#c4835a" opacity="0.1" />
      <circle cx="102" cy="18" r="3" fill="#c4835a" opacity="0.1" />
      <circle cx="18" cy="162" r="3" fill="#c4835a" opacity="0.1" />
      <circle cx="102" cy="162" r="3" fill="#c4835a" opacity="0.1" />
      <text x="60" y="105" textAnchor="middle" fontSize="8" fill="#c4835a" opacity="0.2" letterSpacing="4">✦ 星 命 ✦</text>
    </svg>
  );
}

// ── Main Component ──

export default function DivinationPage() {
  const router = useRouter();

  // Auth state
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step
  const [step, setStep] = useState<Step>("ask");

  // Mode
  const [mode, setMode] = useState<DivinationMode>("tarot");

  // Ask step
  const [question, setQuestion] = useState("");
  const [selectedSpread, setSelectedSpread] = useState("three");

  // Drawing step (tarot only)
  const [drawProgress, setDrawProgress] = useState(0);
  const [atmosText, setAtmosText] = useState("");
  const drawingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Result step
  const [reading, setReading] = useState<any>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // History step
  const [allHistoryEntries, setAllHistoryEntries] = useState<ArchiveEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<DivinationMode | "all">("all");

  // Global
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  // Auth check on mount
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

  // Clean up drawing timers on unmount
  useEffect(() => {
    return () => drawingTimers.current.forEach(clearTimeout);
  }, []);

  // ── Reset ──

  const handleReset = useCallback(() => {
    setStep("ask");
    setReading(null);
    setQuestion("");
    setExpandedCard(null);
    setDrawProgress(0);
  }, []);

  // ── Ask handlers ──

  const handleStartDivination = useCallback(() => {
    if (!question.trim()) return;
    setError(null);
    setRateLimited(false);
    setStep("drawing");

    if (mode !== "tarot") return;

    // Tarot: sequential card reveal with timers
    setDrawProgress(0);
    const spread = SPREADS.find(s => s.id === selectedSpread)!;
    const interval = spread.id === "celtic" ? 1500 : 1200;
    const totalCards = spread.count;

    // Atmosphere text rotation
    const atmosInterval = setInterval(() => {
      setAtmosText(ATMOSPHERE_TEXT[Math.floor(Math.random() * ATMOSPHERE_TEXT.length)]);
    }, 800);
    setAtmosText("正在洗牌...");

    // Card 0 flips immediately
    const t0 = setTimeout(() => {
      setDrawProgress(1);
    }, 600);

    // Subsequent cards
    const timers: ReturnType<typeof setTimeout>[] = [t0];
    for (let i = 1; i < totalCards; i++) {
      const t = setTimeout(() => {
        setDrawProgress(i + 1);
      }, 600 + i * interval);
      timers.push(t);
    }

    // After last card flips, wait then call API
    const apiTimer = setTimeout(async () => {
      clearInterval(atmosInterval);
      setAtmosText("解读进行中...");
      setLoading(true);

      try {
        const result = await readings.tarot({
          question: question.trim(),
          spreadId: selectedSpread,
          userId: userId!,
        });
        setReading(result);
        setStep("result");
      } catch (e: any) {
        if (e.status === 429) {
          setRateLimited(true);
          setStep("ask");
        } else {
          setError(e.message || "占卜失败，请稍后再试");
        }
      } finally {
        setLoading(false);
      }
    }, 600 + (totalCards - 1) * interval + 800);
    timers.push(apiTimer);

    drawingTimers.current = timers;
  }, [question, selectedSpread, userId, mode]);

  // ── Drawing completion handlers ──

  const handleLiuYaoComplete = useCallback(async (lines: YaoLine[]) => {
    setLoading(true);
    setAtmosText("卦象解读中...");
    try {
      const result = await readings.liuyao({
        question: question.trim(),
        lines,
        userId: userId!,
      });
      setReading(result);
      setStep("result");
    } catch (e: any) {
      if (e.status === 429) {
        setRateLimited(true);
        setStep("ask");
      } else {
        setError(e.message || "占卜失败，请稍后再试");
      }
    } finally {
      setLoading(false);
    }
  }, [question, userId]);

  const handleLingQianComplete = useCallback(async (stick: FortuneStick) => {
    setLoading(true);
    setAtmosText("签文解读中...");
    try {
      const result = await readings.lingqian({
        question: question.trim(),
        stickNumber: stick.number,
        userId: userId!,
      });
      setReading(result);
      setStep("result");
    } catch (e: any) {
      if (e.status === 429) {
        setRateLimited(true);
        setStep("ask");
      } else {
        setError(e.message || "占卜失败，请稍后再试");
      }
    } finally {
      setLoading(false);
    }
  }, [question, userId]);

  // ── History handlers ──

  const loadHistory = useCallback(async (pageNum: number = 1) => {
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const data: ArchivePage = await archive.list(userId, pageNum);
      if (pageNum === 1) {
        setAllHistoryEntries(data.items);
      } else {
        setAllHistoryEntries(prev => [...prev, ...data.items]);
      }
      setHasMoreHistory(data.hasMore);
      setHistoryPage(pageNum);
    } catch (e: any) {
      setError(e.message || "获取历史记录失败");
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  const handleGoToHistory = useCallback(() => {
    setStep("history");
    loadHistory(1);
  }, [loadHistory]);

  // ── Render ──

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-breathe text-muted text-sm tracking-wider">加载中...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen px-4 pt-8 pb-28 max-w-lg mx-auto animate-fade-in relative z-10">
        {/* Error banner */}
        {error && (
          <div className="fixed top-4 left-4 right-4 max-w-lg mx-auto z-50">
            <div className="bg-surface/95 backdrop-blur-xl rounded-2xl border border-warning-red/20 p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-warning-red shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-xs text-foreground/70">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-muted/50 hover:text-muted ml-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step: Ask */}
        {step === "ask" && renderAsk()}

        {/* Step: Drawing */}
        {step === "drawing" && renderDrawing()}

        {/* Step: Result */}
        {step === "result" && reading && renderResult()}

        {/* Step: History */}
        {step === "history" && renderHistory()}

        {/* Overlay loading */}
        {loading && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/60 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto text-primary/30 animate-float">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                  <circle cx="12" cy="5" r="3.5" /><path d="M12 8.5v2" />
                  <path d="M5 16c0-2 3-4 7-4s7 2 7 4" /><path d="M5 19c0-2 3-4 7-4s7 2 7 4" />
                  <path d="M8 21c0-1.5 1.8-3 4-3s4 1.5 4 3" />
                  <circle cx="7" cy="12" r="0.8" fill="currentColor" /><circle cx="17" cy="12" r="0.8" fill="currentColor" />
                </svg>
              </div>
              <p className="text-muted text-sm font-normal tracking-wider animate-breathe">{atmosText || "命运解读中..."}</p>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );

  // ── Ask Screen ──

  function renderAsk() {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto text-primary/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
              <path d="M12 2l2.4 7.2H22l-6.2 4.4 2.4 7.2L12 16.4 5.8 21l2.4-7.2L2 9.2h7.6z" />
            </svg>
          </div>
          <h1 className="text-2xl font-thin tracking-[0.1em] text-foreground/85">AI 占卜</h1>
          <p className="text-xs text-muted/50 font-normal tracking-wider">向命运提问，聆听内心的声音</p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-1 bg-surface-light/50 rounded-2xl p-1">
          {MODE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`flex-1 py-2.5 text-xs tracking-wider rounded-xl transition-all ${
                mode === tab.key
                  ? "bg-surface shadow-sm text-foreground/80"
                  : "text-muted/60 hover:text-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rate limited banner */}
        {rateLimited && (
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light p-5 text-center space-y-3">
            <div className="w-10 h-10 mx-auto text-muted/40">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <p className="text-sm text-muted font-normal">今日占卜次数已用完</p>
            <p className="text-xs text-muted/50">每天免费 3 次占卜，明天再来吧</p>
            <button onClick={handleGoToHistory} className="text-xs text-primary/70 hover:text-primary tracking-wider underline underline-offset-2">
              查看历史记录
            </button>
          </div>
        )}

        {/* Question input */}
        <div>
          <label className="block text-xs text-muted/70 font-normal tracking-wider mb-2.5">你的问题</label>
          <textarea
            className="w-full min-h-[108px] px-4 py-3 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light
              text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40
              transition-colors resize-none"
            placeholder="输入你想占卜的问题..."
            value={question}
            onChange={e => { if (e.target.value.length <= 500) setQuestion(e.target.value); }}
            maxLength={500}
          />
          <p className="text-xs text-muted/30 text-right mt-1">{question.length}/500</p>
        </div>

        {/* Spread selection (tarot only) */}
        {mode === "tarot" && (
          <div>
            <label className="block text-xs text-muted/70 font-normal tracking-wider mb-2.5">选择牌阵</label>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
              {SPREADS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpread(s.id)}
                  className={`shrink-0 w-32 bg-surface/60 backdrop-blur-xl rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    selectedSpread === s.id
                      ? "border-primary/30 bg-primary/5"
                      : "border-surface-light hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-center h-8 mb-2">
                    {renderSpreadIcon(s.id, selectedSpread === s.id)}
                  </div>
                  <p className="text-xs text-foreground/80 font-normal">{s.name}</p>
                  <p className="text-[10px] text-muted/50 mt-0.5">{s.count} 张牌</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleStartDivination}
          disabled={!question.trim()}
          className="w-full h-12 text-sm font-normal tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl disabled:opacity-40 transition-all"
        >
          开始占卜
        </button>
      </div>
    );
  }

  // ── Drawing Screen ──

  function renderDrawing() {
    if (mode === "liuyao") {
      return <LiuYaoDrawing onComplete={handleLiuYaoComplete} />;
    }

    if (mode === "lingqian") {
      return <LingQianDrawing onComplete={handleLingQianComplete} />;
    }

    // Tarot drawing
    const spread = SPREADS.find(s => s.id === selectedSpread)!;
    const totalCards = spread.count;
    const revealedCount = drawProgress;

    const getRotation = (i: number, total: number) => {
      if (total === 1) return "0deg";
      const range = 12;
      const step = range / (total - 1);
      return `${-range / 2 + i * step}deg`;
    };

    return (
      <div className="space-y-8 pt-8">
        <div className="flex items-center justify-center min-h-[220px] relative">
          <div className="relative flex items-center justify-center" style={{ width: totalCards > 3 ? 280 : 240, height: 200 }}>
            {Array.from({ length: totalCards }).map((_, i) => {
              const isRevealed = i < revealedCount;
              const isFlipping = i === revealedCount - 1;
              const isPending = i >= revealedCount;
              const fanRotate = getRotation(i, totalCards);

              return (
                <div
                  key={i}
                  className="absolute perspective-container"
                  style={{
                    transform: `translateX(${(i - (totalCards - 1) / 2) * (totalCards > 3 ? 22 : 32)}px) rotate(${fanRotate})`,
                    zIndex: isRevealed ? i : -i,
                    transition: "transform 0.5s ease-out",
                  }}
                >
                  <div className={`relative ${isFlipping ? "animate-card-flip" : ""}`} style={{ transformStyle: "preserve-3d" }}>
                    <div
                      className={`rounded-xl border overflow-hidden ${
                        isRevealed && !isFlipping ? "hidden" : ""
                      } ${totalCards > 3 ? "w-14 h-20" : totalCards === 1 ? "w-28 h-40" : "w-20 h-28"}`}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <CardBackSVG className={totalCards > 3 ? "w-14 h-20" : totalCards === 1 ? "w-28 h-40" : "w-20 h-28"} />
                    </div>
                    <div
                      className={`absolute inset-0 rounded-xl border border-surface-light bg-surface overflow-hidden ${
                        isRevealed ? "" : "hidden"
                      } ${totalCards > 3 ? "w-14 h-20" : totalCards === 1 ? "w-28 h-40" : "w-20 h-28"}`}
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <div className={`h-full flex flex-col items-center justify-center p-1 ${isPending ? "opacity-0" : "animate-fade-in-fast"}`}>
                        <div className={`text-center ${totalCards > 3 ? "scale-[0.6]" : totalCards === 1 ? "" : "scale-75"}`}>
                          <div className={`text-xs ${suitColor("major")} tracking-wider mb-0.5`}>✦</div>
                          <p className="text-foreground/85 text-xs font-normal leading-tight">塔罗</p>
                          <p className="text-muted/60 text-[10px] mt-0.5">牌 #{i + 1}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalCards }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                i < revealedCount ? "bg-primary/60 w-3" : "bg-surface-light"
              }`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted/50 font-normal tracking-wider animate-breathe">{atmosText}</p>
      </div>
    );
  }

  // ── Result Screen ──

  function renderResult() {
    if (!reading) return null;

    if (mode === "liuyao") {
      return <LiuYaoResult result={reading} onReset={handleReset} onGoToHistory={handleGoToHistory} />;
    }

    if (mode === "lingqian") {
      return <LingQianResult result={reading} onReset={handleReset} onGoToHistory={handleGoToHistory} />;
    }

    // Tarot result
    const { cards, interpretation, advice, score, spreadName, question: q } = reading;

    return (
      <div className="space-y-5">
        <button onClick={() => { setStep("ask"); setReading(null); }} className="text-xs text-muted hover:text-muted/80 transition-colors font-normal tracking-wider">
          ← 返回
        </button>

        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
          <div className="px-6 pt-6 pb-4 text-center">
            <p className="text-[10px] text-muted/50 tracking-[0.15em] mb-3 font-normal">综合运势评分</p>
            <div className={`text-6xl font-thin ${scoreColor(score)}`}>{score}</div>
            <p className={`text-xs mt-1 ${scoreColor(score)}/70 font-normal tracking-wider`}>{scoreLabel(score)}</p>
            <div className="mt-3 h-1 rounded-full bg-surface-light overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[10px] text-muted/40">{spreadName} · 塔罗占卜</span>
            </div>
          </div>
        </div>

        <div className="bg-surface/60 backdrop-blur-md rounded-2xl border border-surface-light px-5 py-3">
          <p className="text-[10px] text-muted/40 tracking-wider mb-1">关于</p>
          <p className="text-xs text-foreground/70 font-normal leading-relaxed tracking-wider">"{q}"</p>
        </div>

        <div>
          <h3 className="text-[10px] text-muted/50 tracking-[0.15em] text-center mb-3 font-normal">抽到的牌</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
            {cards.map((card: any, i: number) => (
              <div key={i} className="shrink-0">
                <button
                  onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                  className={`w-28 bg-surface/70 backdrop-blur-md rounded-xl border p-3 text-left transition-all ${
                    expandedCard === i ? "border-primary/30" : "border-surface-light hover:border-primary/20"
                  }`}
                >
                  <div className={`text-lg ${suitColor(card.suit)} mb-1`}>
                    {card.suit === "major" ? "✦" : card.suit === "cups" ? "♡" : card.suit === "wands" ? "♤" : card.suit === "swords" ? "♧" : "♢"}
                  </div>
                  <p className="text-sm text-foreground/85 font-normal leading-tight">{card.nameCn}</p>
                  <p className={`text-[10px] mt-0.5 font-normal ${card.isReversed ? "text-warning-red/50" : "text-energy-green/60"}`}>
                    {card.isReversed ? "逆位" : "正位"}
                  </p>
                  <p className="text-[10px] text-muted/50 mt-0.5 leading-tight">{card.keyword}</p>
                </button>

                {expandedCard === i && (
                  <div className="mt-2 bg-surface/60 backdrop-blur-md rounded-xl border border-primary/20 p-3 space-y-2 animate-fade-in-fast w-64">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${suitColor(card.suit)}`} />
                      <span className="text-[10px] text-muted/70 tracking-wider">详细解读</span>
                    </div>
                    {[
                      { label: "感情", text: card.isReversed ? "关系需要重新审视" : card.meaningLove },
                      { label: "事业", text: card.isReversed ? "暂缓重大决定" : card.meaningCareer },
                      { label: "财运", text: card.isReversed ? "谨慎投资" : card.meaningWealth },
                    ].map(({ label, text }) => (
                      <div key={label}>
                        <p className="text-[10px] text-primary/60 mb-0.5">▎{label}</p>
                        <p className="text-[11px] text-foreground/65 leading-relaxed tracking-wider">{text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-[10px] text-muted/50 tracking-[0.15em] font-normal text-center">命运解读</h3>
          </div>
          <div className="px-5 pb-5 space-y-4">
            {interpretation.split("\n\n").map((p: string, i: number) => (
              <p key={i} className="text-[13px] text-foreground/75 font-normal leading-relaxed tracking-wider">
                {p}
              </p>
            ))}
          </div>
        </div>

        {advice && (
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-[10px] text-muted/50 tracking-[0.15em] font-normal text-center">星命指引</h3>
            </div>
            <div className="px-5 pb-5">
              <p className="text-sm text-foreground/70 font-normal leading-relaxed tracking-wider">{advice}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={() => { setStep("ask"); setReading(null); setQuestion(""); setExpandedCard(null); }}
            className="w-full h-12 text-sm font-normal tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl transition-all"
          >
            再占一次
          </button>
          <button
            onClick={handleGoToHistory}
            className="w-full h-12 text-sm font-normal tracking-wider bg-surface-light/50 text-muted/70 hover:text-muted border border-surface-light hover:border-muted/20 rounded-2xl transition-all"
          >
            查看历史
          </button>
        </div>
      </div>
    );
  }

  // ── History Screen ──

  function renderHistory() {
    const filteredEntries = historyFilter === "all"
      ? allHistoryEntries
      : allHistoryEntries.filter(e => e.type === historyFilter);

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => { setStep("ask"); setSelectedEntry(null); }} className="text-xs text-muted hover:text-muted/80 transition-colors font-normal tracking-wider">
            ← 返回
          </button>
          <h2 className="text-xs text-muted/60 tracking-wider font-normal">占卜记录</h2>
          <div className="w-10" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-surface-light/50 rounded-xl p-0.5">
          {HISTORY_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setHistoryFilter(tab.key)}
              className={`flex-1 py-2 text-xs tracking-wider rounded-lg transition-all ${
                historyFilter === tab.key
                  ? "bg-surface shadow-sm text-foreground/70"
                  : "text-muted/50 hover:text-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {!historyLoading && filteredEntries.length === 0 && (
          <div className="text-center space-y-5 pt-16">
            <div className="w-16 h-16 mx-auto text-primary/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                <path d="M12 2l2.4 7.2H22l-6.2 4.4 2.4 7.2L12 16.4 5.8 21l2.4-7.2L2 9.2h7.6z" />
              </svg>
            </div>
            <h2 className="text-xl font-thin tracking-[0.1em] text-foreground/85">暂无占卜记录</h2>
            <p className="text-xs text-muted/60 font-normal tracking-wider">开始你的第一次占卜</p>
            <button
              onClick={() => setStep("ask")}
              className="w-full max-w-xs mx-auto h-12 text-sm font-normal tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl transition-all"
            >
              开始占卜
            </button>
          </div>
        )}

        {/* Entry list */}
        <div className="space-y-3">
          {filteredEntries.map(entry => {
            const parsed = parseReadingResult(entry);
            const isOpen = selectedEntry === entry.id;
            let cards: any[] = [];
            try { cards = JSON.parse(entry.cards || "[]"); } catch {}

            return (
              <div key={entry.id}>
                <button
                  onClick={() => setSelectedEntry(isOpen ? null : entry.id)}
                  className={`w-full bg-surface/70 backdrop-blur-xl rounded-2xl border p-4 text-left transition-all ${
                    isOpen ? "border-primary/20" : "border-surface-light hover:border-primary/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground/85 font-normal truncate">{entry.question}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted/50">
                          {entry.type === "tarot" ? (entry.spreadName || "塔罗占卜") : typeLabel(entry.type)}
                        </span>
                        <span className="text-[10px] text-muted/30">·</span>
                        <span className={`text-[10px] font-normal ${scoreColor(parsed.score)}`}>{parsed.score}分</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted/40">{relativeTime(entry.createdAt)}</p>
                      {entry.predictionStatus === "fulfilled" && (
                        <span className="text-[10px] text-energy-green/60">已实现</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="mt-2 bg-surface/60 backdrop-blur-md rounded-2xl border border-surface-light p-4 space-y-4 animate-fade-in-fast">
                    {/* Mini cards (tarot only) */}
                    {entry.type === "tarot" && cards.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto scrollbar-none">
                        {cards.map((card: any, i: number) => (
                          <div key={i} className="shrink-0 w-16 bg-surface/80 rounded-lg border border-surface-light p-2 text-center">
                            <div className={`text-xs ${suitColor(card.suit)}`}>
                              {card.suit === "major" ? "✦" : card.suit === "cups" ? "♡" : card.suit === "wands" ? "♤" : "♧"}
                            </div>
                            <p className="text-[10px] text-foreground/80 mt-0.5">{card.nameCn}</p>
                            <p className={`text-[8px] ${card.isReversed ? "text-warning-red/50" : "text-energy-green/60"}`}>
                              {card.isReversed ? "逆" : "正"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Interpretation */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted/50 tracking-wider">解读</p>
                      <p className="text-[12px] text-foreground/70 leading-relaxed tracking-wider">{parsed.interpretation}</p>
                    </div>
                    {parsed.advice && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted/50 tracking-wider">指引</p>
                        <p className="text-[12px] text-foreground/70 leading-relaxed tracking-wider">{parsed.advice}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Load more */}
        {hasMoreHistory && (
          <button
            onClick={() => loadHistory(historyPage + 1)}
            disabled={historyLoading}
            className="w-full py-3 text-xs text-muted/50 tracking-wider hover:text-muted/70 transition-colors disabled:opacity-40"
          >
            {historyLoading ? "加载中..." : "加载更多"}
          </button>
        )}

        {/* History loading */}
        {historyLoading && filteredEntries.length === 0 && (
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-surface/40 animate-shimmer" />
            ))}
          </div>
        )}
      </div>
    );
  }
}

// ── Spread Icon ──

function renderSpreadIcon(spreadId: string, active: boolean) {
  const color = active ? "text-primary/60" : "text-muted/40";
  const sw = active ? "1.5" : "1";

  if (spreadId === "single") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} className={`w-6 h-6 ${color}`}>
        <rect x="6" y="3" width="12" height="18" rx="1.5" />
        <line x1="10" y1="8" x2="14" y2="8" /><line x1="10" y1="12" x2="14" y2="12" /><line x1="10" y1="16" x2="12" y2="16" />
      </svg>
    );
  }
  if (spreadId === "three") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} className={`w-6 h-6 ${color}`}>
        <rect x="2" y="4" width="6" height="16" rx="1" />
        <rect x="9" y="3" width="6" height="18" rx="1" />
        <rect x="16" y="4" width="6" height="16" rx="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} className={`w-6 h-6 ${color}`}>
      <rect x="7" y="7" width="10" height="14" rx="1" />
      <rect x="10" y="3" width="4" height="6" rx="0.5" />
      <rect x="4" y="10" width="4" height="10" rx="0.5" />
      <rect x="16" y="10" width="4" height="10" rx="0.5" />
      <rect x="10" y="18" width="4" height="4" rx="0.5" />
    </svg>
  );
}
