import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({variable: "--font-geist-sans", subsets: ["latin"]});
const geistMono = Geist_Mono({variable: "--font-geist-mono", subsets: ["latin"]});

export const metadata: Metadata = {
  title: "ভোটকেন্দ্র ও ভোটার তথ্য অনুসন্ধান | যশোর সদর • ১৪ নং ইউনিয়ন",
  description: "যশোর সদর উপজেলার ১৪ নং ইউনিয়নের বাসিন্দাদের জন্য অনলাইন ভোটার তথ্য সেবা।",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="bn"><body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900`}>{children}</body></html>
  );
}