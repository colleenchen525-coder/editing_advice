"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AssetItem, useStore } from "../../components/store";

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const createThumbnail = (file: File): Promise<{ duration: number; thumbnail: string }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const targetTime = Math.min(0.5, duration / 2);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("无法生成缩略图"));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
      cleanup();
      resolve({ duration: video.duration, thumbnail });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("读取视频失败"));
    };
  });
};

export default function AssetsPage() {
  const { brief, assets, setAssets } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  const segments = useMemo(() => brief?.segments ?? [], [brief?.segments]);
  const unassignedSegments = segments.filter(
    (segment) => !assets.some((asset) => asset.segment === segment)
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setLoading(true);
    setError(null);
    try {
      const nextAssets: AssetItem[] = [];
      for (const file of Array.from(files)) {
        const meta = await createThumbnail(file);
        nextAssets.push({
          id: crypto.randomUUID(),
          name: file.name,
          duration_sec: Math.round(meta.duration),
          segment: segments[0] ?? "未分组",
          thumbnail: meta.thumbnail
        });
      }
      setAssets([...assets, ...nextAssets]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取素材失败");
    } finally {
      setLoading(false);
    }
  };

  const updateSegment = (segment: string) => {
    if (!selectedAsset) return;
    setAssets(
      assets.map((asset) => (asset.id === selectedAsset.id ? { ...asset, segment } : asset))
    );
    setSelectedAsset(null);
  };

  if (!brief) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold">还没有 brief</h2>
        <p className="mt-2 text-sm text-slate-500">请先在 brief 页面生成创作说明。</p>
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
          <h1 className="text-2xl font-semibold">素材分组</h1>
          <p className="text-sm text-slate-500">导入视频并分配到段落。</p>
        </div>
        <Link href="/" className="text-sm text-blue-600">
          返回 brief
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl bg-white p-4 shadow-soft">
          <h3 className="text-sm font-semibold text-slate-700">段落</h3>
          <div className="mt-3 flex flex-col gap-2">
            {segments.map((segment) => (
              <span
                key={segment}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
              >
                {segment}
              </span>
            ))}
          </div>
          {unassignedSegments.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              以下段落暂无素材：{unassignedSegments.join("、")}。可以继续进入方案页。
            </div>
          ) : null}
        </aside>

        <section className="flex flex-col gap-4">
          <div className="rounded-xl bg-white p-4 shadow-soft">
            <label className="text-sm font-medium text-slate-700">导入视频素材</label>
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={(event) => handleFiles(event.target.files)}
              className="mt-3 block text-sm"
            />
            {loading ? <p className="mt-2 text-xs text-slate-500">处理中...</p> : null}
            {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <button
                key={asset.id}
                className="flex flex-col overflow-hidden rounded-xl bg-white text-left shadow-soft transition hover:-translate-y-1"
                onClick={() => setSelectedAsset(asset)}
              >
                <img src={asset.thumbnail} alt={asset.name} className="h-40 w-full object-cover" />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="text-sm font-medium text-slate-800">{asset.name}</div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDuration(asset.duration_sec)}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] text-blue-600">
                      {asset.segment}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <Link
          href="/plan"
          className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-blue-500"
        >
          生成方案
        </Link>
      </div>

      {selectedAsset ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-soft">
            <h3 className="text-base font-semibold">选择段落</h3>
            <p className="mt-1 text-xs text-slate-500">为素材分配到对应段落。</p>
            <div className="mt-4 flex flex-col gap-2">
              {segments.map((segment) => (
                <button
                  key={segment}
                  onClick={() => updateSegment(segment)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:border-blue-500 hover:text-blue-600"
                >
                  {segment}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              className="mt-4 text-xs text-slate-400"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
