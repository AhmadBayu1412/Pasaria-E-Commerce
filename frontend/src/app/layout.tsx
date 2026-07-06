/**
 * Root Layout
 *
 * Base HTML structure with AuthProvider.
 * Does NOT include Navbar/Footer - those are in (main) route group.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/features/auth/auth-provider";
import { ToastContainer } from "@/components/ui";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pasaria - Pasar Indonesia Online",
  description: "Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-slate-50">
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
