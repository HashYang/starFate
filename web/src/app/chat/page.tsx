"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { chat, archive } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const router = useRouter();

  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [contextId, setContextId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const divinationRef = useRef<string | null>(null);
  const initialized = useRef(false);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const uid = localStorage.getItem("userId");
    if (!token || !uid) {
      router.replace("/login");
      return;
    }
    setUserId(uid);
    setAuthReady(true);
  }, [router]);

  // Load chat history or show welcome
  useEffect(() => {
    if (!authReady || !userId || initialized.current) return;
    initialized.current = true;

    // Try loading from localStorage first for instant restore
    const saved = localStorage.getItem("chat_messages");
    const savedCtx = localStorage.getItem("chat_contextId");
    if (saved && savedCtx) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setContextId(savedCtx);
          setInitLoading(false);
          // Still fetch latest from server in background
          chat.history(userId).then(data => {
            if (data.messages.length > 0 && data.contextId) {
              setMessages(data.messages);
              setContextId(data.contextId);
              localStorage.setItem("chat_messages", JSON.stringify(data.messages));
              localStorage.setItem("chat_contextId", data.contextId);
            }
          }).catch(() => {});
          return;
        }
      } catch {}
    }

    chat.history(userId).then(data => {
      if (data.messages.length > 0 && data.contextId) {
        setMessages(data.messages);
        setContextId(data.contextId);
        localStorage.setItem("chat_messages", JSON.stringify(data.messages));
        localStorage.setItem("chat_contextId", data.contextId);
      } else {
        setMessages([{ role: "assistant", content: "你好，有什么关于命运、运势的问题想和我聊聊吗？" }]);
      }
    }).catch(() => {
      setMessages([{ role: "assistant", content: "你好，有什么关于命运、运势的问题想和我聊聊吗？" }]);
    }).finally(() => setInitLoading(false));

    // Preload latest divination result for first message context
    archive.list(userId, 1).then(data => {
      if (data.items.length === 0) return;
      const latest = data.items[0];
      const age = Date.now() - new Date(latest.createdAt).getTime();
      if (age > 24 * 60 * 60 * 1000) return;
      const label = latest.type === "tarot" ? "塔罗占卜" : latest.type === "liuyao" ? "六爻占卜" : "灵签占卜";
      divinationRef.current = `【${label}】问题: ${latest.question}\n评分: ${latest.score}分\n解读: ${latest.aiInterpretation}`;
    }).catch(() => {});
  }, [authReady, userId]);

  // Auto scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages to localStorage on change
  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem("chat_messages", JSON.stringify(messages));
    if (contextId) localStorage.setItem("chat_contextId", contextId);
  }, [messages, contextId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !userId) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    const loadingMsg: Message = { role: "assistant", content: "" };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setSending(true);

    try {
      const result = await chat.send({
        message: text,
        userId,
        contextId: contextId || undefined,
        divinationContext: !contextId ? divinationRef.current || undefined : undefined,
      });

      setContextId(result.contextId);
      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: result.reply }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "抱歉，我暂时无法回答，请稍后再试。" }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 1000) setInput(e.target.value);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-breathe text-muted text-sm tracking-wider">加载中...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-bg">
        {/* Messages */}
        <div className="flex-1 px-4 pt-6 pb-36 max-w-lg mx-auto w-full overflow-y-auto space-y-4">
          {initLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted/40 text-xs tracking-wider">
              加载中...
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed tracking-wider ${
                    msg.role === "user"
                      ? "bg-primary/10 text-foreground/85"
                      : "bg-surface/70 text-foreground/75"
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex gap-1.5 items-center h-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="fixed bottom-16 left-0 right-0 bg-surface/85 backdrop-blur-xl border-t border-surface-light z-20">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="flex-1 min-h-[44px] max-h-32 px-4 py-2.5 rounded-xl bg-surface/80 border border-surface-light
                text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/40
                transition-colors resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 w-[44px] h-[44px] rounded-xl bg-primary/10 text-primary border border-primary/20
                hover:bg-primary/15 disabled:opacity-40 transition-all flex items-center justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
