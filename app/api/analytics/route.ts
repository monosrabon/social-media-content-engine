/**
 * Analytics API
 * GET /api/analytics — Returns chart data and summary stats
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const platform = searchParams.get('platform') || undefined;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch analytics records
    const analyticsRecords = await prisma.analytics.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate },
        ...(platform ? { platform: platform as any } : {}),
      },
      orderBy: { date: 'asc' },
    });

    // Aggregate chart data by day
    const chartMap = new Map<string, {
      date: string;
      impressions: number;
      reach: number;
      likes: number;
      comments: number;
      shares: number;
      engagement: number;
    }>();

    for (const record of analyticsRecords) {
      const dateKey = record.date.toISOString().split('T')[0];
      const existing = chartMap.get(dateKey) || {
        date: dateKey,
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagement: 0,
      };

      chartMap.set(dateKey, {
        date: dateKey,
        impressions: existing.impressions + record.impressions,
        reach: existing.reach + record.reach,
        likes: existing.likes + record.likes,
        comments: existing.comments + record.comments,
        shares: existing.shares + record.shares,
        engagement: parseFloat(((existing.engagement + record.engagementRate) / 2).toFixed(2)),
      });
    }

    const chartData = Array.from(chartMap.values());

    // Calculate summary totals
    const totals = analyticsRecords.reduce(
      (acc, r) => ({
        impressions: acc.impressions + r.impressions,
        reach: acc.reach + r.reach,
        likes: acc.likes + r.likes,
        comments: acc.comments + r.comments,
        shares: acc.shares + r.shares,
        saves: acc.saves + r.saves,
        followerGrowth: acc.followerGrowth + r.followerGrowth,
        engagementSum: acc.engagementSum + r.engagementRate,
      }),
      { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, followerGrowth: 0, engagementSum: 0 }
    );

    const avgEngagementRate = analyticsRecords.length > 0
      ? parseFloat((totals.engagementSum / analyticsRecords.length).toFixed(2))
      : 0;

    // Dashboard stats
    const [totalPosts, publishedPosts, scheduledPosts, draftPosts, contentIdeas] = await Promise.all([
      prisma.post.count({ where: { userId: session.user.id } }),
      prisma.post.count({ where: { userId: session.user.id, status: 'PUBLISHED' } }),
      prisma.post.count({ where: { userId: session.user.id, status: 'SCHEDULED' } }),
      prisma.post.count({ where: { userId: session.user.id, status: 'DRAFT' } }),
      prisma.contentIdea.count({ where: { userId: session.user.id } }),
    ]);

    return Response.json({
      data: {
        summary: {
          totalImpressions: totals.impressions,
          totalReach: totals.reach,
          totalLikes: totals.likes,
          totalComments: totals.comments,
          totalShares: totals.shares,
          totalSaves: totals.saves,
          avgEngagementRate,
          totalFollowerGrowth: totals.followerGrowth,
        },
        chartData,
        dashboardStats: {
          totalPosts,
          publishedPosts,
          scheduledPosts,
          draftPosts,
          totalImpressions: totals.impressions,
          avgEngagementRate,
          followerGrowth: totals.followerGrowth,
          contentIdeas,
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/analytics] Error:', error);
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
