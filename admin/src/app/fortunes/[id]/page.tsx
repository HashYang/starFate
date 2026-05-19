"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function FortuneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [fortune, setFortune] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.fortuneDetail(id).then(setFortune).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>;
  if (!fortune) return <div className="text-center py-12"><p className="text-red-500 text-sm">运势记录不存在</p></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => router.push("/fortunes")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="w-4 h-4" /> 返回运势列表
      </button>

      <h1 className="text-lg font-semibold text-gray-800">
        运势详情 — {new Date(fortune.date).toLocaleDateString("zh-CN")}
        <span className="ml-2 text-sm font-normal text-gray-400">用户: {fortune.user?.nickname}</span>
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">基本信息</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-400">综合评分:</span> <span className={`font-medium ${fortune.overallScore >= 80 ? "text-green-600" : fortune.overallScore >= 60 ? "text-amber-600" : "text-red-500"}`}>{fortune.overallScore}</span></div>
            <div><span className="text-gray-400">幸运色:</span> {fortune.luckyColor}</div>
            <div><span className="text-gray-400">幸运数字:</span> {fortune.luckyNumber}</div>
            <div><span className="text-gray-400">幸运方向:</span> {fortune.luckyDirection}</div>
            {fortune.luckyTime && <div><span className="text-gray-400">吉时:</span> {fortune.luckyTime}</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">综合建议</h2>
          <p className="text-sm text-gray-600">{fortune.generalAdvice}</p>
        </div>
      </div>

      {fortune.categories?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">分类评分</h2>
          <div className="space-y-2">
            {fortune.categories.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">{c.nameCn || c.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.score >= 80 ? "bg-green-400" : c.score >= 60 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${c.score}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{c.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fortune.yi?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">宜 / 忌</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-green-600 mb-2">宜</p>
              <div className="flex flex-wrap gap-1.5">
                {fortune.yi.map((y: string, i: number) => <span key={i} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">{y}</span>)}
              </div>
            </div>
            <div>
              <p className="text-xs text-red-500 mb-2">忌</p>
              <div className="flex flex-wrap gap-1.5">
                {fortune.ji?.map((j: string, i: number) => <span key={i} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded">{j}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {fortune.poemLine && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">签诗</h2>
          <p className="text-sm text-gray-600 italic">{fortune.poemLine}</p>
          {fortune.poemInterpretation && <p className="text-sm text-gray-500">{fortune.poemInterpretation}</p>}
        </div>
      )}

      {fortune.divineSign && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">灵签</h2>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(fortune.divineSign, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
