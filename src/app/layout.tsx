import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ variable: '--font-sans', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'MARK8 — Menswear & Womenswear', template: '%s · MARK8' },
  description: 'Clothing, footwear and accessories for men and women. Designed in-house, delivered across India.',
  icons: { icon: '/favicon.png' },
};

export const viewport: Viewport = {
  themeColor: '#f4f4f6',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
