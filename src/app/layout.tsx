import type { Metadata, Viewport } from "next";
import { Figtree, Manrope } from "next/font/google";

import "./globals.css";

/**
 * Figtree carries the interface on the web, where SF Pro is not available.
 * Manrope is reserved for headings and card titles only.
 *
 * Both are self-hosted by next/font with an adjusted fallback, so there is no
 * request to Google and no layout shift while they load.
 */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Weekend trip planner",
  description:
    "Describe a weekend in one message and get a stay, an experience, and somewhere to eat.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  // The prototype is a single readable column; a zoomed-out mobile viewport is
  // never intended.
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
