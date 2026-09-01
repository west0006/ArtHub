import type { Metadata } from 'next';
import './globals.css';
import '@/styles/components.css';

export const metadata: Metadata = {
  title: '艺栈',
  description: '灵感·订单·素材·AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}