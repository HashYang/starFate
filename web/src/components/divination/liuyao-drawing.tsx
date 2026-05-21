"use client";

import { useEffect, useState, useRef } from "react";
import type { YaoLine } from "@/lib/divination-types";

interface Props {
  onComplete: (lines: YaoLine[]) => void;
}

function tossOne(): YaoLine {
  return {
    value: Math.random() < 0.5 ? 0 : 1,
    moving: Math.random() < 1 / 6,
  };
}

export default function LiuYaoDrawing({ onComplete }: Props) {
  const [lines, setLines] = useState<YaoLine[]>([]);
  const [currentToss, setCurrentToss] = useState(0);
  const [phase, setPhase] = useState<"spinning" | "landed">("spinning");
  const [latestResult, setLatestResult] = useState<YaoLine | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    let cancelled = false;
    const accumulated: YaoLine[] = [];

    const runToss = (index: number) => {
      if (cancelled) return;
      const result = tossOne();
      accumulated.push(result);
      setLatestResult(result);
      setPhase("spinning");

      setTimeout(() => {
        if (cancelled) return;
        setPhase("landed");
        setLines(prev => [...prev, result]);
        setCurrentToss(index + 1);

        if (index + 1 >= 6) {
          doneRef.current = true;
          setTimeout(() => onComplete(accumulated), 600);
        } else {
          setTimeout(() => runToss(index + 1), 800);
        }
      }, 800);
    };

    runToss(0);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center">
        <p className="text-xs text-muted/50 tracking-widest mb-4">第 {Math.min(currentToss + 1, 6)} / 6 爻</p>
      </div>

      {/* Coin toss animation */}
      <div className="flex items-center justify-center h-24">
        {phase === "spinning" && (
          <div className="w-16 h-16 rounded-full bg-surface/80 border-2 border-primary/30 flex items-center justify-center animate-coin-spin">
            <span className="text-xl text-primary/50">⚊</span>
          </div>
        )}
        {phase === "landed" && latestResult && (
          <div className={`animate-line-appear text-center ${latestResult.moving ? "animate-moving-glow" : ""}`}>
            <div className="text-3xl mb-1">{latestResult.value === 1 ? "⚊" : "⚋"}</div>
            <p className="text-xs text-muted/60">
              {latestResult.value === 1 ? "阳" : "阴"}
              {latestResult.moving && " (动爻)"}
            </p>
          </div>
        )}
      </div>

      {/* Lines stack */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[10px] text-muted/40 tracking-widest mb-1">卦象</p>
        {[5, 4, 3, 2, 1, 0].map(pos => {
          const line = lines[pos];
          return (
            <div key={pos} className="flex items-center gap-2">
              {line ? (
                <>
                  <span className={`text-sm ${line.value === 1 ? "text-primary" : "text-mystic-blue"} ${line.moving ? "animate-moving-glow" : ""}`}>
                    {line.value === 1 ? "━━━━━" : "━━  ━━"}
                  </span>
                  {line.moving && <span className="text-xs text-warning-red">{line.value === 1 ? "○" : "✕"}</span>}
                </>
              ) : (
                <span className="text-sm text-muted/20 tracking-[0.5em]">······</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted/40">
        {currentToss < 6 ? `第 ${currentToss + 1} 次掷爻...` : "卦象已成，解读中..."}
      </p>
    </div>
  );
}
