"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Brief, useStore } from "../components/store";

const DEFAULT_BRIEF: Brief = {
  title: "",
  platform: "douyin",
  target_duration_sec: 40,
  style: "日常、清爽",
  segments: ["早上", "中午", "晚上", "产品展示"]
};

export default function BriefPage() {
  const { brief, setBrief } = useStore();
  const [userText, setUserText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentBrief = brief ?? DEFAULT_BRIEF;

  const segments = useMemo(() => currentBrief.segments ?? [], [currentBrief.segments]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: userText.trim() })
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "生成 brief 失败");
      }
      const data = (await response.json()) as Brief;
      setBrief(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const updateBrief = (updates: Partial<Brief>) => {
    setBrief({ ...currentBrief, ...updates });
  };

  const updateSegment = (index: number, value: string) => {
    const next = [...segments];
    next[index] = value;
    updateBrief({ segments: next });
  };

  const addSegment = () => {
    if (segments.length >= 6) return;
    updateBrief({ segments: [...segments, "新段落"] });
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 3) return;
    updateBrief({ segments: segments.filter((_, idx) => idx !== index) });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">AI Vlog 剪辑 Copilot</h1>
          <p className="text-sm text-slate-500">输入创作意图，生成可编辑的剪辑 brief。</p>
        </div>
      </header>

      <section className="rounded-xl bg-white p-6 shadow-soft">
        <label className="mb-3 block text-sm font-medium text-slate-700">输入需求</label>
        <textarea
          value={userText}
          onChange={(event) => setUserText(event.target.value)}
          placeholder="例如：剪一个《我的一天》vlog，早上通勤和咖啡，中午吃饭，晚上产品展示，40秒抖音风"
          className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerate}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-blue-500"
            disabled={loading}
          >
            {loading ? "生成中..." : "生成 brief"}
          </button>
          {error ? <span className="text-sm text-rose-600">{error}</span> : null}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold">编辑 brief</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-500">标题</label>
            <input
              value={currentBrief.title}
              onChange={(event) => updateBrief({ title: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="我的一天"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">平台</label>
            <input
              value={currentBrief.platform}
              onChange={(event) => updateBrief({ platform: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">目标时长（秒）</label>
            <input
              type="number"
              value={currentBrief.target_duration_sec}
              onChange={(event) => updateBrief({ target_duration_sec: Number(event.target.value) })}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              min={10}
              max={120}
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">风格</label>
            <input
              value={currentBrief.style}
              onChange={(event) => updateBrief({ style: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">段落</h3>
            <button
              onClick={addSegment}
              className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-600"
              disabled={segments.length >= 6}
            >
              + 添加段落
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {segments.map((segment, index) => (
              <div key={`${segment}-${index}`} className="flex items-center gap-2">
                <input
                  value={segment}
                  onChange={(event) => updateSegment(index, event.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => removeSegment(index)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500"
                  disabled={segments.length <= 3}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/assets"
            className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-blue-500"
          >
            去分组素材
          </Link>
        </div>
      </section>
    </div>
  );
}
