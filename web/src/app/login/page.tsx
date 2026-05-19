"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { DragonLogo } from "@/components/dragon-logo";

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (config: any) => void; renderButton: (el: HTMLElement, options: any) => void; prompt: () => void } } };
    AppleID?: { auth: { init: (config: any) => void; signIn: () => Promise<{ authorization: { id_token: string } }> } };
  }
}

const SHICHEN = [
  { label: "不知道", value: undefined },
  { label: "子时 (23:00-00:59)", value: 23 },
  { label: "丑时 (01:00-02:59)", value: 1 },
  { label: "寅时 (03:00-04:59)", value: 3 },
  { label: "卯时 (05:00-06:59)", value: 5 },
  { label: "辰时 (07:00-08:59)", value: 7 },
  { label: "巳时 (09:00-10:59)", value: 9 },
  { label: "午时 (11:00-12:59)", value: 11 },
  { label: "未时 (13:00-14:59)", value: 13 },
  { label: "申时 (15:00-16:59)", value: 15 },
  { label: "酉时 (17:00-18:59)", value: 17 },
  { label: "戌时 (19:00-20:59)", value: 19 },
  { label: "亥时 (21:00-22:59)", value: 21 },
];

type Tab = "login" | "register";
type LoginMode = "password" | "code";
type CodeStep = "send" | "verify" | "profile";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyId, setLegacyId] = useState("");

  // Register form
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthHour, setBirthHour] = useState<number | undefined>(undefined);
  const [birthPlace, setBirthPlace] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Login mode toggle
  const [loginMode, setLoginMode] = useState<LoginMode>("password");

  // Code login
  const [codeEmail, setCodeEmail] = useState("");
  const [codeInput, setCodeInput] = useState(["", "", "", "", "", ""]);
  const [codeStep, setCodeStep] = useState<CodeStep>("send");
  const [countdown, setCountdown] = useState(0);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // New user profile completion (code flow)
  const [codeNewUserEmail, setCodeNewUserEmail] = useState("");

  // OAuth profile completion
  const [oauthFlow, setOauthFlow] = useState<{ provider: string; idToken: string; email: string } | null>(null);

  // Google GSI
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.querySelector("script[src*='accounts.google.com/gsi/client']");
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!googleBtnRef.current || !window.google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "test",
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.clientWidth || 320,
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "center",
      });
    } catch {}
  }, [tab, oauthFlow]);

  // Countdown timer for send-code button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Move to next code input
  function handleCodeInput(idx: number, val: string) {
    if (val.length > 1) return; // only single digit
    const next = [...codeInput];
    next[idx] = val;
    setCodeInput(next);
    if (val && idx < 5) codeInputRefs.current[idx + 1]?.focus();
  }
  function handleCodeKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !codeInput[idx] && idx > 0) {
      codeInputRefs.current[idx - 1]?.focus();
    }
  }

  async function handleSendCode() {
    if (!codeEmail.trim()) { setError("请输入邮箱"); return; }
    setLoading(true);
    setError("");
    try {
      await auth.sendCode(codeEmail.trim());
      setCodeStep("verify");
      setCountdown(60);
    } catch (e: any) {
      setError(e.message || "发送失败");
    }
    setLoading(false);
  }

  async function handleVerifyCode() {
    const code = codeInput.join("");
    if (code.length !== 6) { setError("请输入完整的验证码"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await auth.verifyCode(codeEmail.trim(), code);
      if (res.token && res.user) {
        // Existing user — login
        localStorage.setItem("token", res.token);
        localStorage.setItem("userId", res.user.id);
        localStorage.setItem("nickname", res.user.nickname);
        router.push("/");
      } else if (res.verified && res.email) {
        // New user — show profile completion
        setCodeNewUserEmail(res.email);
        setCodeStep("profile");
      }
    } catch (e: any) {
      setError(e.message || "验证失败");
    }
    setLoading(false);
  }

  async function handleCodeCompleteProfile() {
    if (!nickname.trim() || !birthDate) {
      setError("请填写昵称和出生日期");
      return;
    }
    const code = codeInput.join("");
    setLoading(true);
    setError("");
    try {
      const res = await auth.completeProfile({
        email: codeNewUserEmail,
        code,
        nickname: nickname.trim(),
        birthDate: new Date(birthDate).toISOString(),
        birthHour,
        birthPlace: birthPlace.trim() || undefined,
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("nickname", res.user.nickname);
      router.push("/");
    } catch (e: any) {
      setError(e.message || "注册失败");
    }
    setLoading(false);
  }

  async function handleGoogleCredential(response: { credential: string }) {
    try {
      setLoading(true);
      setError("");
      const res = await auth.googleLogin({ idToken: response.credential });
      if ((res as any).needsProfile) {
        setOauthFlow({ provider: "google", idToken: response.credential, email: (res as any).email });
        return;
      }
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("nickname", res.user.nickname);
      router.push("/");
    } catch (e: any) {
      setError(e.message || "Google 登录失败");
    }
    setLoading(false);
  }

  async function handleAppleLogin() {
    try {
      setError("");
      // Load Apple SDK if not loaded
      if (!window.AppleID) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Apple SDK 加载失败"));
          document.body.appendChild(script);
        });
      }

      window.AppleID!.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "test",
        scope: "name email",
        redirectURI: window.location.origin + "/login",
        usePopup: true,
      });

      const response = await window.AppleID!.auth.signIn();
      const idToken = response.authorization.id_token;

      setLoading(true);
      const res = await auth.appleLogin({ idToken });
      if ((res as any).needsProfile) {
        setOauthFlow({ provider: "apple", idToken, email: (res as any).email });
        return;
      }
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("nickname", res.user.nickname);
      router.push("/");
    } catch (e: any) {
      setError(e.message || "Apple 登录失败");
    }
    setLoading(false);
  }

  async function handleOauthProfileComplete() {
    if (!oauthFlow || !nickname.trim() || !birthDate) {
      setError("请填写昵称和出生日期");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        idToken: oauthFlow.idToken,
        nickname: nickname.trim(),
        birthDate: new Date(birthDate).toISOString(),
        birthHour,
        birthPlace: birthPlace.trim() || undefined,
      };
      const loginFn = oauthFlow.provider === "google" ? auth.googleLogin : auth.appleLogin;
      const res = await loginFn(payload);
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("nickname", res.user.nickname);
      router.push("/");
    } catch (e: any) {
      setError(e.message || "完善信息失败");
    }
    setLoading(false);
  }

  async function handleEmailLogin() {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("请输入邮箱和密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await auth.emailLogin({ email: loginEmail.trim(), password: loginPassword });
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("nickname", res.user.nickname);
      router.push("/");
    } catch (e: any) {
      setError(e.message || "登录失败");
    }
    setLoading(false);
  }

  async function handleLegacyLogin() {
    if (!legacyId.trim()) {
      setError("请输入用户 ID");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await auth.login(legacyId.trim());
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("nickname", res.user.nickname);
      router.push("/");
    } catch (e: any) {
      setError(e.message || "登录失败");
    }
    setLoading(false);
  }

  async function handleRegister() {
    if (!nickname.trim() || !birthDate || !regEmail.trim() || !regPassword.trim()) {
      setError("请填写昵称、出生日期、邮箱和密码");
      return;
    }
    if (regPassword.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await auth.emailRegister({
        email: regEmail.trim(),
        password: regPassword,
        nickname: nickname.trim(),
        birthDate: new Date(birthDate).toISOString(),
        birthHour,
        birthPlace: birthPlace.trim() || undefined,
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("nickname", res.user.nickname);
      router.push("/");
    } catch (e: any) {
      setError(e.message || "注册失败");
    }
    setLoading(false);
  }

  // OAuth profile completion view
  if (oauthFlow) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="max-w-sm w-full space-y-8">
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-surface-light space-y-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <DragonLogo size={56} className="text-primary/30" />
              </div>
              <h2 className="text-2xl font-thin tracking-[0.1em]">完善信息</h2>
              <p className="text-xs text-muted/70 font-normal tracking-wider">
                {oauthFlow.email}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">昵称</label>
                <input
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                  placeholder="输入你的昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">出生日期</label>
                <input
                  type="date"
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal focus:outline-none focus:border-primary/40 transition-colors"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">出生时辰</label>
                <select
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal focus:outline-none focus:border-primary/40 transition-colors"
                  value={birthHour ?? ""}
                  onChange={(e) => setBirthHour(e.target.value ? Number(e.target.value) : undefined)}
                >
                  {SHICHEN.map((s) => (
                    <option key={s.label} value={s.value ?? ""}>{s.label}</option>
                  ))}
                </select>
              </div>
              {error && (
                <p className="text-warning-red/90 text-xs font-normal tracking-wider text-center">{error}</p>
              )}
              <button
                className="w-full h-12 text-sm font-normal tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl mt-2 disabled:opacity-40"
                onClick={handleOauthProfileComplete}
                disabled={loading}
              >
                {loading ? "处理中..." : "完成"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="max-w-sm w-full space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <DragonLogo size={72} className="text-primary/40 animate-float" />
          </div>
          <h1 className="text-3xl font-thin tracking-[0.15em]">星命</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface/60 backdrop-blur-xl rounded-2xl p-1 border border-surface-light">
          <button
            className={`flex-1 h-10 text-sm font-normal tracking-wider rounded-xl transition-colors ${
              tab === "login" ? "bg-primary/10 text-primary" : "text-muted/60 hover:text-foreground/70"
            }`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            登录
          </button>
          <button
            className={`flex-1 h-10 text-sm font-normal tracking-wider rounded-xl transition-colors ${
              tab === "register" ? "bg-primary/10 text-primary" : "text-muted/60 hover:text-foreground/70"
            }`}
            onClick={() => { setTab("register"); setError(""); }}
          >
            注册
          </button>
        </div>

        {tab === "login" ? (
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-surface-light space-y-5">
            {/* Login mode toggle */}
            {codeStep !== "profile" && (
              <div className="flex bg-surface/40 rounded-xl p-0.5 border border-surface-light/50">
                <button
                  className={`flex-1 h-9 text-xs font-normal tracking-wider rounded-lg transition-colors ${
                    loginMode === "password" ? "bg-white/70 text-foreground shadow-sm" : "text-muted/50 hover:text-foreground/60"
                  }`}
                  onClick={() => { setLoginMode("password"); setError(""); setCodeStep("send"); setCodeInput(["", "", "", "", "", ""]); }}
                >
                  密码登录
                </button>
                <button
                  className={`flex-1 h-9 text-xs font-normal tracking-wider rounded-lg transition-colors ${
                    loginMode === "code" ? "bg-white/70 text-foreground shadow-sm" : "text-muted/50 hover:text-foreground/60"
                  }`}
                  onClick={() => { setLoginMode("code"); setError(""); }}
                >
                  验证码登录
                </button>
              </div>
            )}

            {loginMode === "password" && codeStep !== "profile" ? (
              /* ── Password login ── */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">邮箱</label>
                  <input
                    type="email"
                    className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">密码</label>
                  <input
                    type="password"
                    className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                    placeholder="输入密码"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <p className="text-warning-red/90 text-xs font-normal tracking-wider text-center">{error}</p>
                )}
                <button
                  className="w-full h-12 text-sm font-normal tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl disabled:opacity-40"
                  onClick={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? "登录中..." : "登录"}
                </button>
              </div>
            ) : codeStep !== "profile" ? (
              /* ── Code login ── */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">邮箱</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      className="flex-1 h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                      placeholder="your@email.com"
                      value={codeEmail}
                      onChange={(e) => setCodeEmail(e.target.value)}
                      disabled={codeStep === "verify"}
                    />
                    <button
                      className={`h-11 px-4 rounded-xl text-xs font-normal tracking-wider border transition-colors whitespace-nowrap ${
                        countdown > 0
                          ? "bg-surface-light/50 text-muted/40 border-surface-light cursor-not-allowed"
                          : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                      }`}
                      onClick={handleSendCode}
                      disabled={loading || countdown > 0}
                    >
                      {countdown > 0 ? `${countdown}s` : "发送验证码"}
                    </button>
                  </div>
                </div>

                {codeStep === "verify" && (
                  <>
                    <div>
                      <label className="block text-xs text-muted/80 font-normal tracking-wider mb-2">验证码</label>
                      <div className="flex justify-between gap-2">
                        {codeInput.map((d, i) => (
                          <input
                            key={i}
                            ref={(el) => { codeInputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="w-11 h-12 text-center rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-lg font-normal focus:outline-none focus:border-primary/40 transition-colors"
                            value={d}
                            onChange={(e) => handleCodeInput(i, e.target.value)}
                            onKeyDown={(e) => handleCodeKeyDown(i, e)}
                            autoFocus={i === 0}
                          />
                        ))}
                      </div>
                    </div>
                    {error && (
                      <p className="text-warning-red/90 text-xs font-normal tracking-wider text-center">{error}</p>
                    )}
                    <button
                      className="w-full h-12 text-sm font-normal tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl disabled:opacity-40"
                      onClick={handleVerifyCode}
                      disabled={loading || codeInput.join("").length !== 6}
                    >
                      {loading ? "验证中..." : "验证并登录"}
                    </button>
                    <button
                      className="w-full text-xs text-muted/50 hover:text-muted/80 tracking-wider transition-colors"
                      onClick={() => { setCodeStep("send"); setCodeInput(["", "", "", "", "", ""]); setError(""); }}
                    >
                      重新输入邮箱
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* ── New user: complete profile after code verification ── */
              <div className="space-y-4">
                <p className="text-xs text-muted/70 font-normal tracking-wider text-center">
                  验证成功！请完善个人信息以完成注册
                </p>
                <div>
                  <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">昵称</label>
                  <input
                    className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                    placeholder="输入你的昵称"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">出生日期</label>
                  <input
                    type="date"
                    className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal focus:outline-none focus:border-primary/40 transition-colors"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">出生时辰</label>
                  <select
                    className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal focus:outline-none focus:border-primary/40 transition-colors"
                    value={birthHour ?? ""}
                    onChange={(e) => setBirthHour(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    {SHICHEN.map((s) => (
                      <option key={s.label} value={s.value ?? ""}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">出生地 <span className="text-muted/40">(选填)</span></label>
                  <input
                    className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                    placeholder="如：北京、上海、广州"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                  />
                </div>
                {error && (
                  <p className="text-warning-red/90 text-xs font-normal tracking-wider text-center">{error}</p>
                )}
                <button
                  className="w-full h-12 text-sm font-normal tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl disabled:opacity-40"
                  onClick={handleCodeCompleteProfile}
                  disabled={loading}
                >
                  {loading ? "注册中..." : "完成注册"}
                </button>
              </div>
            )}

            {/* Divider */}
            {codeStep !== "profile" && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-surface-light" />
                <span className="text-xs text-muted/40 font-normal tracking-wider">或</span>
                <div className="flex-1 h-px bg-surface-light" />
              </div>
            )}

            {/* OAuth buttons */}
            {codeStep !== "profile" && (
              <div className="space-y-3">
                <div ref={googleBtnRef} className="w-full flex justify-center min-h-[40px]" />
                <button
                  className="w-full h-12 text-sm font-normal tracking-wider bg-black/5 border border-black/10 hover:bg-black/10 rounded-2xl flex items-center justify-center gap-2 text-foreground/80"
                  onClick={handleAppleLogin}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Apple 登录
                </button>
              </div>
            )}

            {/* Legacy fallback */}
            {codeStep !== "profile" && (
              <div className="text-center">
                <button
                  className="text-xs text-muted/50 hover:text-muted/80 tracking-wider transition-colors"
                  onClick={() => setShowLegacy(!showLegacy)}
                >
                  使用旧版 ID 登录
                </button>
              </div>
            )}
            {showLegacy && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">用户 ID</label>
                  <input
                    className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                    placeholder="输入你的用户 ID"
                    value={legacyId}
                    onChange={(e) => setLegacyId(e.target.value)}
                  />
                </div>
                <button
                  className="w-full h-11 text-xs font-normal tracking-wider bg-surface-light/50 hover:bg-surface-light rounded-2xl text-muted/70 transition-colors"
                  onClick={handleLegacyLogin}
                  disabled={loading}
                >
                  {loading ? "登录中..." : "确认"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-surface-light space-y-6">
            <div className="text-center space-y-1">
              <p className="text-xs text-muted/70 font-normal tracking-wider">
                精准的八字命理需要完整的出生信息
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">邮箱</label>
                <input
                  type="email"
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                  placeholder="your@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">密码</label>
                <input
                  type="password"
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                  placeholder="至少 6 位"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">昵称</label>
                <input
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                  placeholder="输入你的昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">出生日期</label>
                <input
                  type="date"
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal focus:outline-none focus:border-primary/40 transition-colors"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">出生时辰</label>
                <select
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal focus:outline-none focus:border-primary/40 transition-colors"
                  value={birthHour ?? ""}
                  onChange={(e) => setBirthHour(e.target.value ? Number(e.target.value) : undefined)}
                >
                  {SHICHEN.map((s) => (
                    <option key={s.label} value={s.value ?? ""}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted/80 font-normal tracking-wider mb-1.5">出生地 <span className="text-muted/40">(选填)</span></label>
                <input
                  className="w-full h-11 px-4 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-light text-foreground text-sm font-normal placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
                  placeholder="如：北京、上海、广州"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-warning-red/90 text-xs font-normal tracking-wider text-center">{error}</p>
              )}

              <button
                className="w-full h-12 text-sm font-normal tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-2xl mt-2 disabled:opacity-40"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? "注册中..." : "注册"}
              </button>

              {/* OAuth on register */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-surface-light" />
                <span className="text-xs text-muted/40 font-normal tracking-wider">快捷注册</span>
                <div className="flex-1 h-px bg-surface-light" />
              </div>

              <div className="space-y-3">
                <div ref={googleBtnRef} className="w-full flex justify-center min-h-[40px]" />
                <button
                  className="w-full h-12 text-sm font-normal tracking-wider bg-black/5 border border-black/10 hover:bg-black/10 rounded-2xl flex items-center justify-center gap-2 text-foreground/80"
                  onClick={handleAppleLogin}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Apple 注册
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
