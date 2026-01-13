"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AssetItem, Brief, useStore } from "../../components/store";

type PlanResponse = {
  time_budget: { segment: string; sec: number }[];
  timeline: {
    segment: string;
    sec: number;
    clips: { asset_id: string; use_sec: number }[];
    rationale: string;
  }[];
  warnings: { segment: string; type: string; message: string }[];
  next_actions: string[];
};

type Adjustment = {
  pace?: "faster" | "slower";
  emphasize?: "product";
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const totalBudget = (plan: PlanResponse | null) =>
  plan?.time_budget.reduce((sum, item) => sum + item.sec, 0) ?? 0;

const toAssetMap = (assets: AssetItem[]) =>
  assets.reduce<Record<string, AssetItem>>((acc, asset) => {
    acc[asset.id] = asset;
    return acc;
  }, {});

export default function PlanPage() {
  const { brief, assets } = useStore();
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missingSegments = useMemo(() => {
    if (!brief) return [];
    return brief.segments.filter((segment) => !assets.some((asset) => asset.segment === segment));
  }, [brief, assets]);

  const assetMap = useMemo(() => toAssetMap(assets), [assets]);

  const callPlan = async (adjustment: Adjustment = {}) => {
    if (!brief) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creative_brief: brief,
          assets: assets.map(({ id, name, duration_sec, segment }) => ({
            id,
            name,
            duration_sec,
            segment
          })),
          adjustment
        })
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "生成方案失败");
      }
      const data = (await response.json()) as PlanResponse;
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!plan) return;
    await navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
  };

  if (!brief) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold">还没有 brief</h2>
        <p className="mt-2 text-sm text-slate-500">请先完成 brief 和素材分组。</p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          返回 brief
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">剪辑方案</h1>
          <p className="text-sm text-slate-500">目标总时长 {brief.target_duration_sec}s</p>
        </div>
        <Link href="/assets" className="text-sm text-blue-600">
          返回素材
        </Link>
      </header>

      <section className="rounded-xl bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">预算总时长</p>
            <p className="text-2xl font-semibold">{totalBudget(plan)}s</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => callPlan({ pace: "faster" })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
            >
              更快
            </button>
            <button
              onClick={() => callPlan({ pace: "slower" })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
            >
              更慢
            </button>
            <button
              onClick={() => callPlan({ emphasize: "product" })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
            >
              突出产品
            </button>
            <button
              onClick={handleCopy}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              disabled={!plan}
            >
              复制 JSON
            </button>
          </div>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-blue-500"
            style={{
              width: `${Math.min(
                100,
                (totalBudget(plan) / Math.max(brief.target_duration_sec, 1)) * 100
              )}%`
            }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => callPlan()}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-blue-500"
            disabled={loading}
          >
            {loading ? "生成中..." : "生成方案"}
          </button>
          {error ? <span className="text-sm text-rose-600">{error}</span> : null}
        </div>
        {missingSegments.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            以下段落暂无素材：{missingSegments.join("、")}。方案将自动降级处理。
          </div>
        ) : null}
      </section>

      {plan ? (
        <section className="grid gap-4">
          {plan.timeline.map((block) => (
            <div key={block.segment} className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{block.segment}</h3>
                  <p className="text-xs text-slate-500">预算 {block.sec}s</p>
                </div>
                <div className="flex gap-2">
                  {block.clips.map((clip) => {
                    const asset = assetMap[clip.asset_id];
                    return (
                      <div
                        key={clip.asset_id}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1"
                      >
                        {asset?.thumbnail ? (
                          <img
                            src={asset.thumbnail}
                            alt={asset.name}
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        ) : null}
                        <div className="text-xs text-slate-600">
                          {asset?.name ?? clip.asset_id} · {clip.use_sec}s
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{block.rationale}</p>
            </div>
          ))}
        </section>
      ) : null}

      {plan?.warnings?.length ? (
        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-slate-700">警告</h3>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-600">
            {plan.warnings.map((warning, index) => (
              <li key={`${warning.segment}-${index}`}>{warning.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {plan?.next_actions?.length ? (
        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-slate-700">下一步</h3>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-600">
            {plan.next_actions.map((action, index) => (
              <li key={`${action}-${index}`}>{action}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
