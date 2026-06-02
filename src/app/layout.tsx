import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/suppress-deprecations";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Toaster } from "sonner";
import { PageTransition } from "@/components/animations/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusCoder - Student Coding Community",
  description: "A student coding community for workshops, coding practice, placement preparation, and peer learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
        <AnnouncementBanner />
        <Navbar />
        <main className="flex-1 flex flex-col overflow-x-hidden">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <Footer />
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
