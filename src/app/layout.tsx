import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";

const THEME_BG = { dark: "#0d0f11", light: "#e8eaee" } as const;

async function getTheme(): Promise<"light" | "dark"> {
  const value = (await cookies()).get("vb-theme")?.value;
  return value === "light" ? "light" : "dark";
}

export const metadata: Metadata = {
  title: {
    default: "VaultBit Ops",
    template: "%s · VaultBit Ops",
  },
  description: "Centro de operaciones interno de VaultBit Advisory.",
  manifest: "/manifest.json",
  applicationName: "VaultBit Ops",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: {
    capable: true,
    title: "VaultBit Ops",
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
      <head>
        <link
          rel="preconnect"
          href="https://rsms.me"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
