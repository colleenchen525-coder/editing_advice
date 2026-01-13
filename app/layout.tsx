import "./globals.css";
import type { Metadata } from "next";
import { StoreProvider } from "../components/store";

export const metadata: Metadata = {
  title: "AI Vlog 剪辑 Copilot",
  description: "AI Vlog 剪辑 Copilot demo"
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <StoreProvider>
          <div className="min-h-screen px-6 py-8 [padding-top:calc(env(safe-area-inset-top)+2rem)] [padding-bottom:calc(env(safe-area-inset-bottom)+2rem)]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
              {children}
            </div>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
