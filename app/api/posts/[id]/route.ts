/**
 * Single Post API Routes
 *
 * GET    /api/posts/[id]  — Get a single post
 * PATCH  /api/posts/[id]  — Update a post
 * DELETE /api/posts/[id]  — Delete a post
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  caption: z.string().optional().nullable(),
  hashtags: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'FAILED']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  contentScore: z.number().min(0).max(100).optional(),
  aiSummary: z.string().optional().nullable(),
});

// Helper: check post ownership
async function getOwnedPost(postId: string, userId: string) {
  return prisma.post.findFirst({
    where: { id: postId, userId },
  });
}

// ============================================================
// GET /api/posts/[id]
// ============================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const post = await prisma.post.findFirst({
      where: { id, userId: session.user.id },
      include: { analytics: { orderBy: { date: 'desc' }, take: 30 } },
    });

    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

    return Response.json({ data: post });
  } catch (error) {
    console.error('[GET /api/posts/[id]] Error:', error);
    return Response.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// ============================================================
// PATCH /api/posts/[id]
// ============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existingPost = await getOwnedPost(id, session.user.id);
    if (!existingPost) return Response.json({ error: 'Post not found' }, { status: 404 });

    const body = await request.json();
    const result = updatePostSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.caption !== undefined && { caption: data.caption }),
        ...(data.hashtags !== undefined && { hashtags: data.hashtags }),
        ...(data.platforms !== undefined && { platforms: data.platforms as any }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        }),
        ...(data.status === 'PUBLISHED' && { publishedAt: new Date() }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.contentScore !== undefined && { contentScore: data.contentScore }),
        ...(data.aiSummary !== undefined && { aiSummary: data.aiSummary }),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'POST_EDITED',
        description: `Edited post "${updatedPost.title}"`,
        metadata: { postId: updatedPost.id },
      },
    });

    return Response.json({ data: updatedPost });
  } catch (error) {
    console.error('[PATCH /api/posts/[id]] Error:', error);
    return Response.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/posts/[id]
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existingPost = await getOwnedPost(id, session.user.id);
    if (!existingPost) return Response.json({ error: 'Post not found' }, { status: 404 });

    // Delete analytics first (cascade would handle this, but explicit is safer)
    await prisma.analytics.deleteMany({ where: { postId: id } });
    await prisma.post.delete({ where: { id } });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'POST_DELETED',
        description: `Deleted post "${existingPost.title}"`,
        metadata: { postId: id },
      },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('[DELETE /api/posts/[id]] Error:', error);
    return Response.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
