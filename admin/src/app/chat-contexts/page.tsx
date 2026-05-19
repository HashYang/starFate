"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";

export default function ChatContextsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.chatContexts({ page, pageSize: 20, userId: userId || undefined });
      setData(res);
    } catch (err: any) { setError(err.message || "加载失败"); }
    setLoading(false);
  }, [page, userId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleDelete(contextId: string) {
    if (!confirm("确定要删除这条对话记录吗？")) return;
    try { await adminApi.chatContextDelete(contextId); fetch(); } catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-800">AI 对话记录</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" placeholder="按用户 ID 筛选..." value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">用户</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">对话 ID</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">消息数</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">创建时间</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">最后更新</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : data?.items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">没有对话记录</td></tr>
              ) : data?.items.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3"><Link href={`/users/${c.userId}`} className="text-amber-600 hover:underline">{c.user?.nickname || c.userId}</Link></td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{c.contextId?.slice(0, 16)}...</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c.messageCount}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleString("zh-CN")}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.updatedAt).toLocaleString("zh-CN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/chat-contexts/${c.id}`} className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50"><Eye className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(c.contextId)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">共 {data.total} 条</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-gray-500">{page} / {Math.ceil(data.total / 20)}</span>
              <button disabled={!data.hasMore} onClick={() => setPage(page + 1)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
}
