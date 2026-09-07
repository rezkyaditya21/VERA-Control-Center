import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VERA Control Center — Platform Operations',
  description: 'Enterprise moderation and administrative platform for VERA Social Decision Platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen antialiased bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
