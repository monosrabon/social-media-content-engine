/**
 * Posts API Routes
 *
 * GET  /api/posts  — List posts for the authenticated user
 * POST /api/posts  — Create a new post
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { n8n } from '@/lib/n8n';
import { z } from 'zod';

// Input validation schema
const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional().default([]),
  platforms: z.array(z.string()).optional().default([]),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).optional().default('DRAFT'),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

// ============================================================
// GET /api/posts
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status) where.status = status;
    if (platform) where.platforms = { has: platform };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          analytics: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return Response.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/posts] Error:', error);
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// ============================================================
// POST /api/posts
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createPostSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        title: data.title,
        content: data.content,
        caption: data.caption,
        hashtags: data.hashtags,
        platforms: data.platforms as any,
        status: data.status as any,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        tags: data.tags,
        notes: data.notes,
        imageUrl: data.imageUrl,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'POST_CREATED',
        description: `Created post "${post.title}"`,
        metadata: { postId: post.id, status: post.status },
      },
    });

    // Trigger n8n workflows (non-blocking)
    n8n.onPostCreated({
      id: post.id,
      title: post.title,
      status: post.status,
      platforms: post.platforms,
      userId: session.user.id,
    }).catch(console.warn);

    if (post.status === 'SCHEDULED' && post.scheduledAt) {
      n8n.onPostScheduled({
        id: post.id,
        title: post.title,
        scheduledAt: post.scheduledAt.toISOString(),
        platforms: post.platforms,
        userId: session.user.id,
      }).catch(console.warn);
    }

    return Response.json({ data: post }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/posts] Error:', error);
    return Response.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
