"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = {
  legacy: "旧版账号", email: "邮箱注册", google: "Google 登录", apple: "Apple 登录",
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.userDetail(id)
      .then((data) => {
        setUser(data);
        setForm({
          nickname: data.nickname,
          email: data.email || "",
          role: data.role,
          gender: data.gender || "",
        });
      })
      .catch(() => setError("用户不存在"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await adminApi.userUpdate(id, form);
      setUser({ ...user, ...updated });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || "保存失败");
    }
    setSaving(false);
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>;
  if (error && !user) return (
    <div className="text-center py-12">
      <p className="text-red-500 text-sm mb-4">{error}</p>
      <button onClick={() => router.push("/users")} className="text-amber-600 text-sm hover:underline">返回用户列表</button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <button onClick={() => router.push("/users")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回用户列表
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">{user?.nickname}</h1>
          <p className="text-sm text-gray-400">{user?.email || "无邮箱"}</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.isDeleted && <span className="text-xs bg-red-100 text-red-500 px-2 py-1 rounded">已删除</span>}
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
            {PROVIDER_LABELS[user?.authProvider] || user?.authProvider}
          </span>
          {user?.role === "admin" && (
            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">管理员</span>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">基本信息</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-xs text-amber-600 hover:text-amber-700">编辑</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm({ nickname: user.nickname, email: user.email || "", role: user.role, gender: user.gender || "" }); }} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50">
                <Save className="w-3 h-3" /> {saving ? "保存中..." : "保存"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs text-gray-400 mb-1">昵称</label>
            {editing ? (
              <input className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
            ) : (
              <div className="text-gray-700">{user?.nickname}</div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">邮箱</label>
            {editing ? (
              <input className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            ) : (
              <div className="text-gray-700">{user?.email || "-"}</div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">角色</label>
            {editing ? (
              <select className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">用户</option>
                <option value="admin">管理员</option>
              </select>
            ) : (
              <div className="text-gray-700">{user?.role === "admin" ? "管理员" : "用户"}</div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">性别</label>
            {editing ? (
              <select className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">未知</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            ) : (
              <div className="text-gray-700">{user?.gender || "未知"}</div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">星座</label>
            <div className="text-gray-700">{user?.constellation || "-"}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">生肖</label>
            <div className="text-gray-700">{user?.chineseZodiac || "-"}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">注册时间</label>
            <div className="text-gray-700">{new Date(user?.createdAt).toLocaleString("zh-CN")}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">最后活跃</label>
            <div className="text-gray-700">{new Date(user?.lastActiveAt).toLocaleString("zh-CN")}</div>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">统计数据</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-semibold text-gray-800">{user?.totalReadings || 0}</div>
            <div className="text-xs text-gray-400">占卜次数</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-800">{user?.archiveCount || 0}</div>
            <div className="text-xs text-gray-400">档案记录</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-800">{user?.fortuneCount || 0}</div>
            <div className="text-xs text-gray-400">运势记录</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-800">{user?.chatCount || 0}</div>
            <div className="text-xs text-gray-400">对话记录</div>
          </div>
        </div>
      </div>
    </div>
  );
}
