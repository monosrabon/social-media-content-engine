/**
 * Custom 404 Not Found Page
 *
 * Shown when navigating to a route that doesn't exist.
 */

import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Large 404 */}
        <div className="space-y-1">
          <p className="text-8xl font-black text-primary/20 select-none leading-none">
            404
          </p>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileQuestion className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>

        {/* Quick links */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Or try one of these:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { href: '/content', label: 'Content' },
              { href: '/calendar', label: 'Calendar' },
              { href: '/analytics', label: 'Analytics' },
              { href: '/media', label: 'Media' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
