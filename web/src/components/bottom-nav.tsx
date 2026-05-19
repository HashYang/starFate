"use client";

import { useRouter, usePathname } from "next/navigation";

function HomeIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg className={`w-5 h-5 ${active ? "text-primary" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    </svg>
  );
}

function StarIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg className={`w-5 h-5 ${active ? "text-primary" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2H22l-6.2 4.4 2.4 7.2L12 16.4 5.8 21l2.4-7.2L2 9.2h7.6z" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg className={`w-5 h-5 ${active ? "text-primary" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg className={`w-5 h-5 ${active ? "text-primary" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg className={`w-5 h-5 ${active ? "text-primary" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

const tabs = [
  { label: "首页", path: "/", icon: HomeIcon },
  { label: "占卜", path: "/divination", icon: StarIcon },
  { label: "对话", path: "/chat", icon: ChatIcon },
  { label: "命书", path: "/fate-book", icon: BookIcon },
  { label: "我的", path: "/profile", icon: PersonIcon },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/85 backdrop-blur-xl border-t border-surface-light z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-14 py-1 transition-colors"
            >
              <tab.icon active={isActive} />
              <span
                className={`text-[10px] tracking-widest ${
                  isActive ? "text-primary font-medium" : "text-muted font-normal"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
