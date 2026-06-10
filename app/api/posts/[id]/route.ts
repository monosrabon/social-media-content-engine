import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, analytics(*)')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single();

    if (error || !post) return Response.json({ error: 'Post not found' }, { status: 404 });
    return Response.json({ data: post });
  } catch (error) {
    console.error('[GET /api/posts/[id]]', error);
    return Response.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: existing } = await supabase.from('posts').select('id, title').eq('id', id).eq('userId', session.user.id).single();
    if (!existing) return Response.json({ error: 'Post not found' }, { status: 404 });

    const body = await request.json();
    const result = updatePostSchema.safeParse(body);
    if (!result.success) return Response.json({ error: result.error.issues[0].message }, { status: 400 });

    const updates: Record<string, unknown> = { ...result.data };
    if (result.data.status === 'PUBLISHED') updates.publishedAt = new Date().toISOString();

    const { data: post, error } = await supabase.from('posts').update(updates).eq('id', id).select().single();
    if (error) throw error;

    await supabase.from('activities').insert({
      userId: session.user.id,
      type: 'POST_EDITED',
      description: `Edited post "${existing.title}"`,
      metadata: { postId: id },
    });

    return Response.json({ data: post });
  } catch (error) {
    console.error('[PATCH /api/posts/[id]]', error);
    return Response.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: existing } = await supabase.from('posts').select('id, title').eq('id', id).eq('userId', session.user.id).single();
    if (!existing) return Response.json({ error: 'Post not found' }, { status: 404 });

    await supabase.from('analytics').delete().eq('postId', id);
    await supabase.from('posts').delete().eq('id', id);

    await supabase.from('activities').insert({
      userId: session.user.id,
      type: 'POST_DELETED',
      description: `Deleted post "${existing.title}"`,
      metadata: { postId: id },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('[DELETE /api/posts/[id]]', error);
    return Response.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
