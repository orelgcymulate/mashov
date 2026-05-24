import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import { ReactNode } from 'react';
import { Providers } from './providers';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'דשבורד משפחתי',
  description: 'משימות, מערכת וציונים של הילדים',
  // PWA: enables Add-to-Home-Screen with the manifest icons, standalone UI,
  // and an iOS-friendly home-screen experience (no browser chrome).
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'משפחה',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f4a52a',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={heebo.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
