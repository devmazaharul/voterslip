import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Geist_Mono } from "next/font/google";
import "./globals.css";

const anekBangla = Anek_Bangla({
  variable: "--font-geist-sans",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8fafc",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://voterserial.vercel.app"),
  title: {
    default: "ভোটকেন্দ্র ও ভোটার তথ্য অনুসন্ধান | যশোর সদর • ১৪ নং ইউনিয়ন",
    template: "%s | যশোর সদর ডিজিটাল সেবা",
  },
  description:
    "যশোর সদর উপজেলার ১৪ নং ইউনিয়নের ভোটার তালিকা, ভোটকেন্দ্র এবং ভোটার নম্বর অনলাইনে অনুসন্ধান করুন। জন্ম তারিখ ও গ্রাম দিয়ে সহজেই আপনার তথ্য যাচাই করুন।",
  keywords: [
    "ভোটার তথ্য",
    "যশোর সদর",
    "১৪ নং ইউনিয়ন",
    "নরেন্দ্রপুর ইউনিয়ন",
    "ভোটকেন্দ্র",
    "ভোটার নম্বর",
    "বাংলাদেশ নির্বাচন কমিশন",
    "NID Info",
    "Jashore Sadar",
    "Narendrapur Union",
    "Voter Serial Number",
  ],
  authors: [{ name: "Mazaharul", url: "https://bymaza.me" }],
  creator: "Mazaharul",
  publisher: "Jashore Sadar Digital Seba",
  category: "Government Services",
  alternates: {
    canonical: "https://voterserial.vercel.app",
    languages: {
      "bn-BD": "https://voterserial.vercel.app",
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
  verification: {
    google: "your-google-site-verification-code",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className={`${anekBangla.variable} ${geistMono.variable} antialiased bg-slate-50 touch-manipulation overscroll-none`}>
        {children}
      </body>
    </html>
  );
}