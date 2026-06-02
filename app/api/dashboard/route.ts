/**
 * Dashboard Stats API
 * GET /api/dashboard
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
      contentIdeas,
      recentPosts,
      recentActivities,
      analytics,
    ] = await Promise.all([
      prisma.post.count({ where: { userId } }),
      prisma.post.count({ where: { userId, status: 'PUBLISHED' } }),
      prisma.post.count({ where: { userId, status: 'SCHEDULED' } }),
      prisma.post.count({ where: { userId, status: 'DRAFT' } }),
      prisma.contentIdea.count({ where: { userId } }),
      prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          platforms: true,
          contentScore: true,
          createdAt: true,
          publishedAt: true,
          scheduledAt: true,
        },
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.analytics.aggregate({
        where: { userId, date: { gte: thirtyDaysAgo } },
        _sum: {
          impressions: true,
          reach: true,
          likes: true,
          followerGrowth: true,
        },
        _avg: {
          engagementRate: true,
        },
      }),
    ]);

    return Response.json({
      data: {
        stats: {
          totalPosts,
          publishedPosts,
          scheduledPosts,
          draftPosts,
          contentIdeas,
          totalImpressions: analytics._sum.impressions || 0,
          totalReach: analytics._sum.reach || 0,
          totalLikes: analytics._sum.likes || 0,
          avgEngagementRate: parseFloat((analytics._avg.engagementRate || 0).toFixed(2)),
          followerGrowth: analytics._sum.followerGrowth || 0,
        },
        recentPosts,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard] Error:', error);
    return Response.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
