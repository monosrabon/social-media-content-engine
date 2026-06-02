/**
 * Dashboard Home Page
 *
 * Shows KPI cards, engagement chart, recent posts, and activity feed.
 * All data is fetched server-side for instant load.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { KPICards } from '@/components/dashboard/KPICards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EngagementChart } from '@/components/analytics/EngagementChart';
import { PostCard } from '@/components/content/PostCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

async function getDashboardData(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalPosts,
    publishedPosts,
    scheduledPosts,
    draftPosts,
    contentIdeas,
    recentPosts,
    recentActivities,
    analyticsData,
    analyticsAggregate,
  ] = await Promise.all([
    prisma.post.count({ where: { userId } }),
    prisma.post.count({ where: { userId, status: 'PUBLISHED' } }),
    prisma.post.count({ where: { userId, status: 'SCHEDULED' } }),
    prisma.post.count({ where: { userId, status: 'DRAFT' } }),
    prisma.contentIdea.count({ where: { userId } }),
    prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.analytics.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        impressions: true,
        reach: true,
        likes: true,
        comments: true,
        shares: true,
        engagementRate: true,
      },
    }),
    prisma.analytics.aggregate({
      where: { userId, date: { gte: thirtyDaysAgo } },
      _sum: { impressions: true, reach: true, followerGrowth: true },
      _avg: { engagementRate: true },
    }),
  ]);

  // Group analytics by date
  const chartMap = new Map<string, { date: string; impressions: number; reach: number; engagement: number; likes: number }>();
  for (const r of analyticsData) {
    const key = r.date.toISOString().split('T')[0];
    const ex = chartMap.get(key) || { date: key, impressions: 0, reach: 0, engagement: 0, likes: 0 };
    chartMap.set(key, {
      date: key,
      impressions: ex.impressions + r.impressions,
      reach: ex.reach + r.reach,
      likes: ex.likes + r.likes,
      engagement: parseFloat(((ex.engagement + r.engagementRate) / 2).toFixed(2)),
    });
  }

  return {
    stats: {
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
      contentIdeas,
      totalImpressions: analyticsAggregate._sum.impressions || 0,
      avgEngagementRate: parseFloat((analyticsAggregate._avg.engagementRate || 0).toFixed(2)),
      followerGrowth: analyticsAggregate._sum.followerGrowth || 0,
    },
    recentPosts,
    recentActivities,
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
