import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/suppress-deprecations";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { PageTransition } from "@/components/animations/PageTransition";
import { CursorSpotlight } from "@/components/animations/CursorSpotlight";

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
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 relative">
        <CursorSpotlight />
        <Providers>
          <AnnouncementBanner />
          <Navbar />
          <main className="flex-1 flex flex-col overflow-x-hidden relative z-10">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
        </Providers>
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              border: '1px solid rgba(30, 41, 59, 0.6)',
              background: 'rgba(17, 24, 39, 0.95)',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </body>
    </html>
  );
}
