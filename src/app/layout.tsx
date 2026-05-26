import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real-Time Predictive Maintenance Monitor",
  description:
    "Historical CSV replayed as a simulated IoT machine stream with LSTM failure-risk inference.",
  manifest: "/site.webmanifest",
  themeColor: "#000000",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} countach-tiling-manager h-full bg-[#000000]`}
    >
      <body className="h-full overflow-hidden bg-[#000000]">{children}</body>
    </html>
  );
}
