/**
 * Providers Component
 * Centralizes all context providers so RootLayout stays clean.
 *
 * Includes:
 * - SessionProvider: makes auth session available everywhere
 * - ThemeProvider: handles dark/light mode
 * - Toaster: toast notifications
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: 'hsl(142, 76%, 36%)',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: 'hsl(0, 84%, 60%)',
                secondary: 'white',
              },
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
