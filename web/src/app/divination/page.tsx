"use client";

import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

export default function DivinationPage() {
  const router = useRouter();

  return (
    <>
      <div className="min-h-screen px-4 pt-8 pb-28 max-w-lg mx-auto space-y-6 animate-fade-in relative z-10">
        <button onClick={() => router.back()} className="text-xs text-muted hover:text-muted/80 transition-colors font-normal tracking-wider">
          ← 返回
        </button>
        <div className="text-center space-y-5 pt-12">
          <div className="w-16 h-16 mx-auto text-primary/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="w-full h-full">
              <path d="M12 2l2.4 7.2H22l-6.2 4.4 2.4 7.2L12 16.4 5.8 21l2.4-7.2L2 9.2h7.6z" />
            </svg>
          </div>
          <h1 className="text-2xl font-thin tracking-[0.1em] text-foreground/85">AI 占卜</h1>
          <p className="text-xs text-muted/60 font-normal tracking-wider">即将上线，敬请期待</p>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
