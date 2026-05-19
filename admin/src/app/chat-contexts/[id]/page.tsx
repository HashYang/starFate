"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function ChatContextDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.chatContextDetail(id).then(setChat).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>;
  if (!chat) return <div className="text-center py-12"><p className="text-red-500 text-sm">对话记录不存在</p></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => router.push("/chat-contexts")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="w-4 h-4" /> 返回对话列表
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-800">对话详情</h1>
        <span className="text-xs text-gray-400 font-mono">{chat.contextId}</span>
      </div>

      <div className="text-sm text-gray-400">
        用户: <span className="text-amber-600">{chat.user?.nickname}</span>
        <span className="mx-2">|</span>
        创建: {new Date(chat.createdAt).toLocaleString("zh-CN")}
        <span className="mx-2">|</span>
        更新: {new Date(chat.updatedAt).toLocaleString("zh-CN")}
      </div>

      <div className="space-y-3">
        {Array.isArray(chat.messages) && chat.messages.map((msg: any, i: number) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl p-4 text-sm ${
              msg.role === "user"
                ? "bg-amber-500 text-white"
                : "bg-white border border-gray-200 text-gray-700"
            }`}>
              <div className="text-xs opacity-60 mb-1">
                {msg.role === "user" ? "用户" : "AI 命理师"}
              </div>
              <div className="whitespace-pre-wrap">{msg.content || JSON.stringify(msg)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
