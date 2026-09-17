import type { Metadata } from "next";
import { OfflineSyncManager } from "@/components/offline/offline-sync-manager";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const themeBootScript = `try { var theme = localStorage.getItem("event-timeline-theme"); if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme; } catch (_) {}`;

export const metadata: Metadata = {
  title: {
    default: "事线",
    template: "%s｜事线",
  },
  description: "记录一件事情已经发生的重要节点。",
  applicationName: "事线",
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <OfflineSyncManager />
        {children}
      </body>
    </html>
  );
}
