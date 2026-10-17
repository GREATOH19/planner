import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Weekly Planner", manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Planner", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#0f172a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: "#0f172a", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
