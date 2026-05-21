"use client";

import type { LingQianReading } from "@/lib/divination-types";
import { scoreColor, scoreBarColor, scoreLabel, luckLevelColor, luckLevelBg } from "@/lib/divination-types";

interface Props {
  result: LingQianReading;
  onReset: () => void;
  onGoToHistory: () => void;
}

export default function LingQianResult({ result, onReset, onGoToHistory }: Props) {
  const { stick, poem, interpretation, advice, score, question } = result;
  const paragraphs = interpretation.split("\n\n").filter(Boolean);
  const poemLines = poem.split("\\n").filter(Boolean);

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
          <p className="text-[10px] text-muted/40 mt-3">灵签占卜</p>
        </div>
      </div>

      {/* Stick display */}
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className="inline-block px-6 py-3 rounded-xl bg-surface/60 border border-surface-light">
            <p className="text-[10px] text-muted/40 tracking-widest mb-1">签号</p>
            <p className="text-3xl font-thin text-primary">#{stick.number}</p>
          </div>
          <div className={`inline-block px-5 py-1.5 rounded-full border ${luckLevelBg(stick.level)} animate-badge-pop`}>
            <span className={`text-sm tracking-wider ${luckLevelColor(stick.level)}`}>{stick.level}</span>
          </div>
          {poemLines.length > 0 && (
            <div className="pt-3 border-t border-surface-light">
              <p className="text-[10px] text-muted/50 tracking-[0.15em] mb-3">签诗</p>
              <div className="space-y-1">
                {poemLines.map((line, i) => (
                  <p key={i} className="text-sm text-foreground/80 font-normal tracking-wider">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light overflow-hidden">
        <div className="p-5">
          <h3 className="text-[10px] text-muted/50 tracking-[0.15em] mb-3 text-center">签文解读</h3>
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
          <h3 className="text-[10px] text-muted/50 tracking-[0.15em] mb-2">慧觉指引</h3>
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
