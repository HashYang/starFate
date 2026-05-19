"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fortune } from "@/lib/api";
import { BottomNav } from "@/components/bottom-nav";
import { ChineseWindow } from "@/components/chinese-window";

interface DivineSign {
  ganzhiDate: string;
  signPhrase: string;
  baseTone: string;
  userDayStem: string;
  interpretation: string;
  actionGuide: string;
  specificTimeGuide: string;
}

export default function DailySignPage() {
  const router = useRouter();
  const [sign, setSign] = useState<DivineSign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      window.location.href = "/login";
      return;
    }
    loadSign(userId);
  }, []);

  async function loadSign(userId: string) {
    try {
      const res = await fortune.daily(userId);
      setSign(res.divineSign);
    } catch (e: any) {
      if (e.status === 404) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.href = "/login";
        return;
      }
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto text-primary/30 animate-float">
            <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
              <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="0.4" opacity="0.12" />
              <path d="M40 72 C28 52, 42 28, 64 28 C86 28, 96 48, 86 66 C78 82, 60 90, 46 86 C34 82, 32 70, 38 60 C44 50, 56 46, 64 49" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
              <circle cx="68" cy="42" r="2.5" fill="currentColor" opacity="0.4" />
            </svg>
          </div>
          <p className="text-muted/60 text-sm font-normal tracking-wider animate-breathe">抽取灵签中</p>
        </div>
      </div>
    );
  }

  if (!sign) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="text-center space-y-5">
          <div className="w-12 h-12 mx-auto text-muted/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="w-full h-full">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-muted/50 text-sm font-normal tracking-wider">今日灵签正在生成中</p>
          <button
            className="text-xs text-primary/70 font-normal tracking-wider border border-primary/20 rounded-xl px-5 py-2 bg-primary/5 hover:bg-primary/10 transition-colors"
            onClick={() => { setLoading(true); const uid = localStorage.getItem("userId"); if (uid) loadSign(uid); }}
          >
            重新加载
          </button>
          <div>
            <button
              className="text-xs text-muted/40 font-normal tracking-wider hover:text-muted/60 transition-colors"
              onClick={() => router.push("/")}
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen px-4 pt-8 pb-28 max-w-lg mx-auto animate-fade-in relative z-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="text-xs text-muted/50 hover:text-muted/80 transition-colors font-normal tracking-wider mb-6"
        >
          ← 返回
        </button>

        {/* Ganzhi Date */}
        <div className="text-center mb-6">
          <p className="text-[10px] text-muted/50 tracking-[0.2em] font-normal">
            {sign.ganzhiDate}
          </p>
        </div>

        {/* 花窗 + Landscape */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <ChineseWindow className="w-56 h-56" />
            {/* Glow effect behind window */}
            <div className="absolute inset-0 -z-10 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Decorative cloud divider */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-surface-light" />
          <svg className="w-3.5 h-3.5 text-muted/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
            <path d="M6 16c0-2 1.5-3 3-3 0-2 2-4 4-4s4 2 4 4c1.5 0 3 1 3 3" strokeLinecap="round" />
          </svg>
          <span className="w-8 h-px bg-gradient-to-r from-surface-light to-transparent" />
        </div>

        {/* Sign phrase - main 签语 */}
        <div className="text-center space-y-5 mb-8">
          <p className="text-2xl font-thin tracking-[0.25em] text-foreground/80 leading-relaxed">
            {sign.signPhrase.split(" ").map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="inline-block w-4" />}
                {part}
              </span>
            ))}
          </p>
          <p className="text-sm text-primary/60 font-light tracking-[0.15em]">
            {sign.baseTone}
          </p>
        </div>

        {/* Bazi analysis — user day stem */}
        <div className="text-center mb-4">
          <p className="text-[11px] text-primary/50 tracking-[0.15em] font-normal">
            日主 {sign.userDayStem} · 今日 {sign.ganzhiDate.slice(-3)}
          </p>
        </div>

        {/* Interpretation — multi-section card */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden mb-3">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-[11px] text-muted/60 tracking-[0.15em] font-normal text-center">
              命理解读
            </h3>
          </div>
          <div className="px-5 pb-5 space-y-4">
            {(() => {
              const parts = sign.interpretation.split('\n\n');
              return parts.map((part, i) => {
                if (part.startsWith('▎')) {
                  const sectionName = part.slice(1, 3);
                  const sectionText = part.slice(3);
                  const sectionColors: Record<string, string> = {
                    '事业': 'text-primary/70',
                    '财运': 'text-gold/80',
                    '感情': 'text-warning-red/70',
                    '健康': 'text-energy-green/70',
                  };
                  const sectionIcons: Record<string, string> = {
                    '事业': '⚡',
                    '财运': '💰',
                    '感情': '💕',
                    '健康': '🌿',
                  };
                  return (
                    <div key={i} className="space-y-1.5">
                      <h4 className={`text-xs ${sectionColors[sectionName] || 'text-foreground/70'} font-normal tracking-[0.1em] flex items-center gap-1.5`}>
                        <span>{sectionIcons[sectionName] || '·'}</span>
                        {sectionName}
                      </h4>
                      <p className="text-[13px] text-foreground/75 font-normal leading-relaxed tracking-wider">
                        {sectionText.trim()}
                      </p>
                    </div>
                  );
                }
                // Intro paragraph - merge with first section or show standalone
                if (part.trim()) {
                  return (
                    <p key={i} className="text-[13px] text-foreground/65 font-normal leading-relaxed tracking-wider italic border-b border-surface-light pb-3">
                      {part.trim()}
                    </p>
                  );
                }
                return null;
              });
            })()}
          </div>
        </div>

        {/* Action guide card */}
        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl px-5 py-5 border border-surface-light space-y-3 mb-3">
          <div className="flex items-center gap-2 justify-center">
            <span className="w-4 h-px bg-primary/20" />
            <span className="text-[11px] text-primary/60 tracking-[0.15em] font-normal">行动指引</span>
            <span className="w-4 h-px bg-primary/20" />
          </div>
          <p className="text-sm text-foreground/75 font-normal leading-relaxed tracking-wider">
            {sign.actionGuide}
          </p>
          <div className="bg-primary/5 rounded-xl px-4 py-3 border border-primary/10">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-primary/40 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p className="text-xs text-primary/60 font-normal leading-relaxed tracking-wider">
                {sign.specificTimeGuide}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom brand */}
        <div className="text-center mt-8 mb-4">
          <p className="text-[10px] text-muted/30 tracking-[0.15em] font-light">星命 · 每日灵签</p>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
