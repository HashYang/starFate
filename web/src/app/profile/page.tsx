"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { DragonLogo } from "@/components/dragon-logo";
import { user as userApi } from "@/lib/api";

type AuthProvider = "legacy" | "email" | "google" | "apple";

const PROVIDER_LABELS: Record<AuthProvider, string> = {
  legacy: "旧版账号",
  email: "邮箱",
  google: "Google",
  apple: "Apple",
};

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<AuthProvider>("legacy");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      window.location.href = "/login";
      return;
    }
    setNickname(localStorage.getItem("nickname") || "用户");

    // Fetch full profile
    userApi.profile(userId).then((data) => {
      setNickname(data.nickname);
      setEmail(data.email || null);
      setAuthProvider(data.authProvider || "legacy");
    }).catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("nickname");
    router.push("/login");
  }

  return (
    <>
      <div className="min-h-screen px-4 pt-12 pb-28 max-w-lg mx-auto space-y-8 animate-fade-in relative z-10">
        <div className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <DragonLogo size={80} className="text-primary/30" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-thin tracking-[0.1em] text-foreground/70">{nickname}</h1>
            <p className="text-xs text-muted/60 font-normal tracking-wider">个人中心</p>
          </div>
        </div>

        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-light divide-y divide-surface-light">
          {email && (
            <div className="px-5 py-4">
              <p className="text-xs text-muted/50 font-normal tracking-wider mb-1">邮箱</p>
              <p className="text-sm text-foreground/85 font-normal tracking-wider">{email}</p>
            </div>
          )}
          <div className="px-5 py-4 flex justify-between items-center">
            <span className="text-sm text-foreground/85 font-normal tracking-wider">账号类型</span>
            <span className="text-xs text-muted/60 font-normal tracking-wider bg-surface-light/50 px-3 py-1 rounded-full">
              {PROVIDER_LABELS[authProvider] || authProvider}
            </span>
          </div>
          <div className="px-5 py-4 flex justify-between items-center">
            <span className="text-sm text-foreground/85 font-normal tracking-wider">我的命书</span>
            <svg className="w-4 h-4 text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
          <div className="px-5 py-4 flex justify-between items-center">
            <span className="text-sm text-foreground/85 font-normal tracking-wider">占卜记录</span>
            <svg className="w-4 h-4 text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
          <div className="px-5 py-4 flex justify-between items-center">
            <span className="text-sm text-foreground/85 font-normal tracking-wider">设置</span>
            <svg className="w-4 h-4 text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>

        <button
          className="w-full text-center text-xs text-muted/60 font-normal tracking-wider py-3 hover:text-warning-red/70 transition-colors"
          onClick={handleLogout}
        >
          退出登录
        </button>
      </div>
      <BottomNav />
    </>
  );
}
