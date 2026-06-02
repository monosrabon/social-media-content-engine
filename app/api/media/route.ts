/**
 * Media API
 *
 * GET  /api/media       — List all media for current user
 * POST /api/media       — Upload new media (multipart/form-data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function getMediaType(mimeType: string): 'IMAGE' | 'VIDEO' | 'GIF' | 'DOCUMENT' {
  if (mimeType === 'image/gif') return 'GIF';
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  return 'DOCUMENT';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const media = await prisma.media.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: media });
  } catch (error) {
    console.error('[GET /api/media] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // NOTE: In production, files would be uploaded to Supabase Storage here.
    // For now we store metadata with a placeholder URL so the rest of the app
    // works end-to-end without a storage bucket configured.
    const created = await Promise.all(
      files.map(async (file) => {
        const mimeType = file.type || 'application/octet-stream';
        const mediaType = getMediaType(mimeType);
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

        // Placeholder URL — replace with actual Supabase upload in production
        const url = `/api/media/placeholder/${filename}`;

        return prisma.media.create({
          data: {
            filename,
            originalName: file.name,
            mimeType,
            size: file.size,
            url,
            mediaType,
            userId: session.user!.id!,
            tags: [],
          },
        });
      })
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/media] Error:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}
