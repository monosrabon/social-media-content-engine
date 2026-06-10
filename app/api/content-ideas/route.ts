/**
 * Content Ideas API
 * GET  /api/content-ideas  — List saved ideas for the user
 * POST /api/content-ideas  — Mark idea as used / create manually
 * DELETE /api/content-ideas/[id] — Delete an idea
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/content-ideas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const used = searchParams.get('used'); // 'true' | 'false' | null (all)
    const platform = searchParams.get('platform');

    const where: Record<string, unknown> = { userId: session.user.id };
    if (used === 'true') where.used = true;
    if (used === 'false') where.used = false;
    if (platform) where.platform = platform;

    const ideas = await prisma.contentIdea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return Response.json({ data: ideas });
  } catch (error) {
    console.error('[GET /api/content-ideas] Error:', error);
    return Response.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
}

// PATCH /api/content-ideas — mark idea as used
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, used } = await request.json();
    if (!id) return Response.json({ error: 'Idea ID required' }, { status: 400 });

    const idea = await prisma.contentIdea.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!idea) return Response.json({ error: 'Idea not found' }, { status: 404 });

    const updated = await prisma.contentIdea.update({
      where: { id },
      data: { used: used ?? true },
    });

    return Response.json({ data: updated });
  } catch (error) {
    console.error('[PATCH /api/content-ideas] Error:', error);
    return Response.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

// DELETE /api/content-ideas — delete an idea by ?id=...
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Idea ID required' }, { status: 400 });

    const idea = await prisma.contentIdea.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!idea) return Response.json({ error: 'Idea not found' }, { status: 404 });

    await prisma.contentIdea.delete({ where: { id } });

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('[DELETE /api/content-ideas] Error:', error);
    return Response.json({ error: 'Failed to delete idea' }, { status: 500 });
  }
}
