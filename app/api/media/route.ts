import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';

function getMediaType(mimeType: string): 'IMAGE' | 'VIDEO' | 'GIF' | 'DOCUMENT' {
  if (mimeType === 'image/gif') return 'GIF';
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  return 'DOCUMENT';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data: media || [] });
  } catch (error) {
    console.error('[GET /api/media]', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 });

    const inserts = files.map((file) => {
      const mimeType = file.type || 'application/octet-stream';
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      return {
        filename,
        originalName: file.name,
        mimeType,
        size: file.size,
        url: `/api/media/placeholder/${filename}`,
        mediaType: getMediaType(mimeType),
        userId: session.user!.id!,
        tags: [],
      };
    });

    const { data: created, error } = await supabase.from('media').insert(inserts).select();
    if (error) throw error;
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/media]', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}
