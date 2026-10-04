import type { Metadata, Viewport } from "next";
import "@fontsource/noto-sans/latin-400.css";
import "@fontsource/noto-sans/latin-600.css";
import "@fontsource/noto-sans/latin-700.css";
import "@fontsource/noto-sans-malayalam/malayalam-400.css";
import "@fontsource/noto-sans-malayalam/malayalam-600.css";
import "@fontsource/noto-sans-malayalam/malayalam-700.css";
import "@fontsource/noto-serif/latin-400.css";
import "@fontsource/noto-serif/latin-700.css";
import "@fontsource/noto-serif-malayalam/malayalam-400.css";
import "@fontsource/noto-serif-malayalam/malayalam-700.css";
import "./globals.css";
import { config } from "@/lib/config";
import { getLang } from "@/lib/ctx";
import { PwaRegister } from "@/components/ui/Pwa";
import { LangProvider } from "@/components/ui/LangProvider";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteOrigin),
  title: { default: "AdvocateID", template: "%s | AdvocateID" },
  applicationName: "AdvocateID",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AdvocateID", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16213E",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body>
        <LangProvider lang={lang}>{children}</LangProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
