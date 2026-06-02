'use client';

/**
 * Header Component
 * Top bar with page title, global search, live notification badge, and theme toggle.
 */

import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/content': 'Content Manager',
  '/content/new': 'Create New Post',
  '/calendar': 'Content Calendar',
  '/analytics': 'Analytics',
  '/media': 'Media Library',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.includes('/content/') && pathname.includes('/edit')) return 'Edit Post';
  return 'ContentEngine';
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);

  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Poll for unread notification count every 60s
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true');
        if (res.ok) {
          const json = await res.json();
          setUnreadCount(json.data?.unreadCount ?? 0);
        }
      } catch { /* silent */ }
    };
    fetch_();
    const interval = setInterval(fetch_, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Reset unread badge when visiting notifications page
  useEffect(() => {
    if (pathname === '/notifications') setUnreadCount(0);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/content?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Page title */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search posts…"
            className="pl-9 pr-16 w-56 h-9 bg-muted border-0 focus-visible:ring-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border rounded px-1 hidden lg:block">
            ⌘K
          </kbd>
        </form>

        {/* Notifications bell with live badge */}
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center px-0.5 tabular-nums">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
