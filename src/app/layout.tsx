import type { Metadata } from "next";
import { Noto_Sans_KR } from 'next/font/google';
import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const noto = Noto_Sans_KR({
  variable: '--font-noto',
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "더치페이 v1.1",
  description: "더치페이 - URL로 공유 가능한 분할 결제 생성기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${noto.variable} antialiased flex min-h-screen flex-col`}
        style={{ minWidth: '280px' }}
      >
          <Header title="LEEDS" />
          <main className="flex-1">{children}</main>
          <Footer />
      </body>
    </html>
  );
}
