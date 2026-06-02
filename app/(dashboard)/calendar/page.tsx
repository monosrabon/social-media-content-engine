'use client';

/**
 * Calendar Page — Month view + upcoming list view toggle
 */

import { useState, useEffect } from 'react';
import { Post } from '@prisma/client';
import { ContentCalendar } from '@/components/calendar/ContentCalendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, List, Loader2, Plus, Clock, CheckCircle2, FileEdit } from 'lucide-react';
import { formatDateTime, STATUS_COLORS } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_ICON: Record<string, React.ElementType> = {
  DRAFT: FileEdit,
  SCHEDULED: Clock,
  PUBLISHED: CheckCircle2,
};

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts?limit=200');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setPosts(json.data);
      } catch {
        toast.error('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Upcoming: scheduled posts sorted by scheduledAt asc
  const upcoming = posts
    .filter(p => p.status === 'SCHEDULED' && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">
            {posts.length} total · {upcoming.length} scheduled upcoming
          </p>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'calendar' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Month
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
          <Button asChild>
            <Link href="/content/new">
              <Plus className="w-4 h-4 mr-2" /> New Post
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main view */}
          <div className={view === 'calendar' ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {view === 'calendar' ? (
              <ContentCalendar posts={posts} />
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-0">
                  {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
                      <p className="font-medium">No posts yet</p>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Create your first post to get started.
                      </p>
                      <Button asChild variant="outline">
                        <Link href="/content/new"><Plus className="w-4 h-4 mr-2" /> Create Post</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {posts
                        .sort((a, b) => {
                          const da = a.scheduledAt || a.createdAt;
                          const db = b.scheduledAt || b.createdAt;
                          return new Date(db).getTime() - new Date(da).getTime();
                        })
                        .map(post => {
                          const StatusIcon = STATUS_ICON[post.status] || FileEdit;
                          const date = post.scheduledAt || post.publishedAt || post.createdAt;
                          return (
                            <Link key={post.id} href={`/content/${post.id}/edit`}>
                              <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group">
                                <StatusIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                    {post.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(date)}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {post.platforms.slice(0, 3).map(p => (
                                    <Badge key={p} variant="outline" className="text-[10px] h-5">{p}</Badge>
                                  ))}
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[post.status]}`}>
                                    {post.status}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upcoming sidebar — only in calendar mode */}
          {view === 'calendar' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Upcoming ({upcoming.length})
              </h3>
              {upcoming.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    No scheduled posts
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {upcoming.slice(0, 10).map(post => (
                    <Link key={post.id} href={`/content/${post.id}/edit`}>
                      <Card className="border-border/50 hover:border-primary/40 transition-colors cursor-pointer">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium truncate">{post.title}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            <p className="text-[11px] text-muted-foreground">
                              {formatDateTime(post.scheduledAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {post.platforms.map(p => (
                              <Badge key={p} variant="outline" className="text-[10px] h-4 px-1">{p}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {upcoming.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{upcoming.length - 10} more scheduled
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
