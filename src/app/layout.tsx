import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";

export const metadata = { title: "DARAJA" };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // telegram-web-app.js gidratatsiyadan oldin <html> ga --tg-viewport-* style qo'shadi
    <html lang="uz" suppressHydrationWarning>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
