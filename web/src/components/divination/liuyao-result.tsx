"use client";

import { useState } from "react";
import type { LiuYaoReading } from "@/lib/divination-types";
import { scoreColor, scoreBarColor, scoreLabel } from "@/lib/divination-types";

interface Props {
  result: LiuYaoReading;
  onReset: () => void;
  onGoToHistory: () => void;
}

export default function LiuYaoResult({ result, onReset, onGoToHistory }: Props) {
  const { hexagram, interpretation, advice, score, question } = result;
  const [expanded, setExpanded] = useState(false);
  const paragraphs = interpretation.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={onReset} className="text-xs text-muted hover:text-muted/80 transition-colors tracking-wider">
        ← 返回
      </button>

      {/* Score */}
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
        <div className="px-6 pt-6 pb-4 text-center">
          <p className="text-[10px] text-muted/50 tracking-[0.15em] mb-3">综合运势评分</p>
          <div className={`text-6xl font-thin ${scoreColor(score)}`}>{score}</div>
          <p className={`text-xs mt-1 ${scoreColor(score)}/70 tracking-wider`}>{scoreLabel(score)}</p>
          <div className="mt-3 h-1 rounded-full bg-surface-light overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
          </div>
          <p className="text-[10px] text-muted/40 mt-3">六爻占卜</p>
        </div>
      </div>

      {/* Question */}
      <div className="bg-surface/60 backdrop-blur-md rounded-2xl border border-surface-light px-5 py-3">
        <p className="text-[10px] text-muted/40 tracking-wider mb-1">关于</p>
        <p className="text-xs text-foreground/70 leading-relaxed tracking-wider">"{question}"</p>
      </div>

      {/* Hexagram */}
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
        <div className="p-5 text-center">
          <p className="text-[10px] text-muted/50 tracking-[0.15em] mb-3">本卦</p>
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="text-lg text-muted/50">{hexagram.lowerTrigram.symbol}</div>
            <div className="text-2xl text-muted/30">→</div>
            <div className="text-lg text-muted/50">{hexagram.upperTrigram.symbol}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            {[...hexagram.lines].reverse().map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`text-base ${line.value === 1 ? "text-primary" : "text-mystic-blue"} ${line.moving ? "animate-moving-glow" : ""}`}>
                  {line.value === 1 ? "━━━━━" : "━━  ━━"}
                </span>
                {line.moving && <span className="text-xs text-warning-red">{line.value === 1 ? "○" : "✕"}</span>}
              </div>
            ))}
          </div>
          <p className="text-sm text-foreground/80 mt-2">{hexagram.hexagramName}（第{hexagram.hexagramNumber}卦）</p>
          <p className="text-xs text-muted/50">
            {hexagram.lowerTrigram.name}（{hexagram.lowerTrigram.attribute}）→ {hexagram.upperTrigram.name}（{hexagram.upperTrigram.attribute}）
          </p>
          {hexagram.lines.some(l => l.moving) && (
            <p className="text-xs text-warning-red/70 mt-2">
              动爻: 第{hexagram.lines.map((l, i) => l.moving ? i + 1 : -1).filter(i => i > 0).join("、")}爻
            </p>
          )}
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
        <div className="p-5">
          <h3 className="text-[10px] text-muted/50 tracking-[0.15em] mb-3 text-center">卦象解读</h3>
          <div className="space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-xs text-foreground/70 leading-relaxed">{p}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Advice */}
      {advice && (
        <div className="bg-surface/60 backdrop-blur-md rounded-2xl border border-surface-light px-5 py-4">
          <h3 className="text-[10px] text-muted/50 tracking-[0.15em] mb-2">星命指引</h3>
          <p className="text-xs text-foreground/70 leading-relaxed">{advice}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={onReset} className="flex-1 h-11 text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl transition-all">
          再占一次
        </button>
        <button onClick={onGoToHistory} className="flex-1 h-11 text-sm bg-surface/70 text-muted border border-surface-light hover:text-foreground/70 rounded-2xl transition-all">
          查看历史
        </button>
      </div>
    </div>
  );
}
