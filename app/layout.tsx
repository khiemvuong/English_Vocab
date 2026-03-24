import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        className={`${inter.variable} antialiased selection:bg-blue-100 selection:text-blue-900 bg-slate-50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
