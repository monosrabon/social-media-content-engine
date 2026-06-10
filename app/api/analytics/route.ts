import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const platform = searchParams.get('platform');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const userId = session.user.id;

    let query = supabase
      .from('analytics')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (platform) query = query.eq('platform', platform);

    const { data: analyticsRecords } = await query;
    const records = analyticsRecords || [];

    // Aggregate chart data by day
    const chartMap = new Map<string, Record<string, number>>();
    for (const r of records) {
      const dateKey = r.date.split('T')[0];
      const existing = chartMap.get(dateKey) || { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, engagement: 0, count: 0 };
      chartMap.set(dateKey, {
        impressions: existing.impressions + (r.impressions || 0),
        reach: existing.reach + (r.reach || 0),
        likes: existing.likes + (r.likes || 0),
        comments: existing.comments + (r.comments || 0),
        shares: existing.shares + (r.shares || 0),
        engagement: existing.engagement + (r.engagementRate || 0),
        count: existing.count + 1,
      });
    }

    const chartData = Array.from(chartMap.entries()).map(([date, v]) => ({
      date,
      impressions: v.impressions,
      reach: v.reach,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      engagement: v.count > 0 ? parseFloat((v.engagement / v.count).toFixed(2)) : 0,
    }));

    const totals = records.reduce(
      (acc, r) => ({
        impressions: acc.impressions + (r.impressions || 0),
        reach: acc.reach + (r.reach || 0),
        likes: acc.likes + (r.likes || 0),
        comments: acc.comments + (r.comments || 0),
        shares: acc.shares + (r.shares || 0),
        saves: acc.saves + (r.saves || 0),
        followerGrowth: acc.followerGrowth + (r.followerGrowth || 0),
        engagementSum: acc.engagementSum + (r.engagementRate || 0),
      }),
      { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, followerGrowth: 0, engagementSum: 0 }
    );

    const avgEngagementRate = records.length > 0 ? parseFloat((totals.engagementSum / records.length).toFixed(2)) : 0;

    const [
      { count: totalPosts }, { count: publishedPosts }, { count: scheduledPosts },
      { count: draftPosts }, { count: contentIdeas },
    ] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userId', userId),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userId', userId).eq('status', 'PUBLISHED'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userId', userId).eq('status', 'SCHEDULED'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userId', userId).eq('status', 'DRAFT'),
      supabase.from('content_ideas').select('*', { count: 'exact', head: true }).eq('userId', userId),
    ]);

    return Response.json({
      data: {
        summary: { totalImpressions: totals.impressions, totalReach: totals.reach, totalLikes: totals.likes, totalComments: totals.comments, totalShares: totals.shares, totalSaves: totals.saves, avgEngagementRate, totalFollowerGrowth: totals.followerGrowth },
        chartData,
        dashboardStats: { totalPosts: totalPosts || 0, publishedPosts: publishedPosts || 0, scheduledPosts: scheduledPosts || 0, draftPosts: draftPosts || 0, totalImpressions: totals.impressions, avgEngagementRate, followerGrowth: totals.followerGrowth, contentIdeas: contentIdeas || 0 },
      },
    });
  } catch (error) {
    console.error('[GET /api/analytics]', error);
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
