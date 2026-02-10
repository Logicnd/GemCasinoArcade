
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AgeGate } from "@/components/AgeGate";
import { AppHeader } from "@/components/AppHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gem Casino | Free-to-Play Arcade",
  description: "A fun, free-to-play casino style arcade. No real money. Entertainment only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen flex flex-col">
          {/* @ts-expect-error Async Server Component */}
          <AppHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="border-t border-border/60 bg-black/30 text-xs text-zinc-400 p-4 text-center">
            Entertainment only. Virtual gems only. No real money. No prizes. No cash-out. 18+.
          </footer>
        </div>
        <AgeGate />
      </body>
    </html>
  );
}
