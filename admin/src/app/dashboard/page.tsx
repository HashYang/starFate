"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Users, Sparkles, Archive, TrendingUp, AlertCircle } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold text-gray-800">{value}</div>
          <div className="text-xs text-gray-400">{label}</div>
          {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<{ date: string; count: number }[]>([]);
  const [readingTrend, setReadingTrend] = useState<{ date: string; tarot: number; fortune: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.dashboardStats(),
      adminApi.userGrowth(14),
      adminApi.readingTrend(14),
    ])
      .then(([s, ug, rt]) => {
        setStats(s);
        setUserGrowth(ug);
        setReadingTrend(rt);
      })
      .catch(() => setError("加载统计数据失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>;
  if (error) return <div className="text-red-500 text-sm py-8 text-center">{error}</div>;

  const maxGrowth = Math.max(...userGrowth.map((d) => d.count), 1);
  const maxReading = Math.max(...readingTrend.map((d) => d.tarot + d.fortune), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-800">仪表盘</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="总用户数" value={stats.totalUsers} sub={`今日 +${stats.newUsersToday}`} />
        <StatCard icon={TrendingUp} label="今日活跃" value={stats.activeUsersToday} />
        <StatCard icon={Sparkles} label="总占卜数" value={stats.totalReadings + stats.totalFortunes} sub={`运势 ${stats.totalFortunes}`} />
        <StatCard icon={AlertCircle} label="预测准确率" value={stats.accuracyRate !== null ? `${stats.accuracyRate}%` : "暂无"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User growth */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">用户增长趋势（近14天）</h2>
          <div className="flex items-end gap-1 h-32">
            {userGrowth.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{d.count || ""}</span>
                <div
                  className="w-full bg-amber-500/80 rounded-t"
                  style={{ height: `${(d.count / maxGrowth) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                />
                <span className="text-[10px] text-gray-400 -rotate-45 origin-left whitespace-nowrap">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reading trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">占卜趋势（近14天）</h2>
          <div className="flex items-end gap-1 h-32">
            {readingTrend.map((d) => {
              const total = d.tarot + d.fortune;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{total || ""}</span>
                  <div className="w-full flex flex-col-reverse" style={{ height: `${(total / maxReading) * 100}%`, minHeight: total > 0 ? 4 : 0 }}>
                    <div className="w-full bg-blue-400/80" style={{ height: `${(d.tarot / Math.max(total, 1)) * 100}%` }} />
                    <div className="w-full bg-amber-400/80" style={{ height: `${(d.fortune / Math.max(total, 1)) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 -rotate-45 origin-left whitespace-nowrap">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400" /> 占卜</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> 运势</span>
          </div>
        </div>
      </div>

      {/* Top streak users */}
      {stats.topStreakUsers?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3">连续占卜天数 Top 10</h2>
          <div className="space-y-2">
            {stats.topStreakUsers.map((u: any, i: number) => (
              <div key={u.id} className="flex items-center gap-3 text-sm">
                <span className="w-5 text-center text-gray-400 text-xs">{i + 1}</span>
                <span className="flex-1 text-gray-700">{u.nickname}</span>
                <span className="text-amber-600 font-medium">{u.longestStreak} 天</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
