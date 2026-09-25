import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { DirectionProvider } from "@/providers/direction-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AL-QA'QA' AI | القعقاع",
  description:
    "Advanced multi-language, multi-modal AI assistant. Your personal AI for coding, design, research, and more.",
  icons: { icon: "/favicon.ico" },
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
      </body>
    </html>
  );
}
