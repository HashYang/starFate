"use client";

import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

export default function ChatPage() {
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
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-thin tracking-[0.1em] text-foreground/85">AI 对话</h1>
          <p className="text-xs text-muted/60 font-normal tracking-wider">即将上线，敬请期待</p>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
