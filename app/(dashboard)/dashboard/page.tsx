/**
 * Dashboard Home Page
 *
 * Shows KPI cards, engagement chart, recent posts, and activity feed.
 * All data is fetched server-side for instant load.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';
import { KPICards } from '@/components/dashboard/KPICards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EngagementChart } from '@/components/analytics/EngagementChart';
import { PostCard } from '@/components/content/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

async function getDashboardData(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: scheduledPosts },
    { count: draftPosts },
    { count: contentIdeas },
    { data: recentPosts },
    { data: recentActivities },
    { data: analyticsData },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userId', userId),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userId', userId).eq('status', 'PUBLISHED'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userId', userId).eq('status', 'SCHEDULED'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userId', userId).eq('status', 'DRAFT'),
    supabase.from('content_ideas').select('*', { count: 'exact', head: true }).eq('userId', userId),
    supabase.from('posts').select('*').eq('userId', userId).order('createdAt', { ascending: false }).limit(4),
    supabase.from('activities').select('*').eq('userId', userId).order('createdAt', { ascending: false }).limit(8),
    supabase.from('analytics').select('date, impressions, reach, likes, engagementRate, followerGrowth').eq('userId', userId).gte('date', thirtyDaysAgo).order('date', { ascending: true }),
  ]);

  type AnalyticsRow = { date: string; impressions: number; reach: number; likes: number; engagementRate: number; followerGrowth: number };
  const records = (analyticsData || []) as AnalyticsRow[];
  const totals = records.reduce(
    (acc, r) => ({ impressions: acc.impressions + (r.impressions || 0), reach: acc.reach + (r.reach || 0), followerGrowth: acc.followerGrowth + (r.followerGrowth || 0), engagementSum: acc.engagementSum + (r.engagementRate || 0) }),
    { impressions: 0, reach: 0, followerGrowth: 0, engagementSum: 0 }
  );

  const chartMap = new Map<string, { date: string; impressions: number; reach: number; engagement: number; likes: number }>();
  for (const r of records) {
    const key = r.date.split('T')[0];
    const ex = chartMap.get(key) || { date: key, impressions: 0, reach: 0, engagement: 0, likes: 0 };
    chartMap.set(key, { date: key, impressions: ex.impressions + (r.impressions || 0), reach: ex.reach + (r.reach || 0), likes: ex.likes + (r.likes || 0), engagement: parseFloat(((ex.engagement + (r.engagementRate || 0)) / 2).toFixed(2)) });
  }

  return {
    stats: {
      totalPosts: totalPosts || 0,
      publishedPosts: publishedPosts || 0,
      scheduledPosts: scheduledPosts || 0,
      draftPosts: draftPosts || 0,
      contentIdeas: contentIdeas || 0,
      totalImpressions: totals.impressions,
      avgEngagementRate: records.length > 0 ? parseFloat((totals.engagementSum / records.length).toFixed(2)) : 0,
      followerGrowth: totals.followerGrowth,
    },
    recentPosts: (recentPosts || []) as any[],
    recentActivities: (recentActivities || []) as any[],
    chartData: Array.from(chartMap.values()),
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData(session!.user.id);
  const firstName = session?.user?.name?.split(' ')[0] || 'Creator';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {greeting}, {firstName}! 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your content today.
          </p>
        </div>
        <QuickActions />
      </div>

      {/* ── KPI Cards ── */}
      <KPICards stats={data.stats} />

      {/* ── Charts + Activity Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Chart — takes 2 cols */}
        <div className="lg:col-span-2">
          <EngagementChart data={data.chartData} />
        </div>
        {/* Recent Activity */}
        <RecentActivity activities={data.recentActivities} />
      </div>

      {/* ── Recent Posts ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Posts</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/content">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recentPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        {data.recentPosts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No posts yet. Create your first!</p>
              <Button asChild>
                <Link href="/content/new">Create Post</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
