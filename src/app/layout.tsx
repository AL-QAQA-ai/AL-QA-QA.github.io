import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { DirectionProvider } from "@/providers/direction-provider";
import { ServiceWorkerRegister } from "@/providers/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "AL-QA'QA' AI | القعقاع",
  description:
    "Advanced multi-language, multi-modal AI assistant. Your personal AI for coding, design, research, and more.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AL-QAQA AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <DirectionProvider>{children}</DirectionProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
