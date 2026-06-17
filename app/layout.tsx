import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession, IDLE_TIMEOUT_SECONDS } from "@/lib/session";
import { IdleTimeout } from "@/components/IdleTimeout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CFH LMS — เรียนเขียนโค้ดและเทคโนโลยี",
  description: "คอร์สเรียนเขียนโค้ดและเทคโนโลยี เช่น Web Development พร้อม Lab เขียนโค้ดได้ทันที",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <IdleTimeout enabled={!!session} idleSeconds={IDLE_TIMEOUT_SECONDS} />
        {children}
      </body>
    </html>
  );
}
