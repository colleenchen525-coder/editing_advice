"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Brief = {
  title: string;
  platform: string;
  target_duration_sec: number;
  style: string;
  segments: string[];
};

export type AssetItem = {
  id: string;
  name: string;
  duration_sec: number;
  segment: string;
  thumbnail: string;
};

type StoreState = {
  brief: Brief | null;
  assets: AssetItem[];
  setBrief: (brief: Brief | null) => void;
  setAssets: (assets: AssetItem[]) => void;
};

const StoreContext = createContext<StoreState | undefined>(undefined);

const STORAGE_KEY = "ai-vlog-copilot";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { brief?: Brief; assets?: AssetItem[] };
      if (parsed.brief) {
        setBrief(parsed.brief);
      }
      if (parsed.assets) {
        setAssets(parsed.assets);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ brief, assets });
    window.localStorage.setItem(STORAGE_KEY, payload);
  }, [brief, assets]);

  const value = useMemo(() => ({ brief, assets, setBrief, setAssets }), [brief, assets]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
}
