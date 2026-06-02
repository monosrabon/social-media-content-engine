/**
 * Media Item API
 *
 * GET    /api/media/[id]  — Get single media item
 * PATCH  /api/media/[id]  — Update alt text / tags
 * DELETE /api/media/[id]  — Delete media item
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const item = await prisma.media.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data: item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { alt, tags } = body;

    const updated = await prisma.media.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: {
        ...(alt !== undefined ? { alt } : {}),
        ...(tags !== undefined ? { tags } : {}),
      },
    });

    return NextResponse.json({ data: { updated: updated.count } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.media.deleteMany({
      where: { id: params.id, userId: session.user.id },
    });

    // NOTE: In production, also delete from Supabase Storage here.

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
