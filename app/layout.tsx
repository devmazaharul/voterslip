import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://voterserial.vercel.app"),
  title: {
    default: "ভোটকেন্দ্র ও ভোটার তথ্য অনুসন্ধান | যশোর সদর • ১৪ নং ইউনিয়ন",
    template: "%s | যশোর সদর ডিজিটাল সেবা",
  },
  description: "যশোর সদর উপজেলার ১৪ নং ইউনিয়নের ভোটার তালিকা, ভোটকেন্দ্র এবং ভোটার নম্বর অনলাইনে অনুসন্ধান করুন। জন্ম তারিখ ও গ্রাম দিয়ে সহজেই আপনার তথ্য যাচাই করুন।",
  keywords: ["ভোটার তথ্য", "যশোর সদর", "১৪ নং ইউনিয়ন", "ভোটকেন্দ্র", "বাংলাদেশ নির্বাচন কমিশন", "NID Info", "Jashore Sadar", "Narendrapur Union"],
  authors: [{ name: "Mazaharul Islam", url: "https://mazaharul.site" }],
  creator: "Mazaharul Islam",
  publisher: "Jashore Sadar Digital Seba",
  openGraph: {
    title: "ভোটকেন্দ্র ও ভোটার তথ্য অনুসন্ধান | যশোর সদর",
    description: "আপনার জন্ম তারিখ এবং গ্রামের নাম দিয়ে সহজেই ভোটার তথ্য ও ভোটকেন্দ্র খুঁজে বের করুন।",
    url: "https://voterserial.vercel.app",
    siteName: "যশোর সদর ডিজিটাল সেবা",
    images: [
      {
        url: "/voting_system_2.jpg",
        width: 1200,
        height: 630,
        alt: "Jashore Sadar Voter Info Search Portal",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ভোটার তথ্য অনুসন্ধান - যশোর সদর ১৪ নং ইউনিয়ন",
    description: "অনলাইনে আপনার ভোটকেন্দ্র এবং ভোটার তথ্য যাচাই করুন।",
    images: ["/voting_system_2.jpg"],
    creator: "@mazaharul",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900`}>{children}</body>
    </html>
  );
}