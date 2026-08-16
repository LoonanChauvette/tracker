import type { Metadata } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tracker — monthly journal digest",
  description:
    "Track scientific journals, score new papers against your prompt, and read a monthly structured report.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-[var(--font-sans)] antialiased`}>
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-8">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
