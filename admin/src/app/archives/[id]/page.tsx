"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function ArchiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [archive, setArchive] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.archiveDetail(id).then(setArchive).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>;
  if (!archive) return <div className="text-center py-12"><p className="text-red-500 text-sm">记录不存在</p></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => router.push("/archives")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="w-4 h-4" /> 返回占卜记录
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-800">占卜记录详情</h1>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{archive.type}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${archive.predictionStatus === "fulfilled" ? "bg-green-100 text-green-600" : archive.predictionStatus === "unfulfilled" ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-500"}`}>
          {archive.predictionStatus === "pending" ? "待验证" : archive.predictionStatus === "fulfilled" ? "已实现" : archive.predictionStatus === "unfulfilled" ? "未实现" : "部分实现"}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">基本信息</h2>
        <div className="text-sm space-y-2">
          <div><span className="text-gray-400">用户:</span> <span className="text-amber-600">{archive.user?.nickname} ({archive.user?.email})</span></div>
          <div><span className="text-gray-400">问题:</span> {archive.question}</div>
          <div><span className="text-gray-400">牌阵:</span> {archive.spreadName || "-"}</div>
          <div><span className="text-gray-400">创建时间:</span> {new Date(archive.createdAt).toLocaleString("zh-CN")}</div>
          {archive.predictionDueDate && <div><span className="text-gray-400">预测到期:</span> {new Date(archive.predictionDueDate).toLocaleDateString("zh-CN")}</div>}
          {archive.predictionNote && <div><span className="text-gray-400">预测备注:</span> {archive.predictionNote}</div>}
        </div>
      </div>

      {archive.cards && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">牌面</h2>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{JSON.stringify(archive.cards, null, 2)}</pre>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">AI 解读</h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{archive.aiInterpretation}</p>
      </div>

      {archive.aiAdvice && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">AI 建议</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{archive.aiAdvice}</p>
        </div>
      )}

      {archive.tags?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">标签</h2>
          <div className="flex flex-wrap gap-1.5">
            {archive.tags.map((t: string, i: number) => <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">{t}</span>)}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">原始数据</h2>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-96 overflow-auto">{JSON.stringify(archive.readingResult, null, 2)}</pre>
      </div>
    </div>
  );
}
