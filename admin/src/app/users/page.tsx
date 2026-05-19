"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Trash2, RotateCcw, Eye } from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = {
  legacy: "旧版", email: "邮箱", google: "Google", apple: "Apple",
};

export default function UsersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [authProvider, setAuthProvider] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.users({ page, pageSize, search: search || undefined, authProvider: authProvider || undefined, sortBy, sortOrder });
      setData(res);
    } catch (err: any) {
      setError(err.message || "加载失败");
    }
    setLoading(false);
  }, [page, search, authProvider, sortBy, sortOrder]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleDelete(id: string, nickname: string) {
    if (!confirm(`确定要删除用户「${nickname}」吗？此操作为软删除，可恢复。`)) return;
    try {
      await adminApi.userDelete(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "删除失败");
    }
  }

  async function handleRestore(id: string) {
    try {
      await adminApi.userRestore(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "恢复失败");
    }
  }

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  }

  function SortIcon({ column }: { column: string }) {
    if (sortBy !== column) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-amber-600 ml-1">{sortOrder === "desc" ? "↓" : "↑"}</span>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-800">用户管理</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            placeholder="搜索昵称或邮箱..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          value={authProvider}
          onChange={(e) => { setAuthProvider(e.target.value); setPage(1); }}
        >
          <option value="">全部注册方式</option>
          <option value="legacy">旧版</option>
          <option value="email">邮箱</option>
          <option value="google">Google</option>
          <option value="apple">Apple</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer select-none" onClick={() => toggleSort("nickname")}>
                  昵称 <SortIcon column="nickname" />
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer select-none" onClick={() => toggleSort("email")}>
                  邮箱 <SortIcon column="email" />
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">注册方式</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">角色</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer select-none" onClick={() => toggleSort("totalReadings")}>
                  占卜数 <SortIcon column="totalReadings" />
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                  注册时间 <SortIcon column="createdAt" />
                </th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">没有找到用户</td></tr>
              ) : (
                data?.items.map((u: any) => (
                  <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${u.isDeleted ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/users/${u.id}`} className="text-gray-800 hover:text-amber-600 font-medium">
                        {u.nickname}
                      </Link>
                      {u.isDeleted && <span className="ml-2 text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded">已删除</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {PROVIDER_LABELS[u.authProvider] || u.authProvider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">管理员</span>
                      ) : (
                        <span className="text-xs text-gray-400">用户</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{u.totalReadings}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/users/${u.id}`} className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {u.isDeleted ? (
                          <button onClick={() => handleRestore(u.id)} className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50" title="恢复">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleDelete(u.id, u.nickname)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50" title="删除">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">共 {data.total} 条</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500">{page} / {Math.ceil(data.total / pageSize)}</span>
              <button
                disabled={!data.hasMore}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
}
