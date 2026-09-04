import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Phantom — Play something now",
    template: "%s · Phantom",
  },
  description: "A fast library of original browser games. Pick one and play in a click.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-void font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
