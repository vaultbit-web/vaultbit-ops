import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";

const THEME_BG = { dark: "#0a0a0a", light: "#faf9f6" } as const;

async function getTheme(): Promise<"light" | "dark"> {
  const value = (await cookies()).get("vb-theme")?.value;
  return value === "light" ? "light" : "dark";
}

export const metadata: Metadata = {
  title: {
    default: "Centro de Operaciones · Daniel Brosed",
    template: "%s · Daniel Brosed",
  },
  description: "Centro de operaciones de los negocios de Daniel Brosed.",
  manifest: "/manifest.json",
  applicationName: "Centro de Operaciones",
  robots: { index: false, follow: false },
  // El favicon lo aporta ops/src/app/icon.svg (isotipo "db"), que Next.js
  // inyecta automáticamente. Los PNG de PWA (manifest) se regeneran aparte.
  appleWebApp: {
    capable: true,
    title: "Centro de Operaciones",
    statusBarStyle: "black-translucent",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return {
    themeColor: THEME_BG[theme],
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();
  return (
    <html lang="es-ES" data-theme={theme} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
