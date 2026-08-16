import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { getAiPublicState } from "@/lib/ai-settings";
import { getDb } from "@/lib/db";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tracker",
  description: "Monthly journal digest from the titles you follow.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ai = getAiPublicState(getDb());
  return (
    <html lang="en">
      <body className={`${sans.className} antialiased`}>
        <AppShell ai={ai}>{children}</AppShell>
      </body>
    </html>
  );
}
