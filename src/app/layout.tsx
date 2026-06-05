import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '公司点评',
  description: '公司点评平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
