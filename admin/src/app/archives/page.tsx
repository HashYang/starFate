"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = { tarot: "塔罗", dailyFortune: "运势", zodiac: "生肖" };
const STATUS_LABELS: Record<string, string> = { pending: "待验证", fulfilled: "已实现", unfulfilled: "未实现", partially: "部分实现" };
const STATUS_COLORS: Record<string, string> = { pending: "bg-gray-100 text-gray-500", fulfilled: "bg-green-100 text-green-600", unfulfilled: "bg-red-100 text-red-500", partially: "bg-amber-100 text-amber-600" };

export default function ArchivesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.archives({ page, pageSize: 20, userId: userId || undefined, type: type || undefined });
      setData(res);
    } catch (err: any) { setError(err.message || "加载失败"); }
    setLoading(false);
  }, [page, userId, type]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这条占卜记录吗？")) return;
    try { await adminApi.archiveDelete(id); fetch(); } catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-800">占卜记录</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" placeholder="按用户 ID 筛选..." value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} />
        </div>
        <select className="h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-600" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">全部类型</option>
          <option value="tarot">塔罗</option>
          <option value="dailyFortune">运势</option>
          <option value="zodiac">生肖</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">用户</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">类型</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">问题</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">预测状态</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">创建时间</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : data?.items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">没有占卜记录</td></tr>
              ) : data?.items.map((a: any) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3"><Link href={`/users/${a.userId}`} className="text-amber-600 hover:underline">{a.user?.nickname || a.userId}</Link></td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{TYPE_LABELS[a.type] || a.type}</span></td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{a.question}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[a.predictionStatus] || "bg-gray-100 text-gray-500"}`}>{STATUS_LABELS[a.predictionStatus] || a.predictionStatus}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(a.createdAt).toLocaleString("zh-CN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/archives/${a.id}`} className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50"><Eye className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
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
