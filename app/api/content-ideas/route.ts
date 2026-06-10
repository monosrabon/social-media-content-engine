import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const used = searchParams.get('used');
    const platform = searchParams.get('platform');

    let query = supabase
      .from('content_ideas')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (used === 'true') query = query.eq('used', true);
    if (used === 'false') query = query.eq('used', false);
    if (platform) query = query.eq('platform', platform);

    const { data: ideas, error } = await query;
    if (error) throw error;
    return Response.json({ data: ideas || [] });
  } catch (error) {
    console.error('[GET /api/content-ideas]', error);
    return Response.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, used } = await request.json();
    if (!id) return Response.json({ error: 'Idea ID required' }, { status: 400 });

    const { data: idea } = await supabase.from('content_ideas').select('id').eq('id', id).eq('userId', session.user.id).single();
    if (!idea) return Response.json({ error: 'Idea not found' }, { status: 404 });

    const { data: updated, error } = await supabase.from('content_ideas').update({ used: used ?? true }).eq('id', id).select().single();
    if (error) throw error;
    return Response.json({ data: updated });
  } catch (error) {
    console.error('[PATCH /api/content-ideas]', error);
    return Response.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Idea ID required' }, { status: 400 });

    const { data: idea } = await supabase.from('content_ideas').select('id').eq('id', id).eq('userId', session.user.id).single();
    if (!idea) return Response.json({ error: 'Idea not found' }, { status: 404 });

    await supabase.from('content_ideas').delete().eq('id', id);
    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('[DELETE /api/content-ideas]', error);
    return Response.json({ error: 'Failed to delete idea' }, { status: 500 });
  }
}
