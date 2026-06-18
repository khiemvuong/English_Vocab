import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RouteTransitionLoader } from "@/components/common/RouteTransitionLoader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TOEIC Intensive",
  description: "Elegant TOEIC Learning Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased selection:bg-blue-950 selection:text-blue-200 bg-slate-950 text-slate-100`}
      >
        <RouteTransitionLoader />
        {children}
      </body>
    </html>
  );
}
