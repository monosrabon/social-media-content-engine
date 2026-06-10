import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
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
      supabase.from('posts').select('id, title, status, platforms, contentScore, createdAt, publishedAt, scheduledAt').eq('userId', userId).order('createdAt', { ascending: false }).limit(5),
      supabase.from('activities').select('*').eq('userId', userId).order('createdAt', { ascending: false }).limit(10),
      supabase.from('analytics').select('impressions, reach, likes, followerGrowth, engagementRate').eq('userId', userId).gte('date', thirtyDaysAgo),
    ]);

    const totals = (analyticsData || []).reduce(
      (acc, r) => ({
        impressions: acc.impressions + (r.impressions || 0),
        reach: acc.reach + (r.reach || 0),
        likes: acc.likes + (r.likes || 0),
        followerGrowth: acc.followerGrowth + (r.followerGrowth || 0),
        engagementSum: acc.engagementSum + (r.engagementRate || 0),
      }),
      { impressions: 0, reach: 0, likes: 0, followerGrowth: 0, engagementSum: 0 }
    );

    const avgEngagementRate = analyticsData && analyticsData.length > 0
      ? parseFloat((totals.engagementSum / analyticsData.length).toFixed(2))
      : 0;

    return Response.json({
      data: {
        stats: {
          totalPosts: totalPosts || 0,
          publishedPosts: publishedPosts || 0,
          scheduledPosts: scheduledPosts || 0,
          draftPosts: draftPosts || 0,
          contentIdeas: contentIdeas || 0,
          totalImpressions: totals.impressions,
          totalReach: totals.reach,
          totalLikes: totals.likes,
          avgEngagementRate,
          followerGrowth: totals.followerGrowth,
        },
        recentPosts: recentPosts || [],
        recentActivities: recentActivities || [],
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard]', error);
    return Response.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
