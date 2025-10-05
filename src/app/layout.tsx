import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import AppProviders from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RFL Dashboard - Rotary Fitness League",
  description: "Dashboard for RFL team management and workout tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders>
          <Navbar />
          <main className="min-h-screen bg-rfl-peach">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
