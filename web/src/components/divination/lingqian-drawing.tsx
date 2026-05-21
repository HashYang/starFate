"use client";

import { useEffect, useState } from "react";
import type { FortuneStick, LuckLevel } from "@/lib/divination-types";

interface Props {
  onComplete: (stick: FortuneStick) => void;
}

function pickStick(): FortuneStick {
  const levels: LuckLevel[] = ["大吉", "上吉", "中吉", "下下"];
  const weights = [15, 25, 35, 25];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let level: LuckLevel = "中吉";
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) { level = levels[i]; break; }
  }
  const num = Math.floor(Math.random() * 100) + 1;
  return { number: num, level };
}

function levelColor(level: LuckLevel): string {
  switch (level) {
    case "大吉": return "text-warning-red";
    case "上吉": return "text-gold";
    case "中吉": return "text-mystic-blue";
    case "下下": return "text-muted/60";
  }
}

function levelBg(level: LuckLevel): string {
  switch (level) {
    case "大吉": return "bg-warning-red/10 border-warning-red/30";
    case "上吉": return "bg-gold/10 border-gold/30";
    case "中吉": return "bg-mystic-blue/10 border-mystic-blue/30";
    case "下下": return "bg-muted/10 border-muted/30";
  }
}

export default function LingQianDrawing({ onComplete }: Props) {
  const [phase, setPhase] = useState<"shaking" | "revealing" | "done">("shaking");
  const [stick, setStick] = useState<FortuneStick | null>(null);

  useEffect(() => {
    const picked = pickStick();
    setStick(picked);

    const t1 = setTimeout(() => setPhase("revealing"), 1200);
    const t2 = setTimeout(() => {
      setPhase("done");
      setTimeout(() => onComplete(picked), 400);
    }, 1800);

    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8 pt-8">
      <div className="flex items-center justify-center min-h-[240px]">
        {phase === "shaking" && (
          <div className="animate-shake-container text-center">
            {/* Bamboo cylinder */}
            <div className="relative w-24 h-40 mx-auto">
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
                {/* Stick tops visible */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-8 rounded-t-sm ${i % 2 === 0 ? "bg-primary/30" : "bg-primary/20"}`} />
                  ))}
                </div>
                {/* Decorative band */}
                <div className="absolute bottom-4 left-2 right-2 h-2 rounded-full bg-gold/20" />
              </div>
              <p className="text-xs text-muted/50 mt-4 text-center">摇签中...</p>
            </div>
          </div>
        )}

        {phase === "revealing" && stick && (
          <div className="animate-stick-slide-up text-center">
            <div className="inline-block px-8 py-6 rounded-2xl bg-surface/80 backdrop-blur-xl border border-surface-light">
              <p className="text-[10px] text-muted/40 tracking-widest mb-2">签号</p>
              <p className="text-4xl font-thin text-primary">#{stick.number}</p>
            </div>
            <p className="text-xs text-muted/50 mt-3">签文浮现中...</p>
          </div>
        )}

        {phase === "done" && stick && (
          <div className="text-center animate-fade-in">
            <div className="inline-block px-8 py-6 rounded-2xl bg-surface/80 backdrop-blur-xl border border-surface-light mb-4">
              <p className="text-[10px] text-muted/40 tracking-widest mb-2">签号</p>
              <p className="text-4xl font-thin text-primary">#{stick.number}</p>
            </div>
            <div className={`inline-block px-5 py-1.5 rounded-full border ${levelBg(stick.level)} animate-badge-pop`}>
              <span className={`text-sm font-normal tracking-wider ${levelColor(stick.level)}`}>{stick.level}</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted/40 animate-breathe">
        {phase === "shaking" ? "心诚则灵..." : phase === "revealing" ? "签文显现..." : "解读中..."}
      </p>
    </div>
  );
}
