import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "星命 - 你的 AI 命运伴侣",
  description: "每日运势推送 · AI 塔罗占卜 · 深度命理解读",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#fefcf9", border: "1px solid #eee6dc", color: "#2c2416" },
          }}
        />
      </body>
    </html>
  );
}
