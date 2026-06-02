/**
 * Root Layout
 * Wraps the entire app with providers: ThemeProvider, SessionProvider, Toaster
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ContentEngine — AI Social Media Platform',
    template: '%s | ContentEngine',
  },
  description:
    'AI-powered social media content engine for creators, agencies, and marketing teams. Create, schedule, and analyze content across all platforms.',
  keywords: ['social media', 'content creator', 'AI', 'scheduling', 'analytics'],
  authors: [{ name: 'ContentEngine' }],
  creator: 'ContentEngine',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'ContentEngine — AI Social Media Platform',
    description: 'AI-powered social media content engine for creators and agencies.',
    siteName: 'ContentEngine',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
