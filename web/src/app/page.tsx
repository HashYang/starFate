"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fortune } from "@/lib/api";
import { BottomNav } from "@/components/bottom-nav";

interface DivineSign {
  ganzhiDate: string;
  signPhrase: string;
  baseTone: string;
  interpretation: string;
  actionGuide: string;
  specificTimeGuide: string;
}

interface FortuneData {
  overallScore: number;
  categories: { name: string; nameCn: string; score: number }[];
  generalAdvice: string;
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
  constellation: string;
  chineseZodiac: string;
  yi: string[];
  ji: string[];
  divineSign: DivineSign | null;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-gold";
  if (score >= 60) return "text-energy-green";
  if (score >= 40) return "text-mystic-blue";
  return "text-muted";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-gold";
  if (score >= 60) return "bg-energy-green";
  if (score >= 40) return "bg-mystic-blue";
  return "bg-muted";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "极佳 · 万事顺遂";
  if (score >= 80) return "上佳 · 诸事皆宜";
  if (score >= 60) return "尚佳 · 小有波动";
  if (score >= 40) return "平平 · 宜静不宜动";
  return "待机 · 蓄势待发";
}

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adviceOpen, setAdviceOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      window.location.href = "/login";
      return;
    }
    loadFortune(userId);
  }, []);

  async function loadFortune(userId: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fortune.daily(userId);
      setData(res);
    } catch (e: any) {
      if (e.status === 404) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.href = "/login";
        return;
      }
      setError(e.message || "获取运势失败");
    }
    setLoading(false);
  }

  function handleRetry() {
    const userId = localStorage.getItem("userId");
    if (userId) loadFortune(userId);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto text-primary/30 animate-float">
            <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
              <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="0.4" opacity="0.12" />
              <path d="M40 72 C28 52, 42 28, 64 28 C86 28, 96 48, 86 66 C78 82, 60 90, 46 86 C34 82, 32 70, 38 60 C44 50, 56 46, 64 49" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
              <circle cx="68" cy="42" r="2.5" fill="currentColor" opacity="0.4" />
            </svg>
          </div>
          <p className="text-muted text-sm font-normal tracking-wider animate-breathe">正在占星中</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="text-center space-y-5">
          <div className="w-12 h-12 mx-auto text-warning-red/50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="w-full h-full">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="text-warning-red text-sm font-normal">{error}</p>
          <Button
            className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-xl px-6 h-10 text-sm font-normal"
            onClick={handleRetry}
          >
            重新获取
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <>
      <div className="min-h-screen px-4 pt-8 pb-28 max-w-lg mx-auto space-y-6 animate-fade-in relative z-10">
        {/* Header — date & zodiac */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted tracking-[0.2em] font-normal">
            ✦ {today} ✦
          </p>
          <p className="text-[11px] text-muted/70 tracking-wider font-normal">
            {data.constellation} · {data.chineseZodiac}
          </p>
        </div>

        {/* Decorative cloud divider */}
        <div className="flex items-center justify-center gap-2">
          <span className="w-6 h-px bg-gradient-to-r from-transparent to-surface-light" />
          <svg className="w-4 h-4 text-muted/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
            <path d="M6 16c0-2 1.5-3 3-3 0-2 2-4 4-4s4 2 4 4c1.5 0 3 1 3 3" strokeLinecap="round" />
            <path d="M10 16c0-1 .5-2 2-2s2 1 2 2" strokeLinecap="round" />
          </svg>
          <span className="w-6 h-px bg-gradient-to-r from-surface-light to-transparent" />
        </div>

        {/* Score Card */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-3xl px-8 pt-8 pb-6 border border-surface-light text-center space-y-4">
          <p className="text-[11px] text-muted tracking-[0.15em] font-normal">今日综合运势</p>
          <div className={`text-7xl font-thin tracking-tight ${scoreColor(data.overallScore)}`}>
            {data.overallScore}
          </div>
          <p className="text-xs text-muted/60 font-normal tracking-wider">
            {scoreLabel(data.overallScore)}
          </p>
          <div className="w-full bg-surface-light rounded-full h-[3px] mt-2">
            <div
              className={`h-[3px] rounded-full transition-all duration-1000 ease-out ${scoreBarColor(data.overallScore)}`}
              style={{ width: `${data.overallScore}%` }}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl px-5 py-5 border border-surface-light space-y-4">
          <h3 className="text-[11px] text-muted tracking-[0.15em] font-normal text-center">
            各方面运势
          </h3>
          <div className="space-y-3.5">
            {data.categories.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-foreground font-normal">{cat.nameCn}</span>
                  <span className={`text-xs font-normal ${scoreColor(cat.score)}`}>{cat.score}</span>
                </div>
                <div className="w-full bg-surface-light rounded-full h-[3px]">
                  <div
                    className={`h-[3px] rounded-full transition-all duration-1000 ease-out ${scoreBarColor(cat.score)}`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lucky Info */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface/80 backdrop-blur-lg rounded-xl py-3.5 border border-surface-light text-center space-y-1">
            <p className="text-[10px] text-muted/70 tracking-wider font-normal">幸运色</p>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.luckyColor }} />
              <span className="text-xs text-foreground/85 font-normal">{data.luckyColor}</span>
            </div>
          </div>
          <div className="bg-surface/80 backdrop-blur-lg rounded-xl py-3.5 border border-surface-light text-center space-y-1">
            <p className="text-[10px] text-muted/70 tracking-wider font-normal">幸运数字</p>
            <p className="text-sm text-foreground/85 font-normal">{data.luckyNumber}</p>
          </div>
          <div className="bg-surface/80 backdrop-blur-lg rounded-xl py-3.5 border border-surface-light text-center space-y-1">
            <p className="text-[10px] text-muted/70 tracking-wider font-normal">幸运方向</p>
            <p className="text-sm text-foreground/85 font-normal">{data.luckyDirection}</p>
          </div>
        </div>

        {/* Yi & Ji */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl py-4 px-4 border border-surface-light space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-energy-green/10 flex items-center justify-center">
                <svg className="w-2 h-2 text-energy-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              <span className="text-xs text-energy-green tracking-wider font-normal">宜</span>
            </div>
            <ul className="space-y-1.5">
              {data.yi.map((item, i) => (
                <li key={i} className="text-xs text-foreground/75 font-normal">· {item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl py-4 px-4 border border-surface-light space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-warning-red/10 flex items-center justify-center">
                <svg className="w-2 h-2 text-warning-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </span>
              <span className="text-xs text-warning-red tracking-wider font-normal">忌</span>
            </div>
            <ul className="space-y-1.5">
              {data.ji.map((item, i) => (
                <li key={i} className="text-xs text-foreground/75 font-normal">· {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Advice — collapsible */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
          <button
            className="w-full px-5 py-3.5 flex justify-between items-center"
            onClick={() => setAdviceOpen(!adviceOpen)}
          >
            <span className="text-xs text-foreground/85 tracking-wider font-normal">每日建议</span>
            <svg
              className={`w-3.5 h-3.5 text-muted/50 transition-transform duration-300 ${adviceOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {adviceOpen && (
            <div className="px-5 pb-4 text-xs text-foreground/75 font-normal leading-relaxed tracking-wider animate-fade-in-fast">
              {data.generalAdvice}
            </div>
          )}
        </div>

        {/* 今日灵签 entry card */}
        <button
          onClick={() => router.push("/daily-sign")}
          className="w-full bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden text-left group transition-all hover:border-primary/20"
        >
          <div className="px-5 py-4 flex items-center gap-4">
            {/* Mini window icon */}
            <div className="w-14 h-14 shrink-0 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 60 60" fill="none" className="w-10 h-10">
                <rect x="5" y="5" width="50" height="50" rx="10" stroke="#c4835a" strokeWidth="0.8" opacity="0.3" fill="none" />
                <path d="M10 35 Q20 25 30 32 Q38 27 45 33 Q50 30 55 35" stroke="#c4835a" strokeWidth="0.6" opacity="0.25" fill="none" />
                <path d="M10 40 Q25 32 35 38 Q42 34 50 40" stroke="#c4835a" strokeWidth="0.5" opacity="0.2" fill="none" />
                <circle cx="45" cy="22" r="5" fill="#c4835a" opacity="0.1" />
                <path d="M20 30 L20 15" stroke="#5a6a4a" strokeWidth="0.8" opacity="0.25" />
                <path d="M20 20 Q14 16 12 20 Q16 17 20 20" fill="#6a7a5a" opacity="0.2" />
                <path d="M20 24 Q16 21 14 24 Q18 22 20 24" fill="#6a7a5a" opacity="0.15" />
              </svg>
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/85 font-normal tracking-wider">今日灵签</p>
              <p className="text-xs text-muted/50 font-normal tracking-wider mt-0.5 line-clamp-1">
                {data.divineSign?.baseTone || "查看今日灵签指引"}
              </p>
            </div>
            <svg className="w-4 h-4 text-muted/30 shrink-0 group-hover:text-primary/40 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </button>
      </div>

      <BottomNav />
    </>
  );
}
