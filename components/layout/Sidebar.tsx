'use client';

/**
 * Sidebar Navigation Component
 *
 * The main navigation for the dashboard. Features:
 * - Branded logo with gradient
 * - Active route highlighting
 * - Collapsed/expanded state support
 * - User profile at the bottom
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
  Image,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Zap,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/content', label: 'Content', icon: FileText },
  { href: '/content/ideas', label: 'Content Ideas', icon: Lightbulb, indent: true },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/media', label: 'Media', icon: Image },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-brand shadow-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold gradient-brand-text">ContentEngine</span>
          <p className="text-[10px] text-muted-foreground -mt-0.5">AI Social Platform</p>
        </div>
      </div>

      {/* ── Quick Create Button ── */}
      <div className="px-4 pt-4">
        <Button asChild className="w-full" size="sm">
          <Link href="/content/new">
            <Sparkles className="w-4 h-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Main Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/content' && pathname.startsWith(item.href + '/'));
          const isContentActive = item.href === '/content' && pathname === '/content';
          const active = isActive || isContentActive;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 group',
                (item as any).indent ? 'px-3 py-2 ml-3 pl-6' : 'px-3 py-2.5',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className={cn(
                'flex-shrink-0 transition-colors',
                (item as any).indent ? 'w-4 h-4' : 'w-4.5 h-4.5',
                active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              <span className="flex-1">{item.label}</span>
              {active && (
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            System
          </p>
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── User Profile ── */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent transition-colors group">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="text-xs">
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
